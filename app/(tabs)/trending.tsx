import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { WebView } from 'react-native-webview';
import ThemeToggle from '../../components/ThemeToggle';
import { useTheme } from '../../components/theme';
import { db } from '../../firebase';
import { ref, get, remove, update, onValue } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const screenWidth = Dimensions.get('window').width;
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
  icon: string;
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

const OPENWEATHER_API_KEY = '3cce09f14c0b8abc01db3eef1aeb4af9';

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

function getWeatherIcon(main: string, description: string): { name: string; color: string } {
  switch (main) {
    case 'Thunderstorm':
      return { name: 'weather-lightning', color: '#7f8c8d' };
    case 'Drizzle':
      return { name: 'weather-rainy', color: '#2980b9' };
    case 'Rain':
      if (description.toLowerCase().includes('heavy')) {
        return { name: 'weather-pouring', color: '#34495e' };
      }
      return { name: 'weather-rainy', color: '#2980b9' };
    case 'Snow':
      return { name: 'weather-snowy', color: '#00BFFF' };
    case 'Clear':
      return { name: 'weather-sunny', color: '#FF9800' };
    case 'Clouds':
      if (description.toLowerCase().includes('overcast')) {
        return { name: 'weather-cloudy', color: '#95a5a6' };
      }
      return { name: 'weather-partly-cloudy', color: '#b0bec5' };
    default:
      return { name: 'weather-cloudy', color: '#b0bec5' };
  }
}

// Weather Item Component
const WeatherItem = React.memo(({ 
  item, 
  isDark 
}: {
  item: WeatherData;
  isDark: boolean;
}) => {
  const iconInfo = getWeatherIcon(item.main, item.description);
  return (
    <View style={[styles.weatherCard, isDark && styles.weatherCardDark]}>
      <View style={styles.weatherHeaderRow}>
        <MaterialCommunityIcons name={iconInfo.name} size={48} color={iconInfo.color} style={{ marginRight: 12 }} />
        <View>
          <Text style={[styles.weatherTitle, isDark && styles.darkText]}>{item.name}</Text>
          <Text style={[styles.weatherDesc, isDark && styles.darkText]}>{item.description.charAt(0).toUpperCase() + item.description.slice(1)}</Text>
        </View>
      </View>
      <Text style={[styles.weatherTemp, { color: iconInfo.color }]}>{item.temp.toFixed(1)}°C</Text>
      <View style={styles.weatherDetailsRow}>
        <Text style={styles.weatherDetails}>💧 {item.humidity}%</Text>
        <Text style={styles.weatherDetails}>💨 {item.windSpeed} m/s</Text>
      </View>
    </View>
  );
});

export default function Trending() {
  const { isDark, toggleTheme } = useTheme();
  const [posts, setPosts] = useState<WPPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const [weatherList, setWeatherList] = useState<WeatherData[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<number, Record<string, number>>>({});
  const [reactionPickerPostId, setReactionPickerPostId] = useState<number | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [userReactions, setUserReactions] = useState<Record<number, string | null>>({});
  const [pendingReactions, setPendingReactions] = useState<Record<string, boolean>>({});

  // Fetch posts from API
  const fetchPosts = async (pageNumber = 1, isRefreshing = false, categoryId = activeCategory) => {
    if (categoryId === 99) {
      setLoading(false);
      return;
    }
    try {
      let url = `${BASE_URL}&per_page=5&page=${pageNumber}`;
      if (categoryId !== 0) url += `&categories=${categoryId}`;

      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data)) {
        setPosts(prev => (isRefreshing ? data : [...prev, ...data]));
        setHasMore(data.length > 0);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch weather data for all towns
  const fetchWeatherForAllTowns = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const promises = MPUMALANGA_TOWNS.map(async (town) => {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${town.lat}&lon=${town.lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.cod === 200) {
          return {
            id: town.id,
            name: town.name,
            temp: data.main.temp,
            description: data.weather[0].description,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
          } as WeatherData;
        } else {
          throw new Error(data.message || 'Failed to fetch weather');
        }
      });

      const results = await Promise.all(promises);
      setWeatherList(results);
    } catch (error: any) {
      setWeatherError(error.message || 'Failed to fetch weather data for towns');
      setWeatherList([]);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Get user's reaction for a post
  const getUserReaction = async (postId: number): Promise<string | null> => {
    try {
      const deviceId = await getDeviceId();
      const snapshot = await get(ref(db, `reactions/${postId}`));
      
      if (!snapshot.exists()) return null;
      const reactions = snapshot.val();
      
      return EMOJIS.find(e => reactions[e.key]?.[deviceId])?.key || null;
    } catch (error) {
      console.error("Get reaction error:", error);
      return null;
    }
  };

  // Handle reaction with optimistic updates
  const handleReaction = async (postId: number, reactionKey: string) => {
    const operationKey = `${postId}_${reactionKey}`;
    if (pendingReactions[operationKey]) return;

    try {
      setPendingReactions(prev => ({ ...prev, [operationKey]: true }));
      const deviceId = await getDeviceId();
      const currentReaction = userReactions[postId] || await getUserReaction(postId);

      // Optimistic UI update
      setReactions(prev => {
        const updated = { ...prev };
        updated[postId] = { ...updated[postId] };

        if (currentReaction === reactionKey) {
          // Removing reaction
          updated[postId][reactionKey] = Math.max(0, (updated[postId][reactionKey] || 0) - 1);
          setUserReactions(prev => ({ ...prev, [postId]: null }));
        } else {
          // Changing reaction
          if (currentReaction) {
            updated[postId][currentReaction] = Math.max(0, (updated[postId][currentReaction] || 0) - 1);
          }
          updated[postId][reactionKey] = (updated[postId][reactionKey] || 0) + 1;
          setUserReactions(prev => ({ ...prev, [postId]: reactionKey }));
        }

        return updated;
      });

      // Database operations
      if (currentReaction === reactionKey) {
        await remove(ref(db, `reactions/${postId}/${reactionKey}/${deviceId}`));
      } else {
        if (currentReaction) {
          await remove(ref(db, `reactions/${postId}/${currentReaction}/${deviceId}`));
        }
        await update(ref(db, `reactions/${postId}/${reactionKey}/${deviceId}`), {
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error("Reaction error:", error);
      Alert.alert("Error", "Couldn't save your reaction");
      // Revert optimistic updates
      setReactions(prev => ({ ...prev }));
      setUserReactions(prev => ({ ...prev }));
    } finally {
      setPendingReactions(prev => ({ ...prev, [operationKey]: false }));
    }
  };

  // Real-time Reaction Sync
  useEffect(() => {
    const reactionsRef = ref(db, 'reactions');
    const unsubscribe = onValue(reactionsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const newReactions: Record<number, Record<string, number>> = {};

      Object.entries(data).forEach(([postId, postReactions]) => {
        const pid = Number(postId);
        newReactions[pid] = {};
        
        Object.entries(postReactions as object).forEach(([key, users]) => {
          newReactions[pid][key] = Object.keys(users as object).length;
        });
      });

      setReactions(newReactions);
    });

    return () => unsubscribe();
  }, []);

  // Fetch initial data when category changes
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setRefreshing(false);
    setWeatherList([]);
    setWeatherError(null);

    if (activeCategory === 99) {
      fetchWeatherForAllTowns();
    } else {
      fetchPosts(1, true, activeCategory);
    }
  }, [activeCategory]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    if (activeCategory === 99) {
      fetchWeatherForAllTowns();
    } else {
      fetchPosts(1, true, activeCategory);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && activeCategory !== 99) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.rendered.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      {/* Category Tab Buttons */}
      <View style={styles.tabs}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id.toString()}
            onPress={() => setActiveCategory(cat.id)}
            style={[
              styles.tabButton,
              activeCategory === cat.id && styles.activeTab,
              isDark && styles.darkTabButton,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeCategory === cat.id && styles.activeTabText,
                isDark && styles.darkText,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Input (Hidden on Weather tab) */}
      {activeCategory !== 99 && (
        <TextInput
          style={[styles.searchInput, isDark && styles.darkInput]}
          placeholder="Search news..."
          placeholderTextColor={isDark ? '#aaa' : '#999'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      )}

      {/* Weather Section */}
      {activeCategory === 99 ? (
        weatherLoading ? (
          <ActivityIndicator size="large" color="#003366" style={{ marginTop: 20 }} />
        ) : weatherError ? (
          <Text style={[styles.errorText, isDark && styles.darkText]}>{weatherError}</Text>
        ) : (
          <>
            <Text style={styles.lastUpdatedText}>Last updated: {new Date().toLocaleTimeString()}</Text>
            <FlatList
              data={weatherList}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <WeatherItem item={item} isDark={isDark} />}
              contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 4 }}
            />
          </>
        )
      ) : loading && posts.length === 0 ? (
        <ActivityIndicator size="large" color="#003366" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PostItem
              item={item}
              isDark={isDark}
              onLongPress={() => setReactionPickerPostId(item.id)}
              onPressReadMore={() => setSelectedArticle(item.link)}
              reactions={reactions}
              userReaction={userReactions[item.id] || null}
              handleReaction={handleReaction}
            />
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.7}
          ListFooterComponent={
            hasMore ? (
              <ActivityIndicator size="small" color="#003366" />
            ) : (
              <Text style={[styles.noMoreText, isDark && styles.darkText]}>No more news</Text>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#003366"
            />
          }
        />
      )}

      {/* Article Modal */}
      <Modal 
        visible={!!selectedArticle} 
        animationType="slide" 
        onRequestClose={() => setSelectedArticle(null)}
      >
        <View style={[styles.modalContainer, isDark && styles.darkModalContainer]}>
          <TouchableOpacity 
            onPress={() => setSelectedArticle(null)} 
            style={[styles.closeBtn, isDark && styles.darkCloseBtn]}
          >
            <Text style={[styles.closeText, isDark && styles.darkText]}>✕ Close</Text>
          </TouchableOpacity>
          {selectedArticle && (
            <WebView 
              source={{ uri: selectedArticle }} 
              style={{ flex: 1 }} 
              startInLoadingState={true}
            />
          )}
        </View>
      </Modal>

      {/* Reaction Picker Modal */}
      <ReactionPickerModal
        postId={reactionPickerPostId}
        visible={reactionPickerPostId !== null}
        onClose={() => setReactionPickerPostId(null)}
        handleReaction={handleReaction}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F4F6F8',
    paddingVertical: 50,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
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
    height: screenWidth * 0.5,
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
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
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 10,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 5,
    borderColor: 'transparent',
    backgroundColor: '#9CA3AF',
  },
  darkTabButton: {
    backgroundColor: '#333',
  },
  activeTab: {
    borderColor: '#ff4747',
  },
  tabText: {
    fontWeight: '500',
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  activeTabText: {
    color: '#222222',
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    fontSize: 15,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
  },
  darkInput: {
    backgroundColor: '#333',
    color: '#fff',
    borderColor: '#555',
  },
  noMoreText: {
    textAlign: 'center',
    padding: 10,
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: 'red',
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
  weatherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherIcon: {
    width: 80,
    height: 80,
    marginRight: 12,
  },
  weatherTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  weatherDesc: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 6,
    textTransform: 'capitalize',
    color: '#555',
  },
  weatherTemp: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff6600',
  },
  weatherDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  weatherDetails: {
    fontSize: 14,
    textAlign: 'center',
    color: '#555',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkModalContainer: {
    backgroundColor: '#121212',
  },
  closeBtn: {
    padding: 15,
    backgroundColor: '#f8f8f8',
  },
  darkCloseBtn: {
    backgroundColor: '#333',
  },
  closeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastUpdatedText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 13,
    marginBottom: 8,
  },
});