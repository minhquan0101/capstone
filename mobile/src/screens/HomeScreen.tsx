import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, ActivityIndicator, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { HeroBanner } from "../components/events/HeroBanner";
import { EventList } from "../components/events/EventList";
import { TrendingEventList } from "../components/events/TrendingEventList";
import { getEvents, getBanner, getImageUrl } from "../utils/api";
import { Event } from "../utils/types";
import { Colors } from "../constants/colors";
import { Spacing, BorderRadius, FontSize, FontWeight } from "../constants/spacing";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TAG_SECTIONS = [
  "Nhạc sống",
  "Sân khấu",
  "Thể thao",
  "Workshop",
  "Hội chợ",
  "Trải nghiệm",
];

const SORT_OPTIONS = [
  { id: "new", label: "Mới nhất" },
  { id: "upcoming", label: "Sắp diễn ra" },
  { id: "price_low", label: "Giá thấp" },
  { id: "price_high", label: "Giá cao" },
] as const;

const normalizeTag = (tag: string) =>
  tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/&/g, "và")
    .replace(/&amp;/g, "và")
    .replace(/&nbsp;/g, " ");

const removeDiacritics = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<(typeof SORT_OPTIONS)[number]["id"]>("new");

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

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const hasTags = selectedTags.length > 0;
    const normalizedSelected = selectedTags.map(normalizeTag).map(removeDiacritics);

    return allEvents.filter((event) => {
      if (query) {
        const title = (event.title || "").toLowerCase();
        const location = (event.location || "").toLowerCase();
        const desc = (event.description || "").toLowerCase();
        const tags = (event.tags || []).join(" ").toLowerCase();
        if (!title.includes(query) && !location.includes(query) && !desc.includes(query) && !tags.includes(query)) {
          return false;
        }
      }

      if (hasTags) {
        const eventTags = (event.tags || []).map(normalizeTag).map(removeDiacritics);
        return eventTags.some((tag) => normalizedSelected.includes(tag));
      }

      return true;
    });
  }, [allEvents, searchQuery, selectedTags]);

  const sortedEvents = useMemo(() => {
    const list = [...filteredEvents];
    switch (sortOption) {
      case "upcoming":
        return list
          .map((e) => ({ e, d: e.date ? new Date(e.date) : null }))
          .filter((x) => x.d && !Number.isNaN(x.d.getTime()))
          .sort((a, b) => a.d!.getTime() - b.d!.getTime())
          .map((x) => x.e);
      case "price_low":
        return list.sort((a, b) => Number(a.priceFrom ?? a.price ?? 0) - Number(b.priceFrom ?? b.price ?? 0));
      case "price_high":
        return list.sort((a, b) => Number(b.priceFrom ?? b.price ?? 0) - Number(a.priceFrom ?? a.price ?? 0));
      case "new":
      default:
        return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
  }, [filteredEvents, sortOption]);

  const isFiltering = searchQuery.trim().length > 0 || selectedTags.length > 0;

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
      <View style={styles.sections}>
        {isFiltering ? (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>
              Kết quả ({sortedEvents.length})
            </Text>
            {sortedEvents.length === 0 ? (
              <Text style={styles.emptyText}>Không tìm thấy sự kiện phù hợp.</Text>
            ) : (
              sortedEvents.map((event) => (
                <EventResultCard
                  key={event._id}
                  event={event}
                  onPress={() => navigateToEventDetail(event._id)}
                />
              ))
            )}
          </View>
        ) : (
          <>
            <EventList title="Sự kiện đặc biệt" events={specialEvents} onEventPress={navigateToEventDetail} />
            <TrendingEventList title="Sự kiện xu hướng" events={trendingEvents} onEventPress={navigateToEventDetail} />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const EventResultCard: React.FC<{ event: Event; onPress: () => void }> = ({ event, onPress }) => {
  const imageUrl = getImageUrl(event.imageUrl);
  const price = Number(event.priceFrom ?? event.price ?? 0);
  return (
    <TouchableOpacity style={styles.resultCard} onPress={onPress} activeOpacity={0.9}>
      <Image
        source={{ uri: imageUrl || "https://via.placeholder.com/300x200?text=No+Image" }}
        style={styles.resultImage}
      />
      <View style={styles.resultBody}>
        <Text style={styles.resultCardTitle} numberOfLines={2}>
          {event.title}
        </Text>
        {event.location && <Text style={styles.resultMeta}>{event.location}</Text>}
        {event.date && <Text style={styles.resultMeta}>{new Date(event.date).toLocaleDateString("vi-VN")}</Text>}
        {price > 0 && <Text style={styles.resultPrice}>Từ {price.toLocaleString("vi-VN")}đ</Text>}
      </View>
    </TouchableOpacity>
  );
};

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
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
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
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: Colors.white,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
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
    backgroundColor: Colors.white,
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
