import React from "react";
import { View, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { PostDetail } from "../components/posts/PostDetail";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { usePost } from "../hooks/usePost";
import { Colors } from "../constants/colors";

type RouteProps = RouteProp<RootStackParamList, "ShowbizDetail">;

export default function ShowbizDetailScreen() {
  const route = useRoute<RouteProps>();
  const { postId } = route.params;
  const { post, loading, error } = usePost(postId);

  if (loading) {
    return <LoadingSpinner message="Đang tải..." />;
  }

  if (error || !post) {
    return <EmptyState message={error || "Không tìm thấy bài viết"} />;
  }

  return (
    <View style={styles.container}>
      <PostDetail post={post} type="showbiz" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
