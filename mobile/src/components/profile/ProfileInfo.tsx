import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../common/Card";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { UserInfo } from "../../utils/types";
import { Colors } from "../../constants/colors";
import { Spacing, FontSize, FontWeight } from "../../constants/spacing";

interface ProfileInfoProps {
  user: UserInfo;
  onLogout: () => void;
  onChangePassword: () => void;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ user, onLogout, onChangePassword }) => {
  return (
    <Card style={styles.card} variant="elevated" padding="large">
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.welcomeText}>Xin chào,</Text>
        <Text style={styles.userName}>{user.name}</Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Họ và tên</Text>
            <Text style={styles.infoValue}>{user.name}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Vai trò</Text>
            <Text style={styles.infoValue}>Người dùng</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Đổi mật khẩu"
          variant="outline"
          onPress={onChangePassword}
          style={styles.button}
        />
        <Button
          title="Đăng xuất"
          variant="danger"
          onPress={onLogout}
          style={styles.button}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  welcomeText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  infoSection: {
    marginBottom: Spacing.xl,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.medium,
  },
  actions: {
    marginTop: Spacing.md,
  },
  button: {
    marginTop: Spacing.md,
  },
});
