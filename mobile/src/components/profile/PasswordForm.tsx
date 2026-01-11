import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../common/Card";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { changePassword } from "../../utils/api";
import { Colors } from "../../constants/colors";
import { Spacing, FontSize, FontWeight } from "../../constants/spacing";

export const PasswordForm: React.FC = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới nhập lại không khớp");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      Alert.alert("Thành công", "Đổi mật khẩu thành công");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={styles.card} variant="elevated" padding="large">
      <View style={styles.header}>
        <Ionicons name="lock-closed" size={24} color={Colors.primary} />
        <Text style={styles.title}>Đổi mật khẩu</Text>
        <Text style={styles.subtitle}>Cập nhật mật khẩu để bảo vệ tài khoản của bạn</Text>
      </View>
      
      <Input
        label="Mật khẩu hiện tại"
        placeholder="Nhập mật khẩu hiện tại"
        value={oldPassword}
        onChangeText={setOldPassword}
        secureTextEntry
        editable={!loading}
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} />}
      />
      
      <Input
        label="Mật khẩu mới"
        placeholder="Nhập mật khẩu mới"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        editable={!loading}
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} />}
      />
      
      <Input
        label="Nhập lại mật khẩu mới"
        placeholder="Nhập lại mật khẩu mới"
        value={confirmNewPassword}
        onChangeText={setConfirmNewPassword}
        secureTextEntry
        editable={!loading}
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} />}
      />
      
      <Button
        title="Cập nhật mật khẩu"
        onPress={handleSubmit}
        loading={loading}
        size="large"
        style={styles.submitButton}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 0,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
