import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthCard } from "../components/auth/AuthCard";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { AuthLink } from "../components/auth/AuthLink";
import { useAuth } from "../hooks/useAuth";
import { Colors } from "../constants/colors";
import { Spacing } from "../constants/spacing";

interface VerifyEmailScreenProps {
  onLoginSuccess?: () => void;
}

export default function VerifyEmailScreen({ onLoginSuccess }: VerifyEmailScreenProps) {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(
    "Vui lòng nhập email và mã xác minh đã được gửi vào hộp thư của bạn."
  );
  const { loading, handleVerifyEmail } = useAuth();

  useEffect(() => {
    const loadPendingEmail = async () => {
      const pendingEmail = await AsyncStorage.getItem("pendingEmailVerify");
      if (pendingEmail) {
        setEmail(pendingEmail);
        setInfoMessage(
          `Mã xác minh đã được gửi tới ${pendingEmail}. Vui lòng kiểm tra hộp thư (kể cả mục Spam).`
        );
      }
    };
    loadPendingEmail();
  }, []);

  const onSuccess = () => {
    if (onLoginSuccess) {
      onLoginSuccess();
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
        <AuthCard title="Xác minh email">
          {infoMessage && (
            <View style={styles.infoBox}>
              <Ionicons name="mail" size={20} color={Colors.info} style={styles.infoIcon} />
              <Text style={styles.infoText}>{infoMessage}</Text>
            </View>
          )}

          <Input
            label="Email đã đăng ký"
            placeholder="Nhập email bạn đã dùng để đăng ký"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
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

          <Button
            title="Xác minh"
            onPress={() => handleVerifyEmail(email, code, onSuccess)}
            loading={loading}
            size="large"
            style={styles.verifyButton}
          />

          <AuthLink
            text="Đã có tài khoản?"
            linkText="Quay lại đăng nhập"
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
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#E0F2FE",
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    alignItems: "flex-start",
  },
  infoIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#0369A1",
    lineHeight: 20,
  },
  codeInput: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: "600",
  },
  verifyButton: {
    marginTop: Spacing.md,
  },
});
