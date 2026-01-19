import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthCard } from "../components/auth/AuthCard";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { AuthLink } from "../components/auth/AuthLink";
import { useAuth } from "../hooks/useAuth";
import { Colors } from "../constants/colors";
import { Spacing } from "../constants/spacing";

interface RegisterScreenProps {
  onLoginSuccess?: () => void;
}

export default function RegisterScreen({ onLoginSuccess }: RegisterScreenProps) {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { loading, handleRegister } = useAuth();

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
          title="Đăng ký tài khoản"
          subtitle="Tạo tài khoản để khám phá các sự kiện yêu thích."
        >
          <Input
            label="Họ và tên"
            placeholder="Nhập họ tên của bạn"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            leftIcon={<Ionicons name="person-outline" size={20} color={Colors.textLight} />}
          />

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

          <Input
            label="Nhập lại mật khẩu"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} />}
          />

          <Button
            title="Đăng ký"
            onPress={() =>
              handleRegister(name, email, password, confirmPassword, onSuccess, onEmailVerification)
            }
            loading={loading}
            size="large"
            style={styles.registerButton}
          />

          <AuthLink
            text="Đã có tài khoản?"
            linkText="Đăng nhập"
            onPress={() => navigation.navigate("Login" as never)}
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
  registerButton: {
    marginTop: Spacing.md,
  },
});
