import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthCard } from "../components/auth/AuthCard";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { AuthLink } from "../components/auth/AuthLink";
import { useAuth } from "../hooks/useAuth";
import { Colors } from "../constants/colors";
import { Spacing } from "../constants/spacing";

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loading, handleLogin } = useAuth();

  const onSuccess = () => {
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const onEmailVerification = () => {
    navigation.navigate("VerifyEmail" as never);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AuthCard
          title="Đăng nhập"
          subtitle="Đăng nhập để khám phá các sự kiện thú vị."
        >
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.textLight} />}
          />

          <Input
            label="Mật khẩu"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} />}
          />

          <Button
            title="Đăng nhập"
            onPress={() => handleLogin(email, password, onSuccess, onEmailVerification)}
            loading={loading}
            size="large"
            style={styles.loginButton}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword" as never)}
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <AuthLink
            text="Chưa có tài khoản?"
            linkText="Đăng ký ngay"
            onPress={() => navigation.navigate("Register" as never)}
          />
        </AuthCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  loginButton: {
    marginTop: Spacing.md,
  },
  forgotButton: {
    marginTop: Spacing.md,
    alignItems: "center",
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
