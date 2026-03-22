import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import PlanHubScreen from "../screens/PlanHubScreen";
import WellnessScreen from "../screens/WellnessScreen";
import MoodScreen from "../screens/MoodScreen";
import ScheduleScreen from "../screens/ScheduleScreen";
import DeadlinesScreen from "../screens/DeadlinesScreen";
import MealsScreen from "../screens/MealsScreen";
import GroceryScreen from "../screens/GroceryScreen";
import InsightsScreen from "../screens/InsightsScreen";
import ChatScreen from "../screens/ChatScreen";
import SettingsScreen from "../screens/SettingsScreen";
import FocusScreen from "../screens/FocusScreen";
import { colors } from "../theme";
import type {
  AuthStackParamList,
  CoachStackParamList,
  HealthStackParamList,
  MainTabParamList,
  MoreStackParamList,
  PlanStackParamList,
} from "./types";

export type {
  AuthStackParamList,
  CoachStackParamList,
  HealthStackParamList,
  MainTabParamList,
  MoreStackParamList,
  PlanStackParamList,
} from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HealthStack = createNativeStackNavigator<HealthStackParamList>();
const PlanStack = createNativeStackNavigator<PlanStackParamList>();
const CoachStack = createNativeStackNavigator<CoachStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

const stackScreenOpts = {
  headerTintColor: colors.text,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.bg },
  contentStyle: { backgroundColor: colors.bg },
};

function HealthNavigator() {
  return (
    <HealthStack.Navigator screenOptions={stackScreenOpts}>
      <HealthStack.Screen name="Wellness" component={WellnessScreen} options={{ title: "Wellness logs" }} />
      <HealthStack.Screen name="Mood" component={MoodScreen} options={{ title: "Mood journal" }} />
    </HealthStack.Navigator>
  );
}

function PlanNavigator() {
  return (
    <PlanStack.Navigator screenOptions={stackScreenOpts}>
      <PlanStack.Screen name="PlanHome" component={PlanHubScreen} options={{ title: "Plan" }} />
      <PlanStack.Screen name="Schedule" component={ScheduleScreen} options={{ title: "Class schedule" }} />
      <PlanStack.Screen name="Deadlines" component={DeadlinesScreen} options={{ title: "Deadlines" }} />
      <PlanStack.Screen name="Meals" component={MealsScreen} options={{ title: "Meals & plan" }} />
      <PlanStack.Screen name="Grocery" component={GroceryScreen} options={{ title: "Grocery list" }} />
    </PlanStack.Navigator>
  );
}

function CoachNavigator() {
  return (
    <CoachStack.Navigator screenOptions={stackScreenOpts}>
      <CoachStack.Screen name="Insights" component={InsightsScreen} options={{ title: "Insights" }} />
      <CoachStack.Screen name="Chat" component={ChatScreen} options={{ title: "Assistant" }} />
    </CoachStack.Navigator>
  );
}

function MoreNavigator() {
  return (
    <MoreStack.Navigator screenOptions={stackScreenOpts}>
      <MoreStack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      <MoreStack.Screen name="Focus" component={FocusScreen} options={{ title: "Focus & audio" }} />
    </MoreStack.Navigator>
  );
}

function tabIcon(routeName: keyof MainTabParamList, color: string, size: number) {
  const map: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
    Home: "sunny-outline",
    Health: "fitness-outline",
    Plan: "grid-outline",
    Coach: "bulb-outline",
    More: "ellipsis-horizontal-circle-outline",
  };
  return <Ionicons name={map[routeName]} size={size} color={color} />;
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabPad = Math.max(insets.bottom, 10);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: route.name === "Home",
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitle: route.name === "Home" ? "HealthTrack AI" : "",
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: tabPad,
          minHeight: 54 + tabPad,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarIcon: ({ color, size }) => tabIcon(route.name as keyof MainTabParamList, color, size),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "Today" }} />
      <Tab.Screen name="Health" component={HealthNavigator} options={{ tabBarLabel: "Body", headerShown: false }} />
      <Tab.Screen name="Plan" component={PlanNavigator} options={{ tabBarLabel: "Plan", headerShown: false }} />
      <Tab.Screen name="Coach" component={CoachNavigator} options={{ tabBarLabel: "Coach", headerShown: false }} />
      <Tab.Screen name="More" component={MoreNavigator} options={{ tabBarLabel: "More", headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { ready, signedIn } = useAuth();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return (
    <NavigationContainer theme={navTheme}>
      {signedIn ? (
        <MainTabs />
      ) : (
        <AuthStack.Navigator
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: "Sign in" }} />
          <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: "Create account" }} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
