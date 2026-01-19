import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthCard } from "../components/auth/AuthCard";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { requestResetPassword, resetPassword } from "../utils/api";
import { Colors } from "../constants/colors";
import { Spacing } from "../constants/spacing";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"email" | "reset">("email");
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!email) {
      Alert.alert("Lỗi", "Vui lòng nhập email");
      return;
    }

    setLoading(true);
    try {
      await requestResetPassword(email);
      Alert.alert("Thành công", "Mã xác minh đã được gửi đến email của bạn. Vui lòng kiểm tra email.");
      setStep("reset");
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email || !code || !newPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, code, newPassword);
      Alert.alert("Thành công", "Đặt lại mật khẩu thành công. Đang chuyển đến trang đăng nhập...");
      setTimeout(() => {
        navigation.navigate("Login" as never);
      }, 2000);
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
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
          title="Quên mật khẩu"
          subtitle={
            step === "email"
              ? "Nhập email đăng ký để nhận mã xác minh qua email."
              : "Nhập mã xác minh đã được gửi đến email và mật khẩu mới."
          }
        >
          {step === "email" ? (
            <>
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
              <Button
                title="Gửi mã xác minh"
                onPress={handleRequestCode}
                loading={loading}
                size="large"
                style={styles.button}
              />
            </>
          ) : (
            <>
              <Input
                label="Email"
                value={email}
                editable={false}
                leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.textLight} />}
              />
              <Input
                label="Mã xác minh"
                placeholder="Nhập mã 6 số"
                value={code}
                onChangeText={(text: string) => setCode(text.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.codeInput}
                leftIcon={<Ionicons name="keypad-outline" size={20} color={Colors.textLight} />}
              />
              <Input
                label="Mật khẩu mới"
                placeholder="••••••••"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} />}
              />
              <Button
                title="Đặt lại mật khẩu"
                onPress={handleResetPassword}
                loading={loading}
                size="large"
                style={styles.button}
              />
              <Button
                title="Quay lại"
                variant="outline"
                onPress={() => {
                  setStep("email");
                  setCode("");
                  setNewPassword("");
                }}
                style={styles.backButton}
              />
            </>
          )}
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
  codeInput: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: "600",
  },
  button: {
    marginTop: Spacing.md,
  },
  backButton: {
    marginTop: Spacing.md,
  },
});
