import React from "react";
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Post } from "../../utils/types";
import { Colors } from "../../constants/colors";
import { Spacing, BorderRadius, FontSize, FontWeight } from "../../constants/spacing";
import { formatDate } from "../../utils/formatters";
import { getImageUrl } from "../../utils/api";
import { Button } from "../common/Button";

interface PostDetailProps {
  post: Post;
  type: "showbiz" | "blog";
}

export const PostDetail: React.FC<PostDetailProps> = ({ post, type }) => {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.backButtonContainer}>
        <Button
          title="← Quay lại"
          variant="outline"
          onPress={() => navigation.goBack()}
          size="small"
        />
      </View>

      {post.imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: getImageUrl(post.imageUrl) }} style={styles.image} />
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{formatDate(post.createdAt)}</Text>
          </View>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{post.title}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{formatDate(post.createdAt)}</Text>
          <Text style={styles.metaSeparator}>•</Text>
          <Text style={styles.metaText}>{type === "blog" ? "Blog" : "Showbiz"}</Text>
        </View>
        <View style={styles.bodyContainer}>
          <Text style={styles.body}>{post.content.replace(/\n/g, "\n\n")}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButtonContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 250, // Mobile height như web
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
  content: {
    padding: 20, // Đồng bộ với web mobile padding
  },
  title: {
    fontSize: 24, // Đồng bộ với web mobile
    fontWeight: FontWeight.bold,
    marginBottom: 16,
    color: Colors.text,
    lineHeight: 32,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    fontSize: 14,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  metaSeparator: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  bodyContainer: {
    marginTop: 0,
  },
  body: {
    fontSize: 14, // Đồng bộ với web mobile
    lineHeight: 24,
    color: Colors.text,
  },
});
