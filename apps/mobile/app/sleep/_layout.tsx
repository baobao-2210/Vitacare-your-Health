import { Stack } from 'expo-router';

export default function SleepLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="stats" />
    </Stack>
  );
}

