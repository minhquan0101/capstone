export const Colors = {
  // Primary colors - Indigo (đồng bộ với web UI)
  primary: "#4f46e5",
  primaryDark: "#4338ca",
  primaryLight: "#6366f1",
  primaryGradient: ["#4f46e5", "#4338ca"],
  
  // Accent colors - Blue (cho category links active)
  accent: "#3b82f6",
  accentLight: "#60a5fa",
  accentDark: "#2563eb",
  
  // Success/Green (cho user button, status)
  success: "#22c55e",
  successDark: "#16a34a",
  successGradient: ["#22c55e", "#16a34a"],
  
  // Text colors (đồng bộ với web)
  text: "#111827",
  textSecondary: "#6b7280",
  textLight: "#9ca3af",
  textWhite: "#FFFFFF",
  
  // Background colors (đồng bộ với web)
  background: "#FFFFFF",
  backgroundLight: "#f5f6fa", // Đồng bộ với web body background
  backgroundDark: "#f3f4f6",
  
  // Border colors (đồng bộ với web)
  border: "#e5e7eb",
  borderLight: "#d1d5db",
  
  // Status colors
  error: "#ef4444",
  errorDark: "#dc2626",
  warning: "#f59e0b",
  info: "#3b82f6",
  
  // Neutral colors (đồng bộ với web)
  white: "#FFFFFF",
  black: "#000000",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",
  
  // Shadow colors (đồng bộ với web)
  shadow: "rgba(15, 23, 42, 0.08)",
  shadowDark: "rgba(15, 23, 42, 0.18)",
  shadowLight: "rgba(0, 0, 0, 0.1)",
} as const;
