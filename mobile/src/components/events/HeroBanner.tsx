import React from "react";
import { View, Text, StyleSheet, Dimensions, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../../constants/colors";
import { Spacing, FontSize, FontWeight } from "../../constants/spacing";
import { getImageUrl } from "../../utils/api";

const { width } = Dimensions.get("window");

interface HeroBannerProps {
  bannerUrl?: string | null;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ bannerUrl }) => {
  const bannerImage = bannerUrl ? getImageUrl(bannerUrl) : null;

  return (
    <View style={styles.bannerContainer}>
      {bannerImage ? (
        <ImageBackground
          source={{ uri: bannerImage }}
          style={styles.banner}
          imageStyle={styles.bannerImage}
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.6)"]}
            style={styles.overlay}
          >
            <View style={styles.content}>
              <Text style={styles.title}>TicketFast</Text>
              <Text style={styles.subtitle}>Khám phá các sự kiện thú vị</Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={Colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.content}>
            <Text style={styles.title}>TicketFast</Text>
            <Text style={styles.subtitle}>Khám phá các sự kiện thú vị</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🎫 Hơn 1000+ sự kiện</Text>
            </View>
          </View>
        </LinearGradient>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    height: 220,
    width: "100%",
  },
  banner: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    width: "100%",
  },
  bannerImage: {
    resizeMode: "cover",
  },
  overlay: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  content: {
    alignItems: "center",
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.sm,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.white,
    opacity: 0.95,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginTop: Spacing.sm,
  },
  badgeText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
