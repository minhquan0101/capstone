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
  const bannerEvents = useMemo(() => {
    const withImage = allEvents.filter((e) => e.imageUrl);
    const featured = withImage.filter((e) => e.isFeatured);
    return (featured.length > 0 ? featured : withImage).slice(0, 5);
  }, [allEvents]);

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
<<<<<<< Updated upstream
      <HeroBanner bannerUrl={banner} />
=======
      <HeroBanner bannerUrl={banner} events={bannerEvents} />
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sự kiện..."
          placeholderTextColor={Colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {TAG_SECTIONS.map((tag) => {
            const isActive = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() =>
                  setSelectedTags((prev) =>
                    isActive ? prev.filter((t) => t !== tag) : [...prev, tag]
                  )
                }
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {SORT_OPTIONS.map((opt) => {
            const isActive = sortOption === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSortOption(opt.id)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.backgroundDark,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  chipRow: {
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginRight: Spacing.sm,
    backgroundColor: Colors.backgroundDark,
  },
  chipActive: {
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.primary + "22",
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  chipTextActive: {
    color: Colors.primary,
  },
  resultSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  resultTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  resultCard: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  resultImage: {
    width: 120,
    height: 120,
  },
  resultBody: {
    flex: 1,
    padding: Spacing.md,
    gap: 4,
  },
  resultCardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  resultMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  resultPrice: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
>>>>>>> Stashed changes
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
