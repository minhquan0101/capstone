import { useState } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login, register, verifyEmail } from "../utils/api";
import { AuthResponse } from "../utils/types";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (
    email: string,
    password: string,
    onSuccess: () => void,
    onEmailVerification: (email: string) => void
  ) => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    try {
      const authResponse = await login(email, password);

      if (authResponse.requireEmailVerification) {
        await AsyncStorage.setItem("pendingEmailVerify", email);
        Alert.alert(
          "Xác minh email",
          authResponse.message ||
            "Tài khoản chưa xác minh email. Vui lòng kiểm tra email hoặc nhập mã xác minh.",
          [
            {
              text: "OK",
              onPress: () => onEmailVerification(email),
            },
          ]
        );
        return;
      }

      if (authResponse.token && authResponse.user) {
        await AsyncStorage.setItem("token", authResponse.token);
        onSuccess();
      } else if (authResponse.message) {
        Alert.alert("Lỗi", authResponse.message);
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    onSuccess: () => void,
    onEmailVerification: (email: string) => void
  ) => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    const trimmedName = name.trim();
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
    if (!trimmedName || !nameRegex.test(trimmedName)) {
      Alert.alert("Lỗi", "Họ tên chỉ được chứa chữ cái và khoảng trắng");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu nhập lại không khớp");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      const authResponse = await register(trimmedName, email, password);

      if (authResponse.requireEmailVerification) {
        await AsyncStorage.setItem("pendingEmailVerify", email);
        Alert.alert("Đăng ký thành công", "Vui lòng kiểm tra email để lấy mã xác minh.", [
          {
            text: "OK",
            onPress: () => onEmailVerification(email),
          },
        ]);
        return;
      }

      if (authResponse.token && authResponse.user) {
        await AsyncStorage.setItem("token", authResponse.token);
        onSuccess();
      } else if (authResponse.message) {
        Alert.alert("Lỗi", authResponse.message);
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (
    email: string,
    code: string,
    onSuccess: () => void
  ) => {
    if (!email || !code) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    try {
      const data = await verifyEmail(email, code);

      if (data.token && data.user) {
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.removeItem("pendingEmailVerify");
        onSuccess();
      } else {
        Alert.alert("Lỗi", data.message || "Xác minh email thất bại");
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleLogin,
    handleRegister,
    handleVerifyEmail,
  };
};

