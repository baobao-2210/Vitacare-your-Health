import { Stack } from 'expo-router';
import { Colors } from '../../src/constants/theme';

export default function HealthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="history" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}

