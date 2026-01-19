import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";

interface AuthLinkProps {
  text: string;
  linkText: string;
  onPress: () => void;
}

export const AuthLink: React.FC<AuthLinkProps> = ({ text, linkText, onPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text} </Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.link}>{linkText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  text: {
    fontSize: 14,
    color: Colors.textLight,
  },
  link: {
    fontSize: 14,
    color: Colors.primary,
  },
});

