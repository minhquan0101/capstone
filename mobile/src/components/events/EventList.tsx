import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { EventCard } from "./EventCard";
import { Event } from "../../utils/types";
import { Colors } from "../../constants/colors";
import { Spacing, FontSize, FontWeight } from "../../constants/spacing";

interface EventListProps {
  title: string;
  events: Event[];
  onEventPress: (eventId: string) => void;
}

export const EventList: React.FC<EventListProps> = ({ title, events, onEventPress }) => {
  if (events.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Xem tất cả</Text>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {events.map((event) => (
          <EventCard key={event._id} event={event} onPress={() => onEventPress(event._id)} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
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
  scroll: {
    marginHorizontal: -Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
});
