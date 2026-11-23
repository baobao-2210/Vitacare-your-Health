import { Stack } from 'expo-router';

export default function NutritionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="search" />
      <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="stats" />
    </Stack>
  );
}

