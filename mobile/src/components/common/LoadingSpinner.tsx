import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";
import { Spacing, FontSize } from "../../constants/spacing";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "large";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, size = "large" }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={Colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.backgroundLight,
  },
  message: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
});
