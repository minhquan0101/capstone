import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { Spacing, BorderRadius, FontSize, FontWeight } from "../../constants/spacing";
import { Event } from "../../utils/types";
import { getImageUrl } from "../../utils/api";
import { formatDateFull } from "../../utils/formatters";

const { width } = Dimensions.get("window");

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const imageUrl = getImageUrl(event.imageUrl);
  const firstTag = event.tags && event.tags.length > 0 ? event.tags[0] : "Event";
  const displayDate = event.date ? formatDateFull(event.date) : "";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUrl || "https://via.placeholder.com/300x200?text=No+Image" }} 
          style={styles.image} 
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.imageGradient}
        />
        <View style={styles.tag}>
          <Text style={styles.tagText}>{firstTag}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        <View style={styles.metaContainer}>
          {event.location && (
            <View style={styles.metaItem}>
              <Ionicons name="location" size={14} color={Colors.textLight} />
              <Text style={styles.meta} numberOfLines={1}>{event.location}</Text>
            </View>
          )}
          {displayDate && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={14} color={Colors.textLight} />
              <Text style={styles.meta}>{displayDate}</Text>
            </View>
          )}
          {event.price !== undefined && event.price > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="pricetag" size={14} color={Colors.textLight} />
              <Text style={styles.meta}>{event.price.toLocaleString('vi-VN')}đ</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width * 0.85,
    marginRight: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 220,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  tag: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tagText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  body: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
    color: Colors.text,
    lineHeight: 24,
  },
  metaContainer: {
    marginBottom: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  meta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
});
