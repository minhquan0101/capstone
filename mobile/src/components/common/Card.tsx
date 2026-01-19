import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Colors } from "../../constants/colors";
import { Spacing, BorderRadius } from "../../constants/spacing";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "small" | "medium" | "large";
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = "default",
  padding = "medium",
}) => {
  return (
    <View style={[styles.card, styles[variant], styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`], style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
  },
  default: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "transparent",
    elevation: 0,
  },
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: Spacing.md,
  },
  paddingMedium: {
    padding: Spacing.lg,
  },
  paddingLarge: {
    padding: Spacing.xl,
  },
});
