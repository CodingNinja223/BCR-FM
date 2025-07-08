import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../../components/theme';

const { width } = Dimensions.get('window');
const BASE_URL =
  'http://bcrfm104.co.za.dedi1222.jnb1.host-h.net/wp-json/wp/v2/posts?_embed';

// Replace with your actual streaming URL
const STREAM_URI = 'https://stream.zeno.fm/jncbwnscxkquv';

// Define the Show type with optional overnight property
type Show = {
  title: string;
  host: string;
  start: string;
  end: string;
  overnight?: boolean;
};

// Explicitly type the shows object with Show arrays
const shows: {
  MondayThursday: Show[];
  Friday: Show[];
  Saturday: Show[];
  Sunday: Show[];
} = {
  MondayThursday: [
    { title: 'The Elevation show', host: 'Andile "Muntuza"', start: '09:00', end: '12:00' },
    { title: 'Lunch Crunch', host: 'Portia Msibi', start: '12:00', end: '15:00' },
    { title: 'BCR Xclusive Drive show', host: 'Mr. 325', start: '15:00', end: '18:00' },
    { title: 'BCR Current Affairs', host: 'Jacob Lamula and Prudence Thumbathi', start: '18:00', end: '19:00' },
    { title: 'Evening Classics', host: 'Dj Sdumara', start: '19:00', end: '22:00' },
    { title: 'Morning Devotion', host: 'Orex Nkosi', start: '05:00', end: '06:00' },
    { title: 'Feel Good Breakfast Show', host: 'Bongekile Mathebula', start: '06:00', end: '09:00' },
  ],
  Friday: [
    { title: 'The Elevation show', host: 'Andile "Muntuza"', start: '09:00', end: '12:00' },
    { title: 'Lunch Crunch', host: 'Portia Msibi', start: '12:00', end: '15:00' },
    { title: 'BCR Xclusive Drive show', host: 'Mr. 325', start: '15:00', end: '18:00' },
    { title: 'Sports Wrap', host: 'Bonginkosi Msimango', start: '18:00', end: '19:00' },
    { title: 'House 104', host: 'Prince Vilakazi', start: '19:00', end: '22:00' },
    { title: 'Night Explosion', host: 'Themba Shabalala', start: '22:00', end: '02:00', overnight: true },
  ],
  Saturday: [
    { title: 'Breakfast of Champions', host: 'Nozipho Simelane', start: '06:00', end: '09:00' },
    { title: 'Top 30 chart', host: 'Nkosinathi', start: '09:00', end: '12:00' },
    { title: 'TeenPage', host: 'Ncobile Mavuso', start: '12:00', end: '13:00' },
    { title: 'Sina Afrika', host: 'Dj Sdumza', start: '13:00', end: '15:00' },
    { title: 'Sports Complex', host: 'Thembi "Miss T" & Percyval "Master P"', start: '15:00', end: '18:00' },
    { title: 'BCR FM After party', host: 'Prince Veli', start: '18:00', end: '22:00' },
    { title: 'Night Explosion', host: 'Themba Shabalala', start: '22:00', end: '02:00', overnight: true },
  ],
  Sunday: [
    { title: 'Siyadumisa', host: 'Orex Nkosi and Pastor J', start: '05:00', end: '09:00' },
    { title: 'Sunday Therapy', host: 'Dj Vital', start: '09:00', end: '12:00' },
    { title: 'Imperial Sunday', host: 'Bobo Pontso', start: '12:00', end: '15:00' },
    { title: 'Sport Complex', host: 'Thembi "Miss T" & Percyval "Master P"', start: '15:00', end: '18:00' },
    { title: 'Tenkolo', host: 'Pastor Jay', start: '18:00', end: '19:00' },
    { title: 'Bomb City Sounds', host: 'Prince Veli', start: '19:00', end: '22:00' },
    { title: 'Jazz and African sounds', host: 'Jacob Lamula', start: '22:00', end: '02:00', overnight: true },
  ],
};

// Checks if current time is within the show time range, considering overnight shows
function isTimeInRange(start: string, end: string, current: string, overnight = false) {
  if (!overnight) return current >= start && current < end;
  return current >= start || current < end;
}

// Converts "HH:MM" to total minutes for easier comparison
function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Returns the current show based on the current time and day
function getCurrentShow(): Show {
  const now = new Date();
  const day = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);
  let todayShows: Show[];

  if (day === 0) todayShows = shows.Sunday;
  else if (day === 6) todayShows = shows.Saturday;
  else if (day === 5) todayShows = shows.Friday;
  else todayShows = shows.MondayThursday;

  for (const show of todayShows) {
    if (isTimeInRange(show.start, show.end, currentTime, show.overnight ?? false)) {
      return show;
    }
  }

  return { title: 'Just Stay Tuned!', host: 'BCR', start: '', end: '' };
}
// Returns the next upcoming show based on current time and day
function getNextShow(): Show | null {
  const now = new Date();
  const day = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);
  const currentMinutes = timeToMinutes(currentTime);
  let todayShows: Show[];

  if (day === 0) todayShows = shows.Sunday;
  else if (day === 6) todayShows = shows.Saturday;
  else if (day === 5) todayShows = shows.Friday;
  else todayShows = shows.MondayThursday;

  for (const show of todayShows) {
    if (timeToMinutes(show.start) > currentMinutes) {
      return show;
    }
  }
  return null;
}
export default function Live() {
  const [newsItems, setNewsItems] = useState<
    Array<{ title: string; url: string; image?: string | null }>
  >([]);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [loadingNews, setLoadingNews] = useState(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Searching signal, please wait...');
  const soundRef = useRef<Audio.Sound | null>(null);

  const [currentShow, setCurrentShow] = useState(getCurrentShow());
  const [nextShow, setNextShow] = useState(getNextShow());

  const { isDark } = useTheme();
  const showImages: { [title: string]: any } = {
    'The Elevation show': require('../../assets/Andile11.png'),
    'Lunch Crunch': require('../../assets/Portia11.png'),
    'BCR Xclusive Drive show': require('../../assets/defult-banner.png'),
    'BCR Current Affairs': require('../../assets/Jacob11.png'),
    'Evening Classics': require('../../assets/defult-banner.png'),
    'Morning Devotion': require('../../assets/defult-banner.png'),
    'Feel Good Breakfast Show': require('../../assets/Bongekile11.png'),
    'Sports Wrap': require('../../assets/Bongi11.png'),
    'House 104': require('../../assets/Prince11.png'),
    'Night Explosion': require('../../assets/ThembaS11.png'),
    'Breakfast of Champions': require('../../assets/Nozipho11.png'),
    'Top 30 chart': require('../../assets/defult-banner.png'),
    'TeenPage': require('../../assets/defult-banner.png'),
    'Sina Afrika': require('../../assets/defult-banner.png'),
    'Sports Complex': require('../../assets/defult-banner.png'),
    'BCR FM After party': require('../../assets/Prince11.png'),
    'Night Explosion!': require('../../assets/ThembaS11.png'),
    'Siyadumisa': require('../../assets/defult-banner.png'),
    'Sunday Therapy': require('../../assets/defult-banner.png'),
    'Imperial Sunday': require('../../assets/defult-banner.png'),
    'Tenkolo': require('../../assets/defult-banner.png'),
    'Bomb City Sounds': require('../../assets/Prince11.png'),
    'Jazz and African sounds': require('../../assets/Jacob11.png'),
    'Sports Complex!': require('../../assets/defult-banner.png'),
    'Just Stay Tuned!': require('../../assets/defult-banner.png'),
  };

  // --- Setup expo-av audio only once on mount ---
  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;
    const setupAudio = async () => {
      try {
        setIsAudioReady(false);
        setLoadingMessage('Searching signal, please wait...');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: STREAM_URI },
          { shouldPlay: false }
        );
        if (!isMounted) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!isMounted) return;
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying ?? false);
            setLoadingMessage('');
          } else if (status.error) {
            setIsPlaying(false);
            setLoadingMessage('Technical issue detected, please try again later.');
          }
        });
        setIsAudioReady(true);
        // Show update interval
        const updateShows = () => {
          if (!isMounted) return;
          const newCurrent = getCurrentShow();
          const newNext = getNextShow();
          setCurrentShow((prev) =>
            JSON.stringify(prev) !== JSON.stringify(newCurrent) ? newCurrent : prev
          );
          setNextShow((prev) =>
            JSON.stringify(prev) !== JSON.stringify(newNext) ? newNext : prev
          );
        };
        updateShows();
        intervalId = setInterval(updateShows, 60000);
      } catch (error) {
        setIsAudioReady(false);
        setLoadingMessage('Technical issue detected, please be patient...');
      }
    };
    setupAudio();
    return () => {
      isMounted = false;
      clearInterval(intervalId);
      (async () => {
        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
            soundRef.current = null;
          } catch (e) {}
        }
      })();
    };
  }, []);

  // --- Play/pause handlers ---
  const startPlayback = useCallback(async () => {
    if (!isAudioReady || !soundRef.current) return;
    try {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    } catch (error) {
      setIsPlaying(false);
    }
  }, [isAudioReady]);

  const stopPlayback = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } catch (error) {
      setIsPlaying(false);
    }
  }, []);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [isPlaying, startPlayback, stopPlayback]);

  // Fetch news on mount
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${BASE_URL}&per_page=5&page=1`);
        const data = await res.json();
        const articles = data.map((item: any) => ({
          title: item.title.rendered,
          url: item.link,
          image: item._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
        }));
        setNewsItems(articles);
      } catch (err) {
        console.error('Failed to fetch news:', err);
        setNewsItems([]);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, []);

  const renderNewsList = () =>
    newsItems.map((item, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => setSelectedArticle(item.url)}
        style={styles.newsItem}
      >
        {item.image && <Image source={{ uri: item.image }} style={styles.newsImageStyle} />}
        <View style={styles.newsTextContainer}>
          <Text style={styles.newsHeadline}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    ));

  return (
    <ScrollView contentContainerStyle={[styles.container, isDark && styles.darkContainer]}>
      <View style={[styles.coverContainer, isDark && styles.darkCoverContainer]}>
        <Image
          source={showImages[currentShow.title] || require('../../assets/defult-banner.png')}
          style={styles.coverImage}
          resizeMode="cover"
        />
        {!isAudioReady ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="rgba(17, 204, 218 , 0.92)" />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.playButton} onPress={togglePlayback} activeOpacity={0.7}>
            <Ionicons
              name={isPlaying ? 'pause-circle' : 'play-circle'}
              size={181}
              color={isDark ? 'rgba(245, 0, 0, 0.8)' : 'rgb(245, 0, 0)'}
            />
            {isPlaying && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.currentShowContainer, isDark && styles.darkTextContainer]}>
        <Text style={[styles.currentShowTitle, isDark && styles.darkText]}>
          On Air:{' '}
          <Text style={[styles.currentShowTitle2, isDark && styles.darkAccentText]}>
            {currentShow.title}
          </Text>
        </Text>
        <Text style={[styles.showHost, isDark && styles.darkText]}>👤 Hosted By: {currentShow.host}</Text>
        <Text style={[styles.showTime, isDark && styles.darkText]}>
          🕒 {currentShow.start} - {currentShow.end}
        </Text>
      </View>

      <View style={[styles.nextShowContainer, isDark && styles.darkTextContainer]}>
        <Text style={[styles.sectionTitle1, isDark && styles.darkText]}>
          Next ▶:{' '}
          <Text style={[styles.currentShowTitle, isDark && styles.darkAccentText]}>
            {nextShow?.title ?? 'No more shows today'}
          </Text>
        </Text>
        {nextShow && (
          <>
            <Text style={[styles.nextShowHost, isDark && styles.darkText]}>👤 Hosted by: {nextShow.host}</Text>
            <Text style={[styles.nextShowTime, isDark && styles.darkText]}>
              🕒 {nextShow.start} - {nextShow.end}
            </Text>
          </>
        )}
      </View>

      <Text style={[styles.sectionTitle, isDark && styles.darkText, { alignSelf: 'flex-start' }]}>
        Top Stories Today‼️
      </Text>

      {loadingNews ? (
        <ActivityIndicator size="large" color={isDark ? '#facc15' : '#f59e0b'} />
      ) : newsItems.length === 0 ? (
        <Text style={[styles.noNewsText, isDark && styles.darkText]}>No news found.</Text>
      ) : (
        renderNewsList()
      )}

      <Modal visible={!!selectedArticle} animationType="slide" onRequestClose={() => setSelectedArticle(null)}>
        <View style={[styles.modalContainer, isDark && styles.darkModalContainer]}>
          <TouchableOpacity
            onPress={() => setSelectedArticle(null)}
            style={[styles.closeBtn, isDark && styles.darkCloseBtn]}
          >
            <Text style={[styles.closeText, isDark && styles.darkText]}>✕ Close</Text>
          </TouchableOpacity>
          {selectedArticle && <WebView source={{ uri: selectedArticle }} style={{ flex: 1 }} />}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#e6edeb',
    paddingVertical: 50,
  },
  darkContainer: {
    backgroundColor: '#0f172a',
  },
  coverContainer: {
    width: '100%',
    height: 380,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkCoverContainer: {
    backgroundColor: '#1e293b',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  loadingContainer: {
    position: 'absolute',
    width: 210,
    height: 210,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    position: 'absolute',
    top: '53%',
    left: '53%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
  },
  currentShowContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 13,
    elevation: 9,
  },
  darkTextContainer: {
    backgroundColor: '#1e293b',
  },
  currentShowTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  darkText: {
    color: '#e2e8f0',
  },
  currentShowTitle2: {
    fontSize: 29,
    fontWeight: 'bold',
    color: 'rgba(255, 4, 4, 0.85)',
  },
  showHost: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#374151',
    marginTop: 4,
  },
  showTime: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  nextShowContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    width: '100%',
    elevation: 9,
    marginBottom: 30,
    paddingVertical: 10,
  },
  sectionTitle1: {
    fontSize: 25,
    fontWeight: '600',
    marginBottom: 1,
    color: '#4b5563',
    paddingVertical: 1,
  },
  darkAccentText: {
    color: '#f87171',
  },
  nextShowHost: {
    fontSize: 16,
    color: '#374151',
  },
  nextShowTime: {
    fontSize: 16,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: '600',
    marginBottom: 10,
    color: '#4b5563',
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  newsItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 5,
    overflow: 'hidden',
    elevation: 3,
    width: '100%',
  },
  newsImageStyle: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  newsTextContainer: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  newsHeadline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  noNewsText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    marginLeft: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  darkModalContainer: {
    backgroundColor: '#0f172a',
  },
  closeBtn: {
    padding: 15,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  darkCloseBtn: {
    backgroundColor: '#1e293b',
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 10,
    padding: 5,
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
});
