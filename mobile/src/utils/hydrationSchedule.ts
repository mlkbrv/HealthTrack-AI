import { Platform } from "react-native";
import Constants from "expo-constants";
import type { AxiosInstance } from "axios";

export function isAndroidExpoGoNoNotifications(): boolean {
  return Platform.OS === "android" && Constants.appOwnership === "expo";
}

type Block = { weekday: number; start_time: string; end_time: string };

function toMin(t: string): number {
  const p = t.split(":");
  const h = parseInt(p[0] || "0", 10);
  const m = parseInt(p[1] || "0", 10);
  return h * 60 + m;
}

function jsToPyWeekday(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function pointInBlocks(minutes: number, blocks: Block[]): boolean {
  for (const b of blocks) {
    const a = toMin(b.start_time);
    const z = toMin(b.end_time);
    if (z > a && minutes >= a && minutes < z) return true;
    if (z <= a && (minutes >= a || minutes < z)) return true;
  }
  return false;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (isAndroidExpoGoNoNotifications()) return false;
  const Notifications = await import("expo-notifications");
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  return final === "granted";
}

export const HYDRATION_UNSUPPORTED_EXPO_GO_ANDROID =
  "Scheduled local notifications are not available in Expo Go on Android (SDK 53+). Use a development build, or test reminders on iOS Expo Go / a release build.";

export async function scheduleHydrationFromServer(api: AxiosInstance): Promise<number> {
  if (isAndroidExpoGoNoNotifications()) {
    return -1;
  }
  const Notifications = await import("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== "granted") return 0;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("hydration", {
      name: "Hydration",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  const { data } = await api.get<{ class_blocks: Block[] }>("hydration/quiet-windows/");
  const byWd: Record<number, Block[]> = {};
  for (const b of data.class_blocks || []) {
    if (!byWd[b.weekday]) byWd[b.weekday] = [];
    byWd[b.weekday].push(b);
  }
  const candidates = [9, 11, 13, 15, 17, 19];
  const now = new Date();
  let scheduled = 0;
  for (let i = 0; i < 7 && scheduled < 21; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setSeconds(0, 0);
    const wd = jsToPyWeekday(d);
    const blocks = byWd[wd] || [];
    let n = 0;
    for (const h of candidates) {
      if (n >= 2) break;
      const minutes = h * 60 + 30;
      if (pointInBlocks(minutes, blocks)) continue;
      const when = new Date(d);
      when.setHours(h, 0, 0, 0);
      if (when.getTime() <= Date.now()) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Hydration",
          body: "Time for a glass of water.",
          ...(Platform.OS === "android" ? { channelId: "hydration" } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
        },
      });
      n += 1;
      scheduled += 1;
    }
  }
  return scheduled;
}
