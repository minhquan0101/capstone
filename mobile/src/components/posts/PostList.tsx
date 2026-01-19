import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Post } from "../../utils/types";
import { PostCard } from "./PostCard";
import { EmptyState } from "../common/EmptyState";
import { Colors } from "../../constants/colors";
import { Spacing, FontSize, FontWeight } from "../../constants/spacing";

const { width } = Dimensions.get("window");

interface PostListProps {
  title: string;
  posts: Post[];
  onPostPress: (postId: string) => void;
}

export const PostList: React.FC<PostListProps> = ({ title, posts, onPostPress }) => {
  if (posts.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <EmptyState message="Chưa có bài viết nào" />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.grid}>
        {posts.map((post) => (
          <PostCard key={post._id} post={post} onPress={() => onPostPress(post._id)} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: FontWeight.semibold,
    textTransform: "lowercase",
    color: Colors.text,
  },
  grid: {
    paddingBottom: Spacing.xl,
  },
});
