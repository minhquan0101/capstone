import React, { useEffect, useState, useRef } from "react";
import { NavigationContainer, CommonActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserInfo } from "./src/utils/types";
import { getCurrentUser } from "./src/utils/api";
import { Colors } from "./src/constants/colors";

// Screens
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import VerifyEmailScreen from "./src/screens/VerifyEmailScreen";
import ShowbizScreen from "./src/screens/ShowbizScreen";
import ShowbizDetailScreen from "./src/screens/ShowbizDetailScreen";
import BlogsScreen from "./src/screens/BlogsScreen";
import BlogDetailScreen from "./src/screens/BlogDetailScreen";
import EventDetailScreen from "./src/screens/EventDetailScreen";
import PaymentScreen from "./src/screens/PaymentScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import ChangePasswordScreen from "./src/screens/ChangePasswordScreen";

export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Register: undefined;
  VerifyEmail: undefined;
  ShowbizDetail: { postId: string };
  BlogDetail: { postId: string };
  EventDetail: { eventId: string };
  Payment: { bookingId: string };
  ForgotPassword: undefined;
  ChangePassword: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

interface MainTabsProps {
  onLogout: () => void;
}

function MainTabs({ onLogout }: MainTabsProps) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.borderLight,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Trang chủ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Showbiz"
        component={ShowbizScreen}
        options={{
          tabBarLabel: "ShowBiz",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-notes" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Blogs"
        component={BlogsScreen}
        options={{
          tabBarLabel: "Blogs",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: "Tài khoản",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      >
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigationRef = useRef<any>(null);
  const prevUserRef = useRef<UserInfo | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        // Check token expiration
        try {
          const [, payloadBase64] = token.split(".");
          if (!payloadBase64) {
            await AsyncStorage.removeItem("token");
            setLoading(false);
            return;
          }

          const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
          const payload = JSON.parse(payloadJson) as { exp?: number };

          if (payload.exp && payload.exp * 1000 < Date.now()) {
            await AsyncStorage.removeItem("token");
            setLoading(false);
            return;
          }
        } catch {
          await AsyncStorage.removeItem("token");
          setLoading(false);
          return;
        }

        // Get current user
        const data = await getCurrentUser();
        if (data.user) {
          setUser({
            name: data.user.name,
            email: data.user.email,
            role: data.user.role || "user",
          });
        }
      } catch {
        await AsyncStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Function to update user state after login
  const handleLoginSuccess = async () => {
    try {
      const data = await getCurrentUser();
      if (data.user) {
        setUser({
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || "user",
        });
      }
    } catch {
      // Handle error
    }
  };

  // Function to handle logout
  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    setUser(null);
  };

  // Reset navigation to Login screen when user logs out
  useEffect(() => {
    // Only reset if user changed from authenticated to unauthenticated (logout)
    if (prevUserRef.current !== null && user === null && !loading && navigationRef.current) {
      // Use setTimeout to ensure navigator has re-rendered with new routes
      setTimeout(() => {
        if (navigationRef.current) {
          navigationRef.current.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          );
        }
      }, 0);
    }
    prevUserRef.current = user;
  }, [user, loading]);

  if (loading) {
    return null; // You can add a loading screen here
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName={user ? "MainTabs" : "Login"}
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerShadowVisible: false,
          headerTintColor: Colors.white,
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 18,
          },
          headerBackTitleVisible: false,
        }}
      >
        {user ? (
          // Authenticated routes
          <>
            <Stack.Screen
              name="MainTabs"
              options={{ headerShown: false }}
            >
              {(props) => <MainTabs {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen
              name="ShowbizDetail"
              component={ShowbizDetailScreen}
              options={{ title: "Chi tiết ShowBiz" }}
            />
            <Stack.Screen
              name="BlogDetail"
              component={BlogDetailScreen}
              options={{ title: "Chi tiết Blog" }}
            />
            <Stack.Screen
              name="EventDetail"
              component={EventDetailScreen}
              options={{ title: "Chi tiết sự kiện", headerShown: false }}
            />
            <Stack.Screen
              name="Payment"
              component={PaymentScreen}
              options={{ title: "Thanh toán" }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{ title: "Đổi mật khẩu" }}
            />
          </>
        ) : (
          // Unauthenticated routes
          <>
            <Stack.Screen
              name="Login"
              options={{ headerShown: false }}
            >
              {(props) => <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />}
            </Stack.Screen>
            <Stack.Screen
              name="Register"
              options={{ title: "Đăng ký" }}
            >
              {(props) => <RegisterScreen {...props} onLoginSuccess={handleLoginSuccess} />}
            </Stack.Screen>
            <Stack.Screen
              name="VerifyEmail"
              options={{ title: "Xác minh email" }}
            >
              {(props) => <VerifyEmailScreen {...props} onLoginSuccess={handleLoginSuccess} />}
            </Stack.Screen>
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ title: "Quên mật khẩu" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

