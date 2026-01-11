import { useState, useEffect } from "react";
import { getPost } from "../utils/api";
import { Post } from "../utils/types";

export const usePost = (postId: string | undefined) => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        setLoading(true);
        const data = await getPost(postId);
        setPost(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải bài viết");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  return {
    post,
    loading,
    error,
  };
};

