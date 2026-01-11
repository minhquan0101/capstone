import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { PostList } from "../components/posts/PostList";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { usePosts } from "../hooks/usePosts";
import { Colors } from "../constants/colors";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function BlogsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { posts, loading, error } = usePosts("blog");

  const handlePostPress = (postId: string) => {
    navigation.navigate("BlogDetail", { postId });
  };

  if (loading) {
    return <LoadingSpinner message="Đang tải..." />;
  }

  if (error) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <EmptyState message={error} />
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <PostList title="blogs & news sự kiện" posts={posts} onPostPress={handlePostPress} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  contentContainer: {
    flexGrow: 1,
  },
});
