import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Post } from "../../utils/types";
import { Colors } from "../../constants/colors";
import { Spacing, BorderRadius, FontSize, FontWeight } from "../../constants/spacing";
import { formatDate, getExcerpt } from "../../utils/formatters";
import { getImageUrl } from "../../utils/api";

interface PostCardProps {
  post: Post;
  onPress: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {post.imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: getImageUrl(post.imageUrl) }} style={styles.image} />
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{formatDate(post.createdAt)}</Text>
          </View>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
        <Text style={styles.meta}>{formatDate(post.createdAt)}</Text>
        <Text style={styles.excerpt} numberOfLines={3}>
          {getExcerpt(post.content)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16, // Đồng bộ với web gap
    width: "100%", // 1 cột trên mobile
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dateBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#f59e0b", // Màu vàng như web
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1,
  },
  dateBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: FontWeight.semibold,
  },
  body: {
    padding: 14,
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    lineHeight: 22,
  },
  meta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  excerpt: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
