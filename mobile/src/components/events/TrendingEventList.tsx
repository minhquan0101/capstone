import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { TrendingEventCard } from "./TrendingEventCard";
import { Event } from "../../utils/types";
import { Colors } from "../../constants/colors";
import { Spacing, FontSize, FontWeight } from "../../constants/spacing";

const { width } = Dimensions.get("window");

interface TrendingEventListProps {
  title: string;
  events: Event[];
  onEventPress: (eventId: string) => void;
}

export const TrendingEventList: React.FC<TrendingEventListProps> = ({ title, events, onEventPress }) => {
  if (events.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Xem tất cả</Text>
      </View>
      <View style={styles.grid}>
        {events.map((event, index) => (
          <TrendingEventCard key={event._id} event={event} index={index} onPress={() => onEventPress(event._id)} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});
