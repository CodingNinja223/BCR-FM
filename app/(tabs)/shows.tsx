import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons"; // Notification icon
import { useTheme } from "../../components/theme"; // Adjust path if needed

// Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Your interfaces and schedule data here (unchanged)...
interface BaseItem {
  image: any;
}
interface ShowItem extends BaseItem {
  show: string;
  host: string;
  time: string;
}
interface TeamItem extends BaseItem {
  name: string;
  show: string;
  tagline: string;
  socialLinks?: {};
}
type CardItem = ShowItem | TeamItem;

const images = {
  default: require("../../assets/defult-banner.png"),
};

const weekdays: ShowItem[] = [
  { show: "Morning Devotion", host: "Orex Nkosi", time: "05:00 – 06:00", image: images.default },
  { show: "Feel Good Breakfast Show", host: "Bongekile Mathebula", time: "06:00-09:00", image: images.default },
  { show: "The Elevation Show", host: "Andile “Muntuza”", time: "09:00-12:00", image: images.default },
  { show: "Lunch Crunch", host: "Portia Msibi", time: "12:00-15:00", image: images.default },
  { show: "BCR Xclusive Drive Show", host: "Mr. 325", time: "15:00-18:00 ", image: images.default },
  { show: "Sports Wrap", host: "Bonginkosi Msimango", time: "18:00 – 19:00 ", image: images.default },
  { show: "BCR Current Affairs", host: "Jacob Lamula", time: "18:00-19:00 ", image: images.default },
  { show: "Evening Classics", host: "Dj Sdumara", time: "19:00-22:00", image: images.default },
  { show: "House 104", host: "Prince Vilakazi", time: "19:00-22:00 ", image: images.default },
  { show: "Night Explosion", host: "Themba Shabalala", time: "22:00 – 02:00 ", image: images.default },
];

const saturday: ShowItem[] = [
  { show: "Breakfast of Champions", host: "Nozipho Simelane", time: "06:00-09:00", image: images.default },
  { show: "Top 30 Chart", host: "Nkosinathi", time: "09:00-12:00", image: images.default },
  { show: "TeenPage", host: "Ncobile Mavuso", time: "12:00-13:00", image: images.default },
  { show: "Sina Afrika", host: "Dj Sdumza", time: "13:00-15:00", image: images.default },
  { show: "Sports Complex", host: "Thembi & Master P", time: "15:00-18:00", image: images.default },
  { show: "BCR FM After Party", host: "Prince Veli", time: "18:00-22:00", image: images.default },
  { show: "Night Explosion", host: "Themba Shabalala", time: "22:00 – 02:00", image: images.default },
];

const sunday: ShowItem[] = [
  { show: "Siyadumisa", host: "Orex & Pastor J", time: "05:00-09:00", image: images.default },
  { show: "Sunday Therapy", host: "Dj Vital", time: "09:00-12:00", image: images.default },
  { show: "Imperial Sunday", host: "Bobo Pontso", time: "12:00-15:00", image: images.default },
  { show: "Sports Complex", host: "Thembi & Master P", time: "15:00 – 18:00", image: images.default },
  { show: "Tenkolo", host: "Pastor Jay", time: "18:00 – 19:00", image: images.default },
  { show: "Bomb City Sounds", host: "Prince Veli", time: "19:00 – 22:00", image: images.default },
  { show: "Jazz and African Sounds", host: "Jacob Lamula", time: "22:00-02:00 ", image: images.default },
];

export default function CatchUp() {
  const [selectedTab, setSelectedTab] = useState("Weekdays");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CardItem | null>(null);
  const [team, setTeam] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduledShows, setScheduledShows] = useState<Record<string, boolean>>({});

  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const { isDark } = useTheme();

  // Helper to create unique key for show+time
  const getShowKey = (show: string, time: string) => `${show}||${time}`;

  // Sync scheduled notifications to state
  const syncScheduledShows = async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      const scheduledKeys: Record<string, boolean> = {};
      notifications.forEach((n) => {
        const showName = n.content.data?.showName || "";
        const showTime = n.content.data?.showTime || "";
        if (showName && showTime) {
          scheduledKeys[getShowKey(showName, showTime)] = true;
        }
      });
      setScheduledShows(scheduledKeys);
    } catch (e) {
      console.error("Failed to sync scheduled notifications", e);
    }
  };

  useEffect(() => {
    syncScheduledShows();
  }, []);

  // Request notification permission
  useEffect(() => {
    const requestPermission = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Enable notifications in system settings.");
        return;
      }
      const subscription = Notifications.addNotificationReceivedListener(notification => {
        console.log("Notification received:", notification);
      });
      return () => subscription.remove();
    };
    requestPermission();
  }, []);

  // Fetch team data (unchanged)
  useEffect(() => {
    const fetchTeam = async () => {
      if (selectedTab !== "Team") return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "http://bcrfm104.co.za.dedi1222.jnb1.host-h.net/wp-json/bcr/v1/elementor-team"
        );
        if (!response.ok) throw new Error("Failed to fetch team data");
        const data = await response.json();

        const fallbackPositions: Record<string, string> = {
          "Sibusiso Shabangu": "Station Manager",
          "Bonginkosi Msimango": "Sports Wrap",
          "Prince Veli": "House 104 BCR After Party Bomb City Soundz",
          "Bongekile Mathebula": "Feel Good Show",
          "Andile Masuku": "The Elevation Show",
          "Sabelo  Richard Nkosi": "News And Sports Director",
          "Owethu George": "Finance Officer",
          "Jacob Lamula": "News & Current Affairs",
          "Nozipho Simelane": "The Breakfast of Champions",
          "Menzi shabangu": "Broadcast Technician",
          "Portia Msibi": "Lunch Crunch",
          "Themba Shabalala ( Phutju_s)": "Night Explosion",
          "Prudence Thumbati": "News & Current Affairs",
          "Nkosisivile Nkosi": "News Anchor",
        };

        const fetchedTeam = data.map((member: any) => ({
          name: member.name,
          show: member.position || fallbackPositions[member.name.trim()] || "Team Member",
          tagline: member.description,
          image: member.image ? { uri: member.image } : images.default,
          socialLinks: member.socialLinks || {},
        }));

        setTeam(fetchedTeam);
      } catch (err) {
        console.error("Failed to fetch team:", err);
        setError("Network Error,Try Reloading or connect to wifi.");
        // Fallback local data (add your local members here)
        setTeam([ // ... (include all your local team members as fallback)
  { name: "Andile Masuku", show: "The Elevation Show", image: images.default, tagline: "Taste and see that he lord is good." },
  { name: "Portia Msibi", show: "Lunch Crunch ", image: images.default, tagline: "This too shall pass" },
  { name: "Owethu George", show: "Finance Officer", image: images.default, tagline: "I am destined for greatness" },
  { name: "Prudence Thumbati", show: "News & Current Affairs", image: images.default, tagline: " " },
  { name: "Menzi Shabangu", show: "Broadcast Technician", image: images.default, tagline: "Do Everything at the best of  your ability all the time." },
  { name: "Bongekile Mathebula", show: "Feel Good Show", image: images.default, tagline: "Anything is possible as long as you put your mind to it!" },
  { name: "Jacob Lamula", show: "News & Current Affairs", image: images.default, tagline: "Mlomo Mnandi!" }, 
  { name: "Prince Veli", show: "House 104 BCR After Party Bomb City Soundz", image: images.default, tagline: "Eduze Mani!" },
  { name: "Themba Shabalala ( Phutju_s)", show: "Night Explosion", image: images.default, tagline: "Smart Mamphara , Future Mfana!" },
  { name: "Bonginkhosi Msimango", show: "Sports Wrap", image: images.default, tagline: "King B Msakati we BCR " },
  { name: "Sibusiso Shabangu  ", show: "Station Manager", image: images.default, tagline: "“ It aint bragging if you can back it up every second, every minute, every hour , every day" }, 
  { name: "Nkosisivile Nkosi", show: "News Anchor", image: images.default, tagline: "Shoot to the moon so that when you miss you are amongst the stars" },
  { name: "Nozipho Simelane", show: "The Breakfast of Champions", image: images.default, tagline: "I am a game changer , I change peoples lives with the work that I do!" },
  { name: "Sabelo Richard Nkosi", show: "News And Sports Director", image: images.default, tagline: "What you see is what you get " },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [selectedTab]);

  // Animate modal open/close
  useEffect(() => {
    if (modalVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [modalVisible]);

  // Schedule reminder
  const scheduleReminder = async (item: ShowItem) => {
    try {
      const key = getShowKey(item.show, item.time);
      if (scheduledShows[key]) {
        Alert.alert("Reminder Already Set", `You already have a reminder for ${item.show}`);
        return;
      }

      const now = new Date();
      const [startTime] = item.time.split(/[–-]/);
      const [hourStr, minuteStr] = startTime.trim().split(":");
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      const scheduledTime = new Date(now);
      scheduledTime.setHours(hour, minute, 0, 0);
      if (scheduledTime <= now) scheduledTime.setDate(scheduledTime.getDate() + 1);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `BCR FM 📻 ${item.show} is Live`,
          body: `Hosted by ${item.host} at ${item.time}. Tap to Listen.`,
          sound: true,
          data: { showName: item.show, showTime: item.time, host: item.host },
        },
        trigger: { type: "date", date: scheduledTime },
      });

      await syncScheduledShows();
      Alert.alert("Reminder Set", `${item.show} scheduled for ${scheduledTime.toLocaleTimeString()}`);
      console.error("Reminder Set For this show");
      setModalVisible(false);
    } catch (error) {
      console.error("Error scheduling notification:", error);
      Alert.alert("Error", "Failed to set reminder. Please try again.");
    }
  };

  // Cancel reminder with confirmation
  const cancelReminder = async (item: ShowItem) => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      const notificationToCancel = notifications.find(
        (n) =>
          n.content.data?.showName === item.show &&
          n.content.data?.showTime === item.time
      );
      if (notificationToCancel) {
        await Notifications.cancelScheduledNotificationAsync(notificationToCancel.identifier);
        await syncScheduledShows();
        Alert.alert("Reminder Cancelled", `Reminder for ${item.show} has been cancelled`);
      } else {
        Alert.alert("No Reminder Found", `No reminder found for ${item.show}`);
      }
      setModalVisible(false);
    } catch (error) {
      console.error("Error cancelling notification:", error);
      Alert.alert("Error", "Failed to cancel reminder. Please try again.");
    }
  };

  // Handle card press
  const handleCardPress = (item: CardItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const isShowItem = (item: CardItem): item is ShowItem =>
    "host" in item && "time" in item;

  // Render cards with notification icon if scheduled
  const renderCard = ({ item }: { item: CardItem }) => {
    const key = isShowItem(item) ? getShowKey(item.show, item.time) : "";
    const isScheduled = scheduledShows[key];

    return (
      <TouchableOpacity onPress={() => handleCardPress(item)} style={styles.cardWrapper}>
        <View style={styles.card}>
          <Image source={item.image} style={styles.cardImage} defaultSource={images.default} />
          {isScheduled && (
            <View style={styles.notificationIconContainer}>
              <Ionicons name="notifications" size={24} color="#ff4747" />
            </View>
          )}
          <Text style={styles.cardTitle}>{isShowItem(item) ? item.show : item.name}</Text>
          <Text style={styles.cardSubtitle}>{isShowItem(item) ? item.host : item.show}</Text>
          {"time" in item && <Text style={styles.cardTime}>⏰ {item.time}</Text>}
          {"tagline" in item && <Text style={styles.cardTagline}>"{item.tagline}"</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  const getCurrentSchedule = () => {
    switch (selectedTab) {
      case "Saturday":
        return saturday;
      case "Sunday":
        return sunday;
      case "Team":
        return team;
      default:
        return weekdays;
    }
  };

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {["Weekdays", "Saturday", "Sunday", "Team"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.heading}>All BCR Shows 📻</Text>

      {/* Loading/Error/Content */}
      {selectedTab === "Team" && loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={getCurrentSchedule()}
          renderItem={renderCard}
          keyExtractor={(_, index) => index.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
        />
      )}

      {/* Modal */}
      <Modal animationType="none" transparent visible={modalVisible}>
        <View style={styles.centeredView}>
          <Animated.View
            style={[
              styles.modalView,
              {
                opacity: opacityAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>

            {selectedItem && isShowItem(selectedItem) ? (
              <>
                <Image
                  source={selectedItem.image}
                  style={styles.modalImage}
                  defaultSource={images.default}
                  resizeMode="contain"
                />
                <Text style={styles.modalTitle}>{selectedItem.show}</Text>
                <Text style={styles.modalSubtitle}>{selectedItem.host}</Text>
                <Text style={styles.modalTime}>⏰ {selectedItem.time}</Text>

                {scheduledShows[getShowKey(selectedItem.show, selectedItem.time)] ? (
                  <>
                    <Text style={{ marginBottom: 20, textAlign: "center" }}>
                      You have a reminder set for this show.
                    </Text>
                    <TouchableOpacity
                      style={[styles.remindButton, { backgroundColor: "#888" }]}
                      onPress={() =>
                        Alert.alert(
                          "Cancel Reminder",
                          `Are you sure you want to cancel the reminder for ${selectedItem.show}?`,
                          [
                            { text: "No", style: "cancel" },
                            {
                              text: "Yes",
                              onPress: () => cancelReminder(selectedItem),
                              style: "destructive",
                            },
                          ]
                        )
                      }
                    >
                      <Text style={styles.remindButtonText}>Cancel Reminder</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.remindButton}
                    onPress={() => scheduleReminder(selectedItem)}
                  >
                    <Text style={styles.remindButtonText}>Remind Me</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : selectedItem ? (
              <>
                <Image
                  source={selectedItem.image}
                  style={styles.modalImage}
                  defaultSource={images.default}
                  resizeMode="contain"
                />
                <Text style={styles.modalTitle}>{selectedItem.name}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedItem.show || "No position provided"}
                </Text>
                {selectedItem.tagline && (
                  <Text style={styles.modalTagline}>"{selectedItem.tagline}"</Text>
                )}
              </>
            ) : null}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  container: {
    backgroundColor: "#f9fafb",
    flex: 1,
    padding: 16,
    paddingVertical: 50,
    paddingHorizontal: 10,
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    padding: 0,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: "transparent",
    backgroundColor: "#9CA3AF",
  },
  activeTab: {
    borderColor: "#ff4747",
  },
  tabText: {
    fontWeight: "500",
    color: "#222222",
  },
  activeTabText: {
    color: "#222222",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
  },
  grid: {
    paddingBottom: 80,
  },
  cardWrapper: {
    flex: 1,
    margin: 5,
    maxWidth: "48%",
  },
  card: {
    backgroundColor: "#E8EEED",
    borderRadius: 10,
    overflow: "hidden",
    padding: 10,
    alignItems: "center",
  },
  cardImage: {
    width: "100%",
    height: 190,
    borderRadius: 8,
    resizeMode: "cover",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#334155",
    textAlign: "center",
  },
  cardTime: {
    fontSize: 12,
    color: "#1d4ed8",
    marginTop: 4,
  },
  cardTagline: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#7c3aed",
    marginTop: 4,
    textAlign: "center",
  },
  notificationIconContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 12,
    padding: 2,
    zIndex: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 90,
  },
  modalView: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    paddingVertical: 30,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  },
  closeButton: {
    position: "absolute",
    top: 2,
    right: 10,
    backgroundColor: "#000",
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontWeight: "bold",
    color: "white",
  },
  modalImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    marginBottom: 0,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#4b5563",
    marginBottom: 10,
    textAlign: "center",
  },
  modalTime: {
    fontSize: 16,
    color: "red",
    fontWeight: "600",
    marginBottom: 10,
  },
  modalTagline: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#7c3aed",
    marginBottom: 20,
    textAlign: "center",
  },
  remindButton: {
    backgroundColor: "#000000",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  remindButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
