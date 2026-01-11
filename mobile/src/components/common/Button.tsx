import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../../constants/colors";
import { Spacing, BorderRadius, FontSize, FontWeight } from "../../constants/spacing";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "danger" | "secondary";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  size?: "small" | "medium" | "large";
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  size = "medium",
}) => {
  const buttonStyle: (ViewStyle | false)[] = [
    styles.button,
    styles[size],
    variant !== "primary" && styles[variant],
    (loading || disabled) && styles.disabled,
  ];
  const textStyle: (TextStyle | false)[] = [
    styles.text,
    styles[`${size}Text`],
    variant === "outline" && styles.outlineText,
    variant === "secondary" && styles.secondaryText,
  ];

  const content = loading ? (
    <ActivityIndicator color={variant === "outline" || variant === "secondary" ? Colors.primary : Colors.white} />
  ) : (
    <Text style={textStyle}>{title}</Text>
  );

  if (variant === "primary") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={loading || disabled}
        activeOpacity={0.8}
        style={[buttonStyle, style]}
      >
        <LinearGradient
          colors={Colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, styles[size]]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.7}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gradient: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  small: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 36,
  },
  medium: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
  },
  large: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    minHeight: 56,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.gray100,
  },
  danger: {
    backgroundColor: Colors.error,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },
  smallText: {
    fontSize: FontSize.sm,
  },
  mediumText: {
    fontSize: FontSize.md,
  },
  largeText: {
    fontSize: FontSize.lg,
  },
  outlineText: {
    color: Colors.primary,
  },
  secondaryText: {
    color: Colors.text,
  },
});
