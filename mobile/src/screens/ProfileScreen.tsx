import React from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProfileInfo } from "../components/profile/ProfileInfo";
import { PasswordForm } from "../components/profile/PasswordForm";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useUser } from "../hooks/useUser";
import { Colors } from "../constants/colors";

interface ProfileScreenProps {
  onLogout?: () => void;
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const navigation = useNavigation();
  const { user, loading } = useUser();

  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("token");
          if (onLogout) {
            onLogout();
          }
        },
      },
    ]);
  };

  const handleChangePassword = () => {
    navigation.navigate("ChangePassword" as never);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Hồ sơ người dùng</Text>
        <Text style={styles.subtitle}>Bạn cần đăng nhập để xem thông tin hồ sơ.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ProfileInfo user={user} onLogout={handleLogout} onChangePassword={handleChangePassword} />
      <PasswordForm />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
});
