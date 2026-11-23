import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/constants/theme';
import { useActivityHistory } from '../../src/hooks/useActivity';

const { width } = Dimensions.get('window');

export default function ActivityHistoryScreen() {
  const router = useRouter();
  const [segment, setSegment] = useState<'week' | 'month' | 'year'>('week');
  const { data: historyData, isLoading } = useActivityHistory();

  const totalSteps = historyData?.summary?.totalSteps || 0;
  const targetStepsWeek = 8000 * 7;
  const stepsPct = targetStepsWeek > 0 ? Math.min(100, Math.round((totalSteps / targetStepsWeek) * 100)) : 0;
  const avgStepsPerDay = Math.round(totalSteps / 7);

  const totalMinutes = historyData?.summary?.totalMinutes || 0;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const formattedDuration = `${hours}h ${mins}m`;

  const totalCalories = Math.round(historyData?.summary?.totalCaloriesBurned || 0);
  const totalDistanceKm = historyData?.history
    ? Math.round(historyData.history.reduce((sum, h) => sum + (h.distanceKm || 0), 0) * 10) / 10
    : 0;

  // Dữ liệu 7 ngày động từ API
  const historyList = historyData?.history || [];
  const todayStr = new Date().toISOString().slice(0, 10);

  const bars = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((dayLabel, index) => {
    const item = historyList[index];
    const steps = item?.totalSteps || 0;
    const isToday = item?.date === todayStr;
    const isFuture = item ? new Date(item.date) > new Date() : false;
    const exceeded = steps >= 8000;
    const pct = Math.min(100, Math.max(steps > 0 ? 15 : 6, Math.round((steps / 8000) * 100)));

    return {
      day: dayLabel,
      steps: steps > 0 ? (steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : `${steps}`) : '-',
      pct,
      exceeded,
      isToday,
      isFuture,
      rawSteps: steps,
    };
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Trở lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Lịch Sử Hoạt Động
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Time Segment Selector */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, segment === 'week' && styles.activeSegmentBtn]}
            onPress={() => setSegment('week')}
          >
            <Text style={[styles.segmentText, segment === 'week' && styles.activeSegmentText]}>
              Tuần này
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, segment === 'month' && styles.activeSegmentBtn]}
            onPress={() => setSegment('month')}
          >
            <Text style={[styles.segmentText, segment === 'month' && styles.activeSegmentText]}>
              Tháng này
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, segment === 'year' && styles.activeSegmentBtn]}
            onPress={() => setSegment('year')}
          >
            <Text style={[styles.segmentText, segment === 'year' && styles.activeSegmentText]}>
              Năm nay
            </Text>
          </TouchableOpacity>
        </View>

        {/* Week Range Navigator */}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn}>
            <Ionicons name="chevron-back" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.navCenter}>
            <View style={styles.navCenterTop}>
              <Ionicons name="calendar-outline" size={16} color={Colors.secondary} />
              <Text style={styles.navWeekTitle}>Tuần 43</Text>
            </View>
            <Text style={styles.navWeekSub}>21/10 – 27/10/2024</Text>
          </View>
          <TouchableOpacity style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Weekly KPI Overview Bento */}
        <View style={styles.bentoWrap}>
          {/* Total Steps Card */}
          <View style={styles.stepsBentoCard}>
            <View style={styles.stepsBentoTop}>
              <View style={styles.stepsBentoLeft}>
                <View style={styles.stepsBentoIconBox}>
                  <Ionicons name="footsteps" size={18} color={Colors.primary} />
                </View>
                <Text style={styles.bentoLabel}>Tổng bước chân</Text>
              </View>
              <View style={styles.trendingBadge}>
                <Ionicons name="trending-up" size={14} color="#005226" />
                <Text style={styles.trendingBadgeText}>{stepsPct}% mục tiêu</Text>
              </View>
            </View>
            <View style={styles.stepsBentoValRow}>
              <Text style={styles.bigVal}>{totalSteps.toLocaleString('vi-VN')}</Text>
              <Text style={styles.unitVal}>bước</Text>
            </View>
            <Text style={styles.subDetail}>TB {avgStepsPerDay.toLocaleString('vi-VN')} bước/ngày</Text>
            <View style={styles.trackBar}>
              <View style={[styles.fillBar, { width: `${stepsPct}%`, backgroundColor: Colors.secondary }]} />
            </View>
          </View>

          {/* Active Time & Calories */}
          <View style={styles.bento2Col}>
            <View style={styles.bentoMiniCard}>
              <View style={styles.miniIconBox}>
                <Ionicons name="time" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.bentoLabel}>Thời gian vận động</Text>
              <Text style={styles.midVal}>{formattedDuration}</Text>
              <Text style={styles.greenDiff}>Mục tiêu: 3h 30m</Text>
            </View>

            <View style={styles.bentoMiniCard}>
              <View style={styles.miniIconBox}>
                <Ionicons name="flame" size={18} color="#ea580c" />
              </View>
              <Text style={styles.bentoLabel}>Calo tiêu thụ</Text>
              <Text style={styles.midVal}>{totalCalories.toLocaleString('vi-VN')} kcal</Text>
              <Text style={styles.mutedSub}>Định mức: 2.500 kcal</Text>
            </View>
          </View>

          {/* Cumulative Distance Card */}
          <View style={styles.distBanner}>
            <View style={styles.distLeft}>
              <View style={styles.distIconBox}>
                <Ionicons name="map" size={20} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.distSub}>Quãng đường tích lũy tuần</Text>
                <Text style={styles.distMain}>{totalDistanceKm} km</Text>
              </View>
            </View>
            <View style={styles.distBadge}>
              <Text style={styles.distBadgeText}>~ {(totalDistanceKm / 7).toFixed(1)} km/ngày</Text>
            </View>
          </View>
        </View>

        {/* 7-Day Steps Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.sectionTitle}>Biểu đồ bước chân</Text>
              <Text style={styles.chartSub}>Định mức chuẩn: 8.000 bước/ngày</Text>
            </View>
            <View style={styles.todayLegend}>
              <View style={styles.todayLegendDot} />
              <Text style={styles.todayLegendText}>Hôm nay</Text>
            </View>
          </View>

          <View style={styles.chartArea}>
            {/* Target line */}
            <View style={styles.targetDashed}>
              <Text style={styles.targetLabel}>8.000</Text>
              <View style={styles.targetLine} />
            </View>

            {/* Bars */}
            <View style={styles.barsRow}>
              {bars.map((b) => (
                <View key={b.day} style={styles.barCol}>
                  {b.rawSteps > 0 && (
                    <Text style={[styles.todayBarTag, b.exceeded && styles.exceededTag]}>
                      {b.steps}
                    </Text>
                  )}
                  <View
                    style={[
                      styles.barBody,
                      { height: `${b.pct}%` },
                      b.exceeded && styles.exceededBar,
                      b.isToday && styles.todayBar,
                      b.isFuture && styles.futureBar,
                    ]}
                  />
                  <Text
                    style={[
                      styles.barDayText,
                      b.exceeded && { color: Colors.primary, fontWeight: '700' },
                      b.isToday && { color: Colors.secondary, fontWeight: '700' },
                    ]}
                  >
                    {b.day}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Workout Breakdown by Sport */}
        <View style={styles.breakdownCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Phân bổ môn thể thao</Text>
            <Text style={styles.chartSub}>Tổng 4 môn</Text>
          </View>

          {/* Segmented bar */}
          <View style={styles.sportsSegBar}>
            <View style={[styles.sportsSegFill, { width: '45%', backgroundColor: '#00685f' }]} />
            <View style={[styles.sportsSegFill, { width: '30%', backgroundColor: '#006e2f' }]} />
            <View style={[styles.sportsSegFill, { width: '15%', backgroundColor: '#825100' }]} />
            <View style={[styles.sportsSegFill, { width: '10%', backgroundColor: '#006591' }]} />
          </View>

          <View style={styles.sportsLegendGrid}>
            <View style={styles.legendBox}>
              <View style={[styles.legendDot, { backgroundColor: '#00685f' }]} />
              <View>
                <Text style={styles.legendTitle}>Chạy bộ (45%)</Text>
                <Text style={styles.legendSub}>2h 00m</Text>
              </View>
            </View>
            <View style={styles.legendBox}>
              <View style={[styles.legendDot, { backgroundColor: '#006e2f' }]} />
              <View>
                <Text style={styles.legendTitle}>Đi bộ (30%)</Text>
                <Text style={styles.legendSub}>1h 20m</Text>
              </View>
            </View>
            <View style={styles.legendBox}>
              <View style={[styles.legendDot, { backgroundColor: '#825100' }]} />
              <View>
                <Text style={styles.legendTitle}>Gym thể lực (15%)</Text>
                <Text style={styles.legendSub}>40m</Text>
              </View>
            </View>
            <View style={styles.legendBox}>
              <View style={[styles.legendDot, { backgroundColor: '#006591' }]} />
              <View>
                <Text style={styles.legendTitle}>Đạp xe (10%)</Text>
                <Text style={styles.legendSub}>25m</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Badges / Personal Records */}
        <View style={styles.recordsCard}>
          <View style={styles.chartHeader}>
            <View style={styles.recordsTitleRow}>
              <Text style={{ fontSize: 18 }}>🏆</Text>
              <Text style={styles.sectionTitle}>Kỷ lục tuần & Huy hiệu</Text>
            </View>
          </View>

          <View style={styles.recordsGrid}>
            <View style={styles.recordBox}>
              <View style={styles.recordIconCircle}>
                <Ionicons name="ribbon" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.recordName}>Nhiều bước nhất</Text>
              <Text style={styles.recordVal}>12.450</Text>
              <Text style={styles.recordDate}>15/10</Text>
            </View>

            <View style={styles.recordBox}>
              <View style={[styles.recordIconCircle, { backgroundColor: '#6bff8f30' }]}>
                <Ionicons name="flash" size={20} color="#007432" />
              </View>
              <Text style={styles.recordName}>Pace 5km tốt nhất</Text>
              <Text style={[styles.recordVal, { color: '#007432' }]}>6'15"/km</Text>
              <Text style={styles.recordDate}>Kỷ lục cá nhân</Text>
            </View>

            <View style={styles.recordBox}>
              <View style={[styles.recordIconCircle, { backgroundColor: '#ffdad6' }]}>
                <Ionicons name="flame" size={20} color={Colors.error} />
              </View>
              <Text style={styles.recordName}>Chuỗi liên tục</Text>
              <Text style={[styles.recordVal, { color: Colors.error }]}>5 Ngày</Text>
              <Text style={styles.recordDate}>Đang duy trì</Text>
            </View>
          </View>
        </View>

        {/* Recent Activities History Log */}
        <View style={styles.historyLogSection}>
          <Text style={styles.sectionTitle}>Lịch sử hoạt động</Text>

          {historyData?.recentSessions && historyData.recentSessions.length > 0 ? (
            historyData.recentSessions.map((session: any) => {
              const isRun = session.activityType === 'RUNNING';
              const distKm = session.distanceMeters ? (Number(session.distanceMeters) / 1000).toFixed(1) : (session.steps ? (session.steps * 0.00072).toFixed(1) : '0.0');
              const durMin = Math.round((session.durationSeconds || 0) / 60) || 1;
              const cal = Math.round(Number(session.caloriesKcal) || durMin * 7);
              const dateStr = new Date(session.startedAt).toLocaleDateString('vi-VN', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
              });
              const timeStr = new Date(session.startedAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View key={session.id} style={styles.historyItemCard}>
                  <View style={styles.historyItemLeft}>
                    <View style={[styles.historyIconBox, { backgroundColor: isRun ? '#ffe0b2' : '#dcfce7' }]}>
                      <Ionicons name={isRun ? 'walk' : 'footsteps'} size={20} color={isRun ? '#ea580c' : Colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.historyItemTitle}>
                        {isRun ? 'Chạy bộ ngoài trời' : 'Đi bộ thể thao'}
                      </Text>
                      <Text style={styles.historyItemSub}>
                        {distKm} km • {durMin} phút • {cal} kcal • {dateStr} {timeStr}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color="#007432" />
                </View>
              );
            })
          ) : (
            <View style={[styles.historyItemCard, { justifyContent: 'center', paddingVertical: 20 }]}>
              <Text style={{ ...Typography.bodySmall, color: Colors.onSurfaceVariant, textAlign: 'center' }}>
                Chưa có phiên tập luyện nào trong khoảng thời gian này.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.margin,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3ff',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    ...Typography.labelLarge,
    color: Colors.primary,
  },
  headerTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  headerRightSpacer: {
    width: 60,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.margin,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f3ff',
    padding: 4,
    borderRadius: BorderRadius.full,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  activeSegmentBtn: {
    backgroundColor: '#166534',
    ...Shadows.soft,
  },
  segmentText: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
  },
  activeSegmentText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  navCenter: {
    alignItems: 'center',
    gap: 2,
  },
  navCenterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navWeekTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  navWeekSub: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  bentoWrap: {
    gap: 10,
  },
  stepsBentoCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: 6,
    ...Shadows.card,
  },
  stepsBentoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepsBentoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepsBentoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a6f4b5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#a6f4b5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  trendingBadgeText: {
    ...Typography.labelSmall,
    color: '#005226',
    fontWeight: '700',
  },
  stepsBentoValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  bigVal: {
    ...Typography.displayLarge,
    color: Colors.onSurface,
    fontWeight: '800',
  },
  unitVal: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
  },
  subDetail: {
    ...Typography.labelSmall,
    color: Colors.secondary,
    fontWeight: '600',
  },
  trackBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f1f3ff',
    marginTop: 4,
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
    borderRadius: 4,
  },
  bento2Col: {
    flexDirection: 'row',
    gap: 10,
  },
  bentoMiniCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 6,
    ...Shadows.soft,
  },
  miniIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e1e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  midVal: {
    ...Typography.headlineMedium,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  greenDiff: {
    ...Typography.labelSmall,
    color: Colors.secondary,
    fontSize: 10,
    fontWeight: '600',
  },
  mutedSub: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  distBanner: {
    backgroundColor: '#166534',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.card,
  },
  distLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  distIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distSub: {
    ...Typography.labelSmall,
    color: '#93e0a2',
  },
  distMain: {
    ...Typography.headlineMedium,
    color: '#ffffff',
    fontWeight: '800',
  },
  distBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  distBadgeText: {
    ...Typography.labelSmall,
    color: '#ffffff',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  chartSub: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  todayLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  todayLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  todayLegendText: {
    ...Typography.labelSmall,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  chartArea: {
    height: 180,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  targetDashed: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  targetLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderStyle: 'dashed',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingTop: 30,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  exceededTag: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 10,
  },
  todayBarTag: {
    ...Typography.labelSmall,
    color: Colors.secondary,
    fontWeight: '700',
    fontSize: 10,
  },
  barBody: {
    width: 22,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  exceededBar: {
    backgroundColor: '#166534',
  },
  todayBar: {
    backgroundColor: Colors.secondary,
  },
  futureBar: {
    backgroundColor: '#f1f3ff',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderStyle: 'dashed',
  },
  barDayText: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  breakdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
  },
  sportsSegBar: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sportsSegFill: {
    height: '100%',
  },
  sportsLegendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendBox: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f1f3ff',
    padding: 8,
    borderRadius: BorderRadius.lg,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendTitle: {
    ...Typography.labelSmall,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  legendSub: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  recordsCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
  },
  recordsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  recordBox: {
    flex: 1,
    backgroundColor: '#f1f3ff',
    borderRadius: BorderRadius.xl,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  recordIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#a6f4b5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordName: {
    ...Typography.labelSmall,
    color: Colors.onSurface,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
  },
  recordVal: {
    ...Typography.headlineSmall,
    color: Colors.primary,
    fontWeight: '700',
  },
  recordDate: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  historyLogSection: {
    gap: 10,
  },
  historyGroupTitle: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
    marginTop: 6,
  },
  historyItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#a6f4b5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyItemTitle: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  historyItemSub: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
});

