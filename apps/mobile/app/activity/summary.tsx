import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/constants/theme';
import { useWorkoutSession } from '../../src/hooks/useWorkoutSession';

const { width } = Dimensions.get('window');

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getLastCompletedSession } = useWorkoutSession();
  const session = getLastCompletedSession();

  const isRunning = session?.activityType === 'RUNNING';
  const activityLabel = isRunning ? 'Chạy Bộ Ngoài Trời' : 'Đi Bộ Thể Thao';

  const formatDuration = (totalSeconds = 0) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Celebration Header */}
        <View style={styles.celebrateBox}>
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={44} color="#f59e0b" />
          </View>
          <Text style={styles.title}>Hoàn Thành Bài Tập!</Text>
          <Text style={styles.subTitle}>
            Tuyệt vời! Bạn đã hoàn thành một bài tập rèn luyện thể chất xuất sắc.
          </Text>
          <View style={styles.activityBadge}>
            <MaterialCommunityIcons name={isRunning ? 'run' : 'walk'} size={18} color={Colors.primary} />
            <Text style={styles.activityBadgeText}>{activityLabel}</Text>
          </View>
        </View>

        {/* Primary Stats Grid */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>TỔNG KẾT THÀNH TÍCH</Text>

          <View style={styles.statRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Thời gian</Text>
              <Text style={styles.statValue}>
                {formatDuration(session?.durationSeconds || 0)}
              </Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Quãng đường</Text>
              <Text style={styles.statValue}>
                {(session?.distanceKm || 0).toFixed(2)}{' '}
                <Text style={styles.statUnit}>km</Text>
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Bước chân</Text>
              <Text style={styles.statValue}>
                {(session?.steps || 0).toLocaleString('vi-VN')}
              </Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Calo tiêu hao</Text>
              <Text style={styles.statValue}>
                {(session?.caloriesKcal || 0).toFixed(0)}{' '}
                <Text style={styles.statUnit}>kcal</Text>
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Pace trung bình</Text>
              <Text style={styles.statValue}>
                {session?.averagePaceMinPerKm
                  ? `${session.averagePaceMinPerKm.toFixed(1)}'/km`
                  : `--'/km`}
              </Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Tạm dừng</Text>
              <Text style={styles.statValue}>
                {session?.pausedSeconds || 0} <Text style={styles.statUnit}>giây</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Informative Note */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.infoBannerText}>
            Số bước trong bài tập này đã được đồng bộ tự động vào tổng số bước hàng ngày qua cảm biến điện thoại.
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => {
            queryClient.invalidateQueries({ queryKey: ['activity'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            router.replace('/(tabs)/activity');
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>Về Trang Hoạt Động</Text>
          <Ionicons name="arrow-forward" size={18} color="#ffffff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  celebrateBox: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  trophyCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: Spacing.xs,
  },
  subTitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  activityBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
  },
  doneBtn: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.xl,
    ...Shadows.card,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
