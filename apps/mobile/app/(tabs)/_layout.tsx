import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng quan',
          tabBarLabel: 'Tổng quan',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity/index"
        options={{
          title: 'Hoạt động',
          tabBarLabel: 'Hoạt động',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="directions-run" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="health/index"
        options={{
          title: 'Sức khỏe',
          tabBarLabel: 'Sức khỏe',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="favorite" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminder/index"
        options={{
          title: 'Nhắc nhở',
          tabBarLabel: 'Nhắc nhở',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="notifications" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Cá nhân',
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size || 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
