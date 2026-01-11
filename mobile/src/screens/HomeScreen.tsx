import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { HeroBanner } from "../components/events/HeroBanner";
import { EventList } from "../components/events/EventList";
import { TrendingEventList } from "../components/events/TrendingEventList";
import { getEvents, getBanner } from "../utils/api";
import { Event } from "../utils/types";
import { Colors } from "../constants/colors";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load banner and events in parallel
        const [bannerData, eventsData] = await Promise.all([
          getBanner(),
          getEvents()
        ]);

        if (bannerData) {
          setBanner(bannerData.imageUrl);
        }

        setAllEvents(eventsData || []);
      } catch (err: any) {
        console.error("Error loading home data:", err);
        setError(err.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const navigateToEventDetail = (eventId: string) => {
    navigation.navigate("EventDetail", { eventId });
  };

  // Filter events
  const specialEvents = allEvents.filter(e => e.isFeatured).slice(0, 4);
  const trendingEvents = allEvents.slice(0, 10);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <HeroBanner bannerUrl={banner} />
      <View style={styles.sections}>
        <EventList title="Sự kiện đặc biệt" events={specialEvents} onEventPress={navigateToEventDetail} />
        <TrendingEventList title="Sự kiện xu hướng" events={trendingEvents} onEventPress={navigateToEventDetail} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  sections: {
    backgroundColor: Colors.backgroundLight,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error || "#ef4444",
    textAlign: "center",
  },
});
