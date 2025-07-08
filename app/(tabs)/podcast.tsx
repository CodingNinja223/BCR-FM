import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
  SafeAreaView,
  Alert,
  RefreshControl,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import YoutubePlayer from 'react-native-youtube-iframe';
import ThemeToggle from '../../components/ThemeToggle';
import { useTheme } from '../../components/theme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Audio } from 'expo-av';
import { WebView } from 'react-native-webview';
import { db } from '../../firebase';
import { ref, get, remove, update, onValue } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';

const YOUTUBE_API_KEY = 'AIzaSyDh6oZ11xECShHkRGaXKC3W-nm_znOuqXw';
const GOOGLE_DRIVE_API_KEY = 'AIzaSyC7htNqdTDd_O5c7a_EXltYDKGnkvo1FUU';
const OPENWEATHER_API_KEY = '3cce09f14c0b8abc01db3eef1aeb4af9';

// --- Type Definitions ---
type VideoItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails: { high: { url: string } };
  };
};

type DriveFolder = {
  id: string;
  name: string;
};

type AudioItem = {
  id: string;
  name: string;
  url: string;
};

// --- Constants ---
const CHANNEL_ID = 'UCiNg1Q8Uqi88eT33CQcIxZA';
const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = SCREEN_WIDTH / NUM_COLUMNS - 20;

const ROOT_FOLDER_ID = '1XAmpzqBJYlQ4U2OfOxdZy54vAOcK07J9';

const BASE_URL = 'http://bcrfm104.co.za.dedi1222.jnb1.host-h.net/wp-json/wp/v2/posts?_embed';

interface WPPost {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  _embedded?: {
    'wp:featuredmedia'?: [{ source_url: string }];
  };
}

interface WeatherData {
  id: number;
  name: string;
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
  main: string;
}

const categories = [
  { id: 0, name: 'All' },
  { id: 99, name: 'Weather' },
  { id: 1, name: 'Top Stories' },
];

const EMOJIS = [
  { key: 'love', emoji: '❤️' },
  { key: 'laugh', emoji: '😂' },
  { key: 'hug', emoji: '🤗' },
  { key: 'thumb', emoji: '👍' },
  { key: 'cry', emoji: '😢' },
];

const MPUMALANGA_TOWNS = [
  { id: 6, name: 'Baberton', lat: -25.4366, lon: 31.0531 },
  { id: 1, name: 'Nelspruit', lat: -25.4658, lon: 30.9854 },
  { id: 2, name: 'Emalahleni', lat: -26.1935, lon: 29.1658 },
  { id: 3, name: 'Middelburg', lat: -25.7743, lon: 29.4716 },
  { id: 4, name: 'Secunda', lat: -26.5657, lon: 30.1897 },
  { id: 5, name: 'Mbombela', lat: -25.4736, lon: 30.9700 },
  { id: 7, name: 'Nkomazi', lat: -25.7481, lon: 31.9436 },
  { id: 8, name: 'Witbank', lat: -25.8767, lon: 29.2414 },
];

// Lottie animation imports (put your downloaded files in assets/animations/)
const sunAnim = require('../../assets/images/hot.json');
const rainAnim = require('../../assets/images/RainingCloudLightning.json');
const snowAnim = require('../../assets/images/snow.json');
const cloudAnim = require('../../assets/images/SunC.json');
const defaultAnim = require('../../assets/images/hot.json');
const coldSunAnim = require('../../assets/images/cold.json');

function getWeatherAnim(main: string, temp: number) {
  if (main === 'Clear') {
    if (temp >= 26) return sunAnim;  // Hot and clear
    if (temp >= 19 && temp <= 25) return sunAnim; // Mild and clear (could be same or different animation)
    if (temp < 17) return coldSunAnim || sunAnim; // Cold but clear, optionally a different animation
  }
  if (main === 'Rain' || main === 'Drizzle' || main === 'Thunderstorm') return rainAnim;
  if (main === 'Snow') return snowAnim;
  if (main === 'Clouds') return cloudAnim;
  return defaultAnim;
}

function getTempColor(temp: number) {
  if (temp >= 26) return '#FF9800'; // hot (orange)
  if (temp >= 19 && temp <= 25) return '#FFD700'; // mild/cloudy and sunny (golden/yellow)
  if (temp < 17) return '#00BFFF'; // really cold (blue)
  return '#003366'; // for temperatures between 17 and 18 (optional category)
}

// Enhanced Device Identification
const getDeviceId = async (): Promise<string> => {
  try {
    const storedId = await AsyncStorage.getItem('@deviceId_v2');
    if (storedId) return storedId;
    const newId = `device_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    await AsyncStorage.setItem('@deviceId_v2', newId);
    return newId;
  } catch (error) {
    console.error('Device ID error:', error);
    return `fallback_${Math.floor(Math.random() * 10000)}`;
  }
};

// Reaction Counter Component
const ReactionCounter = React.memo(({
  postId,
  reactions,
  userReaction,
  handleReaction
}: {
  postId: number;
  reactions: Record<number, Record<string, number>>;
  userReaction: string | null;
  handleReaction: (postId: number, reactionKey: string) => void;
}) => {
  const postReactions = reactions[postId] || {};
  return (
    <View style={styles.reactionContainer}>
      {EMOJIS.map(({ key, emoji }) => (
        <TouchableOpacity
          key={key}
          onPress={() => handleReaction(postId, key)}
          activeOpacity={0.7}
          style={[
            styles.reactionPill,
            userReaction === key && styles.activePill
          ]}
        >
          <Text style={styles.reactionText}>
            {emoji} {postReactions[key] || 0}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});

// Reaction Picker Modal
const ReactionPickerModal = ({
  postId,
  visible,
  onClose,
  handleReaction,
  isDark
}: {
  postId: number | null;
  visible: boolean;
  onClose: () => void;
  handleReaction: (postId: number, reactionKey: string) => void;
  isDark: boolean;
}) => {
  if (!visible || postId === null) return null;
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <View style={[
          styles.reactionPickerContainer,
          isDark && styles.darkReactionPicker
        ]}>
          {EMOJIS.map(({ key, emoji }) => (
            <TouchableOpacity
              key={key}
              onPress={() => {
                handleReaction(postId, key);
                onClose();
              }}
              style={styles.emojiButton}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

// Post Item Component
const PostItem = React.memo(({
  item,
  isDark,
  onLongPress,
  onPressReadMore,
  reactions,
  userReaction,
  handleReaction
}: {
  item: WPPost;
  isDark: boolean;
  onLongPress: () => void;
  onPressReadMore: () => void;
  reactions: Record<number, Record<string, number>>;
  userReaction: string | null;
  handleReaction: (postId: number, reactionKey: string) => void;
}) => {
  const imageUrl = item._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={onLongPress}
      style={[styles.card, isDark && styles.darkCard]}
    >
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <Text style={[styles.title, isDark && styles.darkText]}>
          {item.title.rendered}
        </Text>
        <Text style={[styles.excerpt, isDark && styles.darkText]}>
          {item.excerpt.rendered.replace(/<[^>]+>/g, '')}
        </Text>
        <ReactionCounter
          postId={item.id}
          reactions={reactions}
          userReaction={userReaction}
          handleReaction={handleReaction}
        />
        <TouchableOpacity
          onPress={onPressReadMore}
          activeOpacity={0.6}
        >
          <Text style={[styles.readMore, isDark && styles.darkText]}>
            Read more →
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

// Weather Card Component
const WeatherItem = React.memo(({ item, isDark }: { item: WeatherData; isDark: boolean }) => (
  <View style={[styles.weatherCard, isDark && styles.weatherCardDark]}>
    <Text style={[styles.weatherTitle, isDark && styles.darkText]}>{item.name}</Text>
    <LottieView
      source={getWeatherAnim(item.main, item.temp)}
      autoPlay
      loop
      style={styles.weatherAnim}
    />
    <Text style={[styles.weatherTemp, { color: getTempColor(item.temp) }]}>
      {item.temp.toFixed(0)}°C
    </Text>
    <Text style={[styles.weatherDesc, isDark && styles.darkText]}>
      {item.description.charAt(0).toUpperCase() + item.description.slice(1)}
    </Text>
    <Text style={[styles.weatherDetails, isDark && styles.darkText]}>
      Humidity: {item.humidity}%{''}
      Wind: {item.windSpeed} m/s
    </Text>
  </View>
));

export default function Trending() {
  const { isDark } = useTheme();
  const router = useRouter();

  // --- State declarations with types ---
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [videoModalVisible, setVideoModalVisible] = useState<boolean>(false);

  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [audios, setAudios] = useState<AudioItem[]>([]);
  const [audioLoading, setAudioLoading] = useState<boolean>(false);
  const [currentFolderId, setCurrentFolderId] = useState<string>(ROOT_FOLDER_ID);
  const [folderStack, setFolderStack] = useState<string[]>([]);
  const [loadingAudioIds, setLoadingAudioIds] = useState<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState<'All Podcasts' | 'Watch' | 'Listen'>('All Podcasts');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
  const [audioDurations, setAudioDurations] = useState<{ [id: string]: number | undefined }>({});

  const [posts, setPosts] = useState<WPPost[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [reactions, setReactions] = useState<Record<number, Record<string, number>>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);

  // --- Format duration as mm:ss ---
  const formatDuration = (millis?: number) => {
    if (!millis || isNaN(millis)) return "--:--";
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // --- Fetch YouTube videos ---
  const fetchChannelVideos = async (): Promise<void> => {
    setLoading(true);
    try {
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`
      );
      const channelData = await channelResponse.json();
      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=20&key=${YOUTUBE_API_KEY}`
      );
      const videosData = await videosResponse.json();

      const formattedVideos: VideoItem[] = videosData.items
        .map((item: any) => ({
          id: { videoId: item.snippet.resourceId.videoId },
          snippet: {
            title: item.snippet.title,
            publishedAt: item.snippet.publishedAt,
            thumbnails: { high: { url: item.snippet.thumbnails.high.url } },
          },
        }))
        .sort(
          (a: VideoItem, b: VideoItem) =>
            new Date(b.snippet.publishedAt).getTime() -
            new Date(a.snippet.publishedAt).getTime()
        );

      setVideos(formattedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch Google Drive folders or audios ---
  const fetchDriveContent = async (folderId: string): Promise<void> => {
    setAudioLoading(true);
    setFolders([]);
    setAudios([]);
    try {
      // Fetch subfolders
      const folderRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'&fields=files(id,name)&key=${GOOGLE_DRIVE_API_KEY}`
      );
      const folderData = await folderRes.json();
      if (folderData.files && folderData.files.length > 0) {
        setFolders(folderData.files);
      } else {
        // Fetch audio files if no folders
        const audioRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'audio/'&fields=files(id,name)&key=${GOOGLE_DRIVE_API_KEY}`
        );
        const audioData = await audioRes.json();
        if (audioData.files) {
          const audioFiles: AudioItem[] = audioData.files.map((file: any) => ({
            id: file.id,
            name: file.name,
            url: `https://drive.google.com/uc?export=download&id=${file.id}`,
          }));
          setAudios(audioFiles);
        }
      }
    } catch (error) {
      console.error('Error fetching Drive content:', error);
    } finally {
      setAudioLoading(false);
    }
  };

  // --- Handle tab changes ---
  useEffect(() => {
    if (activeTab === 'Listen') {
      setCurrentFolderId(ROOT_FOLDER_ID);
      setFolderStack([]);
      fetchDriveContent(ROOT_FOLDER_ID);
    } else if (activeTab === 'All Podcasts' || activeTab === 'Watch') {
      fetchChannelVideos();
    }
    setSelectedVideoId(null);
  }, [activeTab]);

  // --- Fetch Drive content when folder changes in Listen tab ---
  useEffect(() => {
    if (activeTab === 'Listen') {
      fetchDriveContent(currentFolderId);
    }
  }, [currentFolderId]);

  // --- Go back to parent folder ---
  const goBack = (): void => {
    if (folderStack.length > 0) {
      const previousFolderId = folderStack[folderStack.length - 1];
      setFolderStack(folderStack.slice(0, -1));
      setCurrentFolderId(previousFolderId);
    }
  };

  // --- Toggle favorite ---
  const toggleFavorite = (id: string): void => {
    setFavoriteIds((prev: string[]) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const handlePlayPause = async (audioUrl: string, audioId: string) => {
    try {
      // Mark audio as loading
      setLoadingAudioIds(prev => new Set(prev).add(audioId));

      if (currentAudioId === audioId && sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            await sound.playAsync();
            setIsPlaying(true);
          }
        }
        // Remove loading state
        setLoadingAudioIds(prev => {
          const copy = new Set(prev);
          copy.delete(audioId);
          return copy;
        });
        return;
      }

      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      setCurrentAudioId(audioId);
      setIsPlaying(true);

      // Save duration if available
      if (status.isLoaded && typeof status.durationMillis === "number") {
        setAudioDurations(prev => ({
          ...prev,
          [audioId]: status.durationMillis,
        }));
      }
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
          if (
            typeof status.durationMillis === "number" &&
            audioDurations[audioId] !== status.durationMillis
          ) {
            setAudioDurations(prev => ({
              ...prev,
              [audioId]: status.durationMillis,
            }));
          }
          if (status.didJustFinish) {
            setIsPlaying(false);
            setCurrentAudioId(null);
          }
        }
      });
      // Remove loading state after successful load
      setLoadingAudioIds(prev => {
        const copy = new Set(prev);
        copy.delete(audioId);
        return copy;
      });
    } catch (error) {
      alert('Could not play audio.');
      setIsPlaying(false);
      setCurrentAudioId(null);
      setLoadingAudioIds(prev => {
        const copy = new Set(prev);
        copy.delete(audioId);
        return copy;
      });
    }
  };
  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // --- Fetch posts ---
  const fetchPosts = async (): Promise<void> => {
    try {
      const response = await fetch(BASE_URL);
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  // --- Fetch weather data ---
  const fetchWeatherData = async (): Promise<void> => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=-25.4658&lon=30.9854&appid=${OPENWEATHER_API_KEY}`
      );
      const data = await response.json();
      setWeatherData([{
        id: data.id,
        name: data.name,
        temp: data.main.temp - 273.15,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        main: data.weather[0].main,
      }]);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  // --- Fetch reactions ---
  const fetchReactions = async (): Promise<void> => {
    try {
      const deviceId = await getDeviceId();
      const response = await fetch(
        `https://your-api.com/reactions?postId=${selectedVideoId}&deviceId=${deviceId}`
      );
      const data = await response.json();
      setReactions(data);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  // --- Handle reaction ---
  const handleReaction = async (postId: number, reactionKey: string): Promise<void> => {
    try {
      const deviceId = await getDeviceId();
      await fetch(
        `https://your-api.com/react?postId=${postId}&reactionKey=${reactionKey}&deviceId=${deviceId}`,
        { method: 'POST' }
      );
      fetchReactions();
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  // --- Renderers ---
  const renderItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity
      style={[styles.videoCard, isDark && styles.darkVideoCard]}
      onPress={() => {
        setSelectedVideoId(item.id.videoId);
        setVideoModalVisible(true);
      }}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: item.snippet.thumbnails.high.url }}
          style={{ width: '100%', height: 150 }}
          resizeMode="cover"
        />
      </View>
      <Text style={[styles.videoTitle, isDark && styles.darkText]} numberOfLines={2}>
        {item.snippet.title}
      </Text>
    </TouchableOpacity>
  );

  const renderFolderItem = ({ item }: { item: DriveFolder }) => (
    <TouchableOpacity
      style={[styles.listItem, isDark && styles.darkListItem]}
      onPress={() => {
        setFolderStack([...folderStack, currentFolderId]);
        setCurrentFolderId(item.id);
      }}
    >
      <MaterialIcons name="folder" size={24} color={isDark ? "#fff" : "#6d28d9"} style={{ marginRight: 15 }} />
      <Text style={[styles.listItemText, isDark && styles.darkText]}>{item.name}</Text>
    </TouchableOpacity>
  );

  // --- Audio Card matching your screenshot ---
  const renderAudioItem = ({ item }: { item: AudioItem }) => (
    <View style={styles.audioCard}>
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => handlePlayPause(item.url, item.id)}
      >
        <MaterialIcons
          name={isPlaying && currentAudioId === item.id ? "pause" : "play-arrow"}
          size={32}
          color="#000"
        />
      </TouchableOpacity>
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={2}>{item.name}</Text>
      </View>
      <TouchableOpacity
        onPress={() => toggleFavorite(item.id)}
        style={styles.favoriteButton}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name={favoriteIds.includes(item.id) ? "favorite" : "favorite-border"}
          size={28}
          color="'rgba(255, 4, 4, 0.85)"
        />
      </TouchableOpacity>
      <Text style={styles.duration}>
        {formatDuration(audioDurations[item.id])}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerText, isDark && styles.darkText]}>Latest Catch up</Text>
        <ThemeToggle />
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, isDark && styles.darkTabs]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'All Podcasts' && styles.activeTab,
            isDark && styles.darkTabButton,
          ]}
          onPress={() => setActiveTab('All Podcasts')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'All Podcasts' && styles.activeTabText,
              isDark && styles.darkText,
            ]}
          >
            All Podcasts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'Watch' && styles.activeTab,
            isDark && styles.darkTabButton,
          ]}
          onPress={() => setActiveTab('Watch')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Watch' && styles.activeTabText,
              isDark && styles.darkText,
            ]}
          >
            Watch
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'Listen' && styles.activeTab,
            isDark && styles.darkTabButton,
          ]}
          onPress={() => setActiveTab('Listen')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Listen' && styles.activeTabText,
              isDark && styles.darkText,
            ]}
          >
            Listen
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {(activeTab === 'All Podcasts' || activeTab === 'Watch') && (
        loading ? (
          <ActivityIndicator
            size="large"
            color={isDark ? '#4d8cff' : '#4b5563'}
            style={{ marginTop: 20 }}
          />
        ) : (
          <FlatList
            data={videos}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.videoId}
            numColumns={NUM_COLUMNS}
            contentContainerStyle={styles.grid}
          />
        )
      )}

      {activeTab === 'Listen' && (
        <View style={styles.listenTabContent}>
          {currentFolderId !== ROOT_FOLDER_ID && (
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <Text style={[styles.backButtonText, isDark && styles.darkText]}>Back to Folders</Text>
            </TouchableOpacity>
          )}
          {audioLoading ? (
            <ActivityIndicator
              size="large"
              color={isDark ? '#4d8cff' : '#4b5563'}
              style={{ marginTop: 20 }}
            />
          ) : folders.length > 0 ? (
            <FlatList
              data={folders}
              renderItem={renderFolderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.fullWidthList}
            />
          ) : (
            <FlatList
              data={audios}
              renderItem={renderAudioItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.fullWidthList}
              ListEmptyComponent={
                <Text style={[styles.emptyListText, isDark && styles.darkText]}>
                  No audio files found in this folder.
                </Text>
              }
            />
          )}
        </View>
      )}

      {/* Video Modal */}
      <Modal
        visible={videoModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setVideoModalVisible(false);
          setSelectedVideoId(null);
        }}
      >
        <SafeAreaView style={[styles.modalContainer, isDark && styles.darkModalContainer]}>
          <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Now Playing</Text>
            {selectedVideoId && (
              <YoutubePlayer
                height={220}
                width={SCREEN_WIDTH - 40}
                play={true}
                videoId={selectedVideoId}
              />
            )}
            <TouchableOpacity
              style={[styles.closeButton, isDark && styles.darkCloseButton]}
              onPress={() => {
                setVideoModalVisible(false);
                setSelectedVideoId(null);
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  darkTabs: {
    backgroundColor: '#282828',
    borderBottomColor: '#444',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: '#eee',
  },
  darkTabButton: {
    backgroundColor: '#333',
  },
  activeTab: {
    borderColor: '#ff4747',
    backgroundColor: '#E6E0FF',
  },
  tabText: {
    fontWeight: '600',
    color: '#333',
  },
  activeTabText: {
    color: '#6200EE',
  },
  grid: {
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 8,
    width: ITEM_WIDTH,
    overflow: 'hidden',
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  darkVideoCard: {
    backgroundColor: '#2e2e2e',
  },
  thumbnailContainer: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  listenTabContent: {
    flex: 1,
    paddingHorizontal: 10,
  },
  fullWidthList: {
    paddingBottom: 80,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  darkListItem: {
    backgroundColor: '#2e2e2e',
  },
  listItemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    color: '#333',
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 10,
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  backButtonText: {
    color: '#4c1d95',
    fontWeight: 'bold',
    fontSize: 15,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#777',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  darkModalContainer: {
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalContent: {
    backgroundColor: '#f9f5ff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  darkModalContent: {
    backgroundColor: '#1e1b4b',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4c1d95',
    marginBottom: 20,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4c1d95',
    borderRadius: 10,
  },
  darkCloseButton: {
    backgroundColor: '#6d28d9',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  darkText: {
    color: '#fff',
  },

  // AUDIO CARD (matches your screenshot)
  audioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderRadius: 18,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  favoriteButton: {
    marginRight: 10,
    marginLeft: 4,
  },
  duration: {
    color: '#fff',
    fontSize: 15,
    width: 48,
    textAlign: 'right',
  },
  // Trending feed styles
  reactionContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap'
  },
  reactionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0'
  },
  activePill: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196f3'
  },
  reactionText: {
    fontSize: 14
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionPickerContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 30,
    elevation: 5,
  },
  darkReactionPicker: {
    backgroundColor: '#333',
  },
  emojiButton: {
    marginHorizontal: 8,
  },
  emojiText: {
    fontSize: 28,
  },
  card: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  darkCard: {
    backgroundColor: '#1E1E1E',
  },
  image: {
    width: '100%',
    height: SCREEN_WIDTH * 0.5,
  },
  content: {
    padding: 14,
  },
  excerpt: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  readMore: {
    fontSize: 13,
    color: '#0056b3',
    fontWeight: '600',
  },
  weatherCard: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
  },
  weatherCardDark: {
    backgroundColor: '#1E1E1E',
  },
  weatherTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  weatherAnim: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  weatherTemp: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff6600',
  },
  weatherDesc: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 6,
    textTransform: 'capitalize',
    color: '#555',
  },
  weatherDetails: {
    fontSize: 14,
    textAlign: 'center',
    color: '#555',
  },
});
 