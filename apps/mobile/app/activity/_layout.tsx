import { Stack } from 'expo-router';

export default function ActivityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="history" />
      <Stack.Screen name="workout" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="summary" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}

