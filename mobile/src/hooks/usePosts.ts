import { useState, useEffect } from "react";
import { getPosts } from "../utils/api";
import { Post } from "../utils/types";

export const usePosts = (type?: "showbiz" | "blog") => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [type]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await getPosts();
      const filteredPosts = type ? data.filter((post) => post.type === type) : data;
      setPosts(filteredPosts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  return {
    posts,
    loading,
    error,
    refetch: fetchPosts,
  };
};

