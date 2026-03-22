module.exports = {
  expo: {
    name: "HealthTrack AI",
    slug: "healthtrack-ai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsLocalNetworking: true,
        },
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      usesCleartextTraffic: true,
      permissions: ["RECEIVE_BOOT_COMPLETED", "POST_NOTIFICATIONS"],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-secure-store", ["expo-notifications", { sounds: [] }]],
  },
};
