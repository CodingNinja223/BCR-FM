import React, { useEffect, useState } from 'react';
import {
  Image,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import YoutubePlayer from 'react-native-youtube-iframe';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = SCREEN_WIDTH / NUM_COLUMNS - 20;

const YOUTUBE_API_KEY = 'AIzaSyDh6oZ11xECShHkRGaXKC3W-nm_znOuqXw';

export default function Podcasts() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('BCR FM');
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const fetchVideos = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          query
        )}&type=video&maxResults=20&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      setVideos(data.items || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(searchQuery);
  }, []);

  const handleSearch = () => {
    fetchVideos(searchQuery);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => {
        setSelectedVideoId(item.id.videoId);
        setModalVisible(true);
      }}
      accessible={true}
      accessibilityLabel={`Play podcast: ${item.snippet.title}`}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: `https://img.youtube.com/vi/${item.id.videoId}/hqdefault.jpg` }}
          style={{ width: '100%', height: 150 }}
          resizeMode="cover"
          accessible={true}
          accessibilityLabel={`Thumbnail for ${item.snippet.title}`}
        />
      </View>
      <Text style={styles.videoTitle} numberOfLines={2}>
        {item.snippet.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.push('/Live')}>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Podcasts</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search podcasts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4b5563" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={videos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.videoId}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.grid}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Now Playing</Text>
            <YoutubePlayer height={220} width={SCREEN_WIDTH - 40} play={true} videoId={selectedVideoId} />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f0ff',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navText: {
    fontSize: 16,
    color: '#4b5563',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e1065',
  },
  searchContainer: {
    padding: 10,
    backgroundColor: '#f3f0ff',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 40,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  grid: {
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 5,
    width: ITEM_WIDTH,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    width: '100%',
    height: 150,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    margin: 10,
    color: '#1f2937',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1e1b4b',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
