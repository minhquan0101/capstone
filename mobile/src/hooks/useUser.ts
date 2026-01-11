import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUser } from "../utils/api";
import { UserInfo } from "../utils/types";

export const useUser = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const data = await getCurrentUser();
        if (data.user) {
          setUser({
            name: data.user.name,
            email: data.user.email,
            role: data.user.role || "user",
          });
        }
      }
    } catch (err) {
      // Not logged in
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    setUser(null);
  };

  return {
    user,
    loading,
    loadUser,
    logout,
  };
};

