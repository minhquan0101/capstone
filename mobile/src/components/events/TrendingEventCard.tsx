import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../../constants/colors";
import { Spacing, BorderRadius, FontSize, FontWeight } from "../../constants/spacing";
import { Event } from "../../utils/types";
import { getImageUrl } from "../../utils/api";

const { width } = Dimensions.get("window");

interface TrendingEventCardProps {
  event: Event;
  index: number;
  onPress: () => void;
}

export const TrendingEventCard: React.FC<TrendingEventCardProps> = ({ event, index, onPress }) => {
  const imageUrl = getImageUrl(event.imageUrl);
  const firstTag = event.tags && event.tags.length > 0 ? event.tags[0] : "Event";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUrl || "https://via.placeholder.com/300x200?text=No+Image" }} 
          style={styles.image} 
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.imageGradient}
        />
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>#{index + 1}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{firstTag}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: (width - Spacing.lg * 3) / 2,
    marginBottom: Spacing.md,
    position: "relative",
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
    height: 180,
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
    height: 80,
  },
  numberBadge: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  numberText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  tag: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
});
