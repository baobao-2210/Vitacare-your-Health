import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/constants/theme';
import { useWorkoutSession } from '../../src/hooks/useWorkoutSession';
import { ActivityType } from '../../src/types';

const { width } = Dimensions.get('window');

export default function WorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const activityType: ActivityType = (params.type as ActivityType) || 'WALKING';

  const {
    id,
    status,
    steps,
    distanceKm,
    caloriesKcal,
    formattedDuration,
    formattedPace,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    finishWorkout,
    simulateStepIncrement,
  } = useWorkoutSession();

  const isRunning = activityType === 'RUNNING';
  const activityTitle = isRunning ? 'Chạy Bộ Ngoài Trời' : 'Đi Bộ Thể Thao';
  const activityIcon = isRunning ? 'run' : 'walk';

  useEffect(() => {
    // Tự động bắt đầu phiên tập khi vào màn hình nếu chưa có phiên active
    if (status === 'COMPLETED' || !id) {
      startWorkout(activityType);
    }
  }, []);

  const handleFinish = () => {
    Alert.alert(
      'Kết thúc bài tập',
      'Bạn có chắc chắn muốn hoàn thành phiên tập luyện này?',
      [
        { text: 'Tiếp tục tập', style: 'cancel' },
        {
          text: 'Hoàn thành',
          style: 'default',
          onPress: async () => {
            await finishWorkout();
            router.replace('/activity/summary' as any);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={26} color={Colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.pulsingDot,
                { backgroundColor: status === 'ACTIVE' ? '#22c55e' : '#eab308' },
              ]}
            />
            <Text style={styles.headerSub}>
              {status === 'ACTIVE' ? 'ĐANG TẬP LUYỆN' : 'TẠM DỪNG'}
            </Text>
          </View>
          <Text style={styles.headerTitle}>{activityTitle}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Main Timer Display */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>THỜI GIAN VẬN ĐỘNG</Text>
        <Text style={styles.timerText}>{formattedDuration}</Text>
      </View>

      {/* Primary Metrics Grid */}
      <View style={styles.metricsContainer}>
        {/* Metric 1: Distance */}
        <View style={styles.metricCard}>
          <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
            <Ionicons name="navigate" size={20} color="#0284c7" />
          </View>
          <Text style={styles.metricValue}>{distanceKm.toFixed(2)}</Text>
          <Text style={styles.metricUnit}>Quãng đường (km)</Text>
        </View>

        {/* Metric 2: Steps */}
        <View style={styles.metricCard}>
          <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="footsteps" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.metricValue}>{steps.toLocaleString('vi-VN')}</Text>
          <Text style={styles.metricUnit}>Bước chân</Text>
        </View>

        {/* Metric 3: Pace */}
        <View style={styles.metricCard}>
          <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="speedometer" size={20} color="#d97706" />
          </View>
          <Text style={styles.metricValue}>{formattedPace}</Text>
          <Text style={styles.metricUnit}>Pace trung bình</Text>
        </View>

        {/* Metric 4: Calories */}
        <View style={styles.metricCard}>
          <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="flame" size={20} color="#ea580c" />
          </View>
          <Text style={styles.metricValue}>{caloriesKcal.toFixed(0)}</Text>
          <Text style={styles.metricUnit}>Calo tiêu hao (kcal)</Text>
        </View>
      </View>

      {/* Sensor Info & Debug Sim Button */}
      <View style={styles.sensorInfoCard}>
        <View style={styles.sensorInfoLeft}>
          <Ionicons name="hardware-chip-outline" size={18} color={Colors.primary} />
          <Text style={styles.sensorInfoText}>Cảm biến Pedometer tích hợp tự động</Text>
        </View>
        <TouchableOpacity
          style={styles.simStepBtn}
          onPress={() => simulateStepIncrement(50)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={14} color={Colors.primary} />
          <Text style={styles.simStepText}>+50 Bước (Test)</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.controlsContainer}>
        {status === 'ACTIVE' ? (
          <>
            {/* Pause Button */}
            <TouchableOpacity
              style={[styles.controlBtn, styles.pauseBtn]}
              onPress={() => pauseWorkout()}
              activeOpacity={0.8}
            >
              <Ionicons name="pause" size={32} color="#854d0e" />
              <Text style={[styles.controlBtnText, { color: '#854d0e' }]}>Tạm Dừng</Text>
            </TouchableOpacity>

            {/* Finish Button */}
            <TouchableOpacity
              style={[styles.controlBtn, styles.finishBtn]}
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <Ionicons name="stop" size={32} color="#ffffff" />
              <Text style={[styles.controlBtnText, { color: '#ffffff' }]}>Kết Thúc</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Resume Button */}
            <TouchableOpacity
              style={[styles.controlBtn, styles.resumeBtn]}
              onPress={() => resumeWorkout()}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={32} color="#ffffff" />
              <Text style={[styles.controlBtnText, { color: '#ffffff' }]}>Tiếp Tục</Text>
            </TouchableOpacity>

            {/* Finish Button */}
            <TouchableOpacity
              style={[styles.controlBtn, styles.finishBtn]}
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <Ionicons name="stop" size={32} color="#ffffff" />
              <Text style={[styles.controlBtnText, { color: '#ffffff' }]}>Kết Thúc</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a', // Deep dark theme for workout focus
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - Spacing.md * 3) / 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  metricUnit: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  sensorInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.2)',
  },
  sensorInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sensorInfoText: {
    fontSize: 12,
    color: '#5eead4',
    fontWeight: '500',
  },
  simStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  simStepText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: 'auto',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  controlBtn: {
    flex: 1,
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.card,
  },
  pauseBtn: {
    backgroundColor: '#fef08a',
  },
  resumeBtn: {
    backgroundColor: Colors.primary,
  },
  finishBtn: {
    backgroundColor: '#ef4444',
  },
  controlBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
