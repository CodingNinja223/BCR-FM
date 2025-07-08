// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import WhatsAppFloatButton from '../../components/WhatsAppFloatButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// Color constants
const ACTIVE_COLOR = '#FF8A8A';
const INACTIVE_COLOR = '#9CA3AF';
const TAB_BAR_BG = '#222222';

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      {/* Main Tab Navigator */}
      <Tabs
        initialRouteName="live"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: ACTIVE_COLOR,
          tabBarInactiveTintColor: INACTIVE_COLOR,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIconStyle: { marginBottom: -1 },
          tabBarHideOnKeyboard: true,
        }}
      >
        {/* Live Tab */}
        <Tabs.Screen
          name="live"
          options={{
            title: 'Live',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="mic" size={size + 1} color={color} />
            ),
          }}
        />
<Tabs.Screen
  name="shows"
  options={{
    title: 'Shows',
    tabBarIcon: ({ color, size }) => (
      <MaterialCommunityIcons name="television-play" size={size + 1} color={color} />
    ),
  }}
/>


        {/* Podcast Tab */}
        <Tabs.Screen
          name="podcast"
          options={{
            title: 'Podcast',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="podcast" size={size + 1} color={color} />
            ),
          }}
        />

        {/* Trending Tab */}
        <Tabs.Screen
          name="trending"
          options={{
            title: 'Trending',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="fire" size={size + 1} color={color} />
            ),
          }}
        />

        {/* Feedback Tab */}
        <Tabs.Screen
          name="feedback"
          options={{
            title: 'Feedback',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="comment" size={size + 1} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Floating WhatsApp Button - appears on all screens */}
      
        <WhatsAppFloatButton />
      </View>
   
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  tabBar: {
    backgroundColor: TAB_BAR_BG,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -1 },
    shadowRadius: 10,
    elevation: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBarLabel: {
    fontWeight: '600',
    fontSize: 12,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  
});