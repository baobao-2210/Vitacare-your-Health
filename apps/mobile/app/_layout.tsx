import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../src/stores/auth.store';
import { Colors, FontSize, FontWeight, Spacing } from '../src/constants/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 * 5 },
  },
});

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const [fontsLoaded] = useFonts({
    ...MaterialIcons.font,
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
  });

  const { isAuthenticated, isLoading, isDemoMode, restoreSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const insets = useSafeAreaInsets();

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect unauthenticated user to login screen
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect authenticated user away from login/register to tabs
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, fontsLoaded, segments]);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.logoBadge}>
          <Text style={{ fontSize: 32 }}>🌿</Text>
        </View>
        <Text style={styles.brandTitle}>VitaCare</Text>
        <Text style={styles.brandSubtitle}>Your Health, Your Life</Text>
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      </View>
    );
  }

  return (
    <>
      {isDemoMode && (
        <View style={[styles.demoBanner, { paddingTop: Math.max(insets.top, 8) }]}>
          <MaterialIcons name="info-outline" size={14} color="#B45309" />
          <Text style={styles.demoBannerText}>
            CHẾ ĐỘ DÙNG THỬ (DEMO) — Dữ liệu chỉ lưu tạm trên thiết bị
          </Text>
        </View>
      )}
      {children}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <NavigationGuard>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="water" />
              <Stack.Screen name="sleep" />
              <Stack.Screen name="medication" />
              <Stack.Screen name="nutrition" />
              <Stack.Screen name="activity" />
              <Stack.Screen name="health" />
            </Stack>
          </NavigationGuard>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  brandTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  brandSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  demoBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  demoBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.3,
  },
});
