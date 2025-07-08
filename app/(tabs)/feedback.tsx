import React, { useState } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import ThemeToggle from '../../components/ThemeToggle';
import { useTheme } from '../../components/theme';  // If file is actually named theme.tsx

export default function FeedBackScreen() {
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Hold on!', 'Please share your thoughts with us.');
      return;
    }

    try {
      await axios.post(
        'https://formspree.io/f/xblyokgk',
        {
          _replyto: 'stationmanager@bcrfm104.co.za',
          name,
          location,
          message,
          rating: rating.toString(),
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      Alert.alert('Thank you so much! 🎉', 'Your feedback has been sent.');
      setName('');
      setLocation('');
      setMessage('');
      setRating(0);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Oops!', 'Something went wrong. Please try again later.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.keyboardAvoidingView, isDark && styles.darkKeyboardAvoidingView]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.container, isDark && styles.darkContainer]}>
        <Text style={[styles.header, isDark && styles.darkText]}>💬 We'd Love to Hear from You!</Text>
        <Text style={[styles.subHeader, isDark && styles.darkSubText]}>
          Your voice helps BCR FM 104.1 get better every day.
        </Text>

        <View style={[styles.card, isDark && styles.darkCard]}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>👤 Your Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={[styles.input, isDark && styles.darkInput]}
              placeholder=""
              placeholderTextColor={isDark ? '#94a3b8' : '#94a3b8'}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>📍 Where Are You Listening From?</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              style={[styles.input, isDark && styles.darkInput]}
              placeholder=""
              placeholderTextColor={isDark ? '#94a3b8' : '#94a3b8'}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>✍️ Share Your Thoughts</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              style={[styles.input, styles.multilineInput, isDark && styles.darkInput]}
              placeholder=""
              placeholderTextColor={isDark ? '#94a3b8' : '#94a3b8'}
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>⭐ Rate Your Experience</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={[
                    styles.star, 
                    rating >= star && styles.starSelected,
                    isDark && styles.darkStar
                  ]}>
                    {rating >= star ? '⭐' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, isDark && styles.darkSubmitBtn]} 
            onPress={handleSubmit}
          >
            <Text style={styles.submitText}>Share💌</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 
const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  darkKeyboardAvoidingView: {
    backgroundColor: '#0f172a',
  },
  container: {
    padding: 20,
    paddingBottom: 150,
    backgroundColor: '#f0f4f8',
    paddingVertical: 50,
  },
  darkContainer: {
    backgroundColor: '#0f172a',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  darkText: {
    color: '#e2e8f0',
  },
  subHeader: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
  },
  darkSubText: {
    color: '#94a3b8',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  darkCard: {
    backgroundColor: '#1e293b',
    shadowColor: '#64748b',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontWeight: '600',
    fontSize: 15,
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  darkInput: {
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  star: {
    fontSize: 32,
    color: '#d1d5db',
    marginRight: 6,
  },
  darkStar: {
    color: '#64748b',
  },
  starSelected: {
    color: '#facc15',
  },
  submitBtn: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  darkSubmitBtn: {
    backgroundColor: '#334155',
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});