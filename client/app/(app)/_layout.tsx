import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="store-select" options={{ presentation: "modal" }} />
      <Stack.Screen name="store-loading" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="list" options={{ presentation: "modal" }} />
      <Stack.Screen name="map" />
      <Stack.Screen name="navigation" />
    </Stack>
  );
}
