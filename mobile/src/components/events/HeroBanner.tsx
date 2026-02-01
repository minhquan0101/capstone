import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Dimensions, ImageBackground, FlatList } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../../constants/colors";
import { Spacing, FontSize, FontWeight } from "../../constants/spacing";
import { getImageUrl } from "../../utils/api";
import { Event } from "../../utils/types";

const { width } = Dimensions.get("window");

interface HeroBannerProps {
  bannerUrl?: string | null;
  events?: Event[];
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ bannerUrl, events = [] }) => {
  const listRef = useRef<FlatList<any>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = useMemo(() => {
    const eventSlides = events
      .filter((e) => e.imageUrl)
      .map((e) => ({
        id: e._id,
        title: e.title,
        image: getImageUrl(e.imageUrl || ""),
      }));

    if (eventSlides.length > 0) return eventSlides;

    const bannerImage = bannerUrl ? getImageUrl(bannerUrl) : null;
    if (bannerImage) {
      return [
        {
          id: "banner",
          title: "TicketFast",
          image: bannerImage,
        },
      ];
    }

    return [];
  }, [events, bannerUrl]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % slides.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <View style={styles.bannerContainer}>
      {slides.length > 0 ? (
        <>
          <FlatList
            ref={listRef}
            data={slides}
            horizontal
            pagingEnabled
            snapToInterval={width}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveIndex(index);
            }}
            renderItem={({ item }) => (
              <ImageBackground
                source={{ uri: item.image }}
                style={[styles.banner, { width }]}
                imageStyle={styles.bannerImage}
              >
                <LinearGradient
                  colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.6)"]}
                  style={styles.overlay}
                >
                  <View style={styles.content}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.title || "TicketFast"}
                    </Text>
                    <Text style={styles.subtitle}>Khám phá các sự kiện thú vị</Text>
                  </View>
                </LinearGradient>
              </ImageBackground>
            )}
          />
          {slides.length > 1 && (
            <View style={styles.dots}>
              {slides.map((_, idx) => (
                <View key={`dot-${idx}`} style={[styles.dot, idx === activeIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </>
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
  dots: {
    position: "absolute",
    bottom: Spacing.sm,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
  },
  dotActive: {
    width: 16,
    backgroundColor: Colors.white,
  },
});
