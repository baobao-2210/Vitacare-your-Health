import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Shadows } from '../../src/constants/theme';
import { useSleepHistory, useSleepLatest } from '../../src/hooks/useSleep';

const BARS = [
  { day: 'T2', height: 88, met: true, light: 45, rem: 25, deep: 30 },
  { day: 'T3', height: 95, met: true, light: 40, rem: 28, deep: 32 },
  { day: 'T4', height: 92, met: true, light: 42, rem: 26, deep: 32 },
  { day: 'T5', height: 96, met: true, light: 38, rem: 30, deep: 32 },
  { day: 'T6', height: 98, met: true, light: 40, rem: 30, deep: 30 },
  { day: 'T7', height: 94, met: true, light: 42, rem: 28, deep: 30 },
  { day: 'CN', height: 76, met: false, light: 46, rem: 24, deep: 30 },
];

export default function SleepStatsScreen() {
  const router = useRouter();
  const { data: latestData } = useSleepLatest();
  const { data: historyData } = useSleepHistory();

  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'halfYear'>('week');

  const targetHours = latestData?.targetHours ?? 8;
  const avgHours = historyData?.averageHours ?? 7.6;
  const avgH = Math.floor(avgHours);
  const avgM = Math.round((avgHours - avgH) * 60);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backText}>Trở lại</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Thống Kê Giấc Ngủ</Text>

        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>95% Đạt</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Segmented Control */}
        <View style={styles.segmentWrap}>
          <TouchableOpacity
            style={[styles.segmentBtn, timeframe === 'week' && styles.segmentBtnActive]}
            onPress={() => setTimeframe('week')}
          >
            <Text style={[styles.segmentText, timeframe === 'week' && styles.segmentTextActive]}>
              Tuần này
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, timeframe === 'month' && styles.segmentBtnActive]}
            onPress={() => setTimeframe('month')}
          >
            <Text style={[styles.segmentText, timeframe === 'month' && styles.segmentTextActive]}>
              Tháng này
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, timeframe === 'halfYear' && styles.segmentBtnActive]}
            onPress={() => setTimeframe('halfYear')}
          >
            <Text style={[styles.segmentText, timeframe === 'halfYear' && styles.segmentTextActive]}>
              6 Tháng
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Navigator */}
        <View style={[styles.dateNavCard, Shadows.card]}>
          <TouchableOpacity style={styles.navArrow}>
            <Ionicons name="chevron-back" size={20} color={Colors.onSurface} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <View style={styles.navRow}>
              <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
              <Text style={styles.navWeek}>Tuần 47</Text>
            </View>
            <Text style={styles.navDates}>17/11 – 23/11/2026</Text>
          </View>
          <TouchableOpacity style={[styles.navArrow, { opacity: 0.3 }]}>
            <Ionicons name="chevron-forward" size={20} color={Colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Streak Celebration */}
        <View style={[styles.streakCard, Shadows.card]}>
          <View style={styles.streakLeft}>
            <View style={styles.fireIconWrap}>
              <MaterialCommunityIcons name="fire" size={26} color="#ffffff" />
            </View>
            <View>
              <View style={styles.streakTagRow}>
                <Text style={styles.streakTag}>CHUỖI PHONG ĐỘ CAO</Text>
                <View style={styles.streakDot} />
              </View>
              <Text style={styles.streakTitle}>6 ngày liên tiếp &gt; 7.5h</Text>
              <Text style={styles.streakSub}>Thói quen vàng giúp cơ thể hồi phục tối đa</Text>
            </View>
          </View>
          <Ionicons name="checkmark-circle" size={24} color={Colors.secondary} />
        </View>

        {/* Weekly Averages Summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chỉ số trung bình tuần</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>Đạt chuẩn 95%</Text>
          </View>
        </View>

        <View style={styles.averagesGrid}>
          {/* Duration Card */}
          <View style={[styles.avgCard, Shadows.card]}>
            <View style={styles.avgTopRow}>
              <Text style={styles.avgLabel}>Thời lượng trung bình</Text>
              <View style={styles.avgIcon}>
                <Ionicons name="bed-outline" size={16} color={Colors.primary} />
              </View>
            </View>
            <Text style={styles.avgNumber}>
              {avgH}h {avgM}m
            </Text>
            <Text style={styles.avgSubSuccess}>✓ Đạt 95% mục tiêu ({targetHours}h)</Text>
            <View style={styles.miniProgressTrack}>
              <View style={[styles.miniProgressFill, { width: '95%' }]} />
            </View>
          </View>

          {/* Sleep Score Card */}
          <View style={[styles.avgCard, Shadows.card]}>
            <View style={styles.avgTopRow}>
              <Text style={styles.avgLabel}>Điểm giấc ngủ TB</Text>
              <View style={[styles.avgIcon, { backgroundColor: Colors.primaryContainer }]}>
                <Ionicons name="flash-outline" size={16} color={Colors.onPrimary} />
              </View>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.avgNumber}>85</Text>
              <Text style={styles.scoreMax}>/ 100</Text>
            </View>
            <Text style={styles.avgSubSuccess}>↗ Tăng +3đ so với tuần trước</Text>
            <Text style={styles.avgSubFooter}>Chất lượng: Rất ổn định</Text>
          </View>

          {/* Bedtime & Wakeup times */}
          <View style={[styles.timeRowCard, Shadows.card]}>
            <View style={styles.timeBox}>
              <View style={styles.timeBoxIcon}>
                <Ionicons name="moon-outline" size={18} color={Colors.onSurface} />
              </View>
              <View>
                <Text style={styles.timeBoxLabel}>Giờ đi ngủ TB</Text>
                <Text style={styles.timeBoxVal}>23:25</Text>
              </View>
            </View>

            <View style={[styles.timeBox, styles.timeBoxBorder]}>
              <View style={styles.timeBoxIcon}>
                <Ionicons name="sunny-outline" size={18} color={Colors.secondary} />
              </View>
              <View>
                <Text style={styles.timeBoxLabel}>Giờ thức giấc TB</Text>
                <Text style={styles.timeBoxVal}>07:05</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stacked Bar Chart */}
        <View style={[styles.chartCard, Shadows.card]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Phân tầng giai đoạn ngủ</Text>
              <Text style={styles.chartSub}>7 ngày vừa qua (T2 – CN)</Text>
            </View>
            <Text style={styles.chartTarget}>6/7 ngày đạt</Text>
          </View>

          {/* Chart Graphic */}
          <View style={styles.chartGraphicArea}>
            {/* Target 8h Line */}
            <View style={styles.targetDashedLineWrap}>
              <View style={styles.dashedLine} />
              <View style={styles.targetPill}>
                <Text style={styles.targetPillText}>8.0h</Text>
              </View>
            </View>

            {/* Bars */}
            <View style={styles.barsFlex}>
              {BARS.map((bar, i) => (
                <View key={i} style={styles.barColumn}>
                  {bar.met && (
                    <Ionicons name="checkmark" size={12} color={Colors.secondary} style={{ marginBottom: 2 }} />
                  )}
                  <View style={[styles.stackedBarWrap, { height: `${bar.height}%` }]}>
                    <View style={[styles.stageSlice, { flex: bar.light, backgroundColor: '#89f5e7' }]} />
                    <View style={[styles.stageSlice, { flex: bar.rem, backgroundColor: Colors.tertiaryContainer }]} />
                    <View style={[styles.stageSlice, { flex: bar.deep, backgroundColor: Colors.primary }]} />
                  </View>
                  <Text style={[styles.barDayLabel, bar.day === 'CN' && { fontWeight: '700' }]}>
                    {bar.day}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Chart Legend */}
          <View style={styles.chartLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendLabel}>Ngủ sâu (Deep)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.tertiaryContainer }]} />
              <Text style={styles.legendLabel}>REM</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#89f5e7' }]} />
              <Text style={styles.legendLabel}>Ngủ nông (Light)</Text>
            </View>
          </View>
        </View>

        {/* Biological Rhythm Consistency */}
        <View style={[styles.rhythmCard, Shadows.card]}>
          <View style={styles.rhythmHeader}>
            <View>
              <Text style={styles.rhythmTitle}>Độ ổn định giờ ngủ</Text>
              <Text style={styles.rhythmSub}>Lệch &lt;28 phút giữa ngày làm việc & cuối tuần</Text>
            </View>
            <View style={styles.rhythmBadge}>
              <Text style={styles.rhythmBadgeText}>Đều đặn</Text>
            </View>
          </View>

          <View style={styles.ganttContainer}>
            <View style={styles.ganttHourMarks}>
              <Text style={styles.ganttMark}>23:00</Text>
              <Text style={styles.ganttMark}>01:00</Text>
              <Text style={styles.ganttMark}>03:00</Text>
              <Text style={styles.ganttMark}>05:00</Text>
              <Text style={styles.ganttMark}>07:00</Text>
            </View>

            <View style={styles.ganttRow}>
              <View style={styles.ganttRowHeader}>
                <Text style={styles.ganttRowLabel}>Ngày làm việc (T2 – T6)</Text>
                <Text style={styles.ganttRowTime}>23:18 – 07:00</Text>
              </View>
              <View style={styles.ganttBarTrack}>
                <View style={[styles.ganttBarFill, { left: '12%', right: '10%', backgroundColor: Colors.primaryContainer }]} />
              </View>
            </View>

            <View style={styles.ganttRow}>
              <View style={styles.ganttRowHeader}>
                <Text style={styles.ganttRowLabel}>Cuối tuần (T7 – CN)</Text>
                <Text style={styles.ganttRowTime}>23:45 – 07:25</Text>
              </View>
              <View style={styles.ganttBarTrack}>
                <View style={[styles.ganttBarFill, { left: '18%', right: '6%', backgroundColor: Colors.secondary }]} />
              </View>
            </View>
          </View>
        </View>

        {/* AI Correlations */}
        <View style={[styles.correlationsCard, Shadows.card]}>
          <View style={styles.corrHeader}>
            <View style={styles.corrHeaderLeft}>
              <Ionicons name="sparkles" size={18} color={Colors.primary} />
              <Text style={styles.corrTitle}>Phân tích tương quan sức khỏe</Text>
            </View>
            <Text style={styles.corrAiTag}>AI VitaCare</Text>
          </View>

          {/* Water & Sleep Correlation */}
          <View style={styles.corrHighlightBox}>
            <View style={styles.corrSubTitleRow}>
              <View style={styles.waterDropMini}>
                <Ionicons name="water" size={14} color="#ffffff" />
              </View>
              <Text style={styles.corrSubTitle}>Uống đủ nước & Giấc ngủ sâu</Text>
            </View>
            <Text style={styles.corrBody}>
              Những ngày bạn đạt 100% mục tiêu uống nước (<Text style={{ fontWeight: '700' }}>2.500ml</Text>), thời gian ngủ sâu (Deep Sleep) tăng thêm trung bình <Text style={{ color: Colors.secondary, fontWeight: '700' }}>+28 phút</Text>!
            </Text>

            <View style={styles.corrCompareGrid}>
              <View style={styles.compareItem}>
                <Text style={styles.compareLabel}>Ngày đủ nước</Text>
                <Text style={styles.compareValPrimary}>1h 48m</Text>
                <Text style={styles.compareSub}>Ngủ sâu lý tưởng</Text>
              </View>
              <View style={styles.compareItem}>
                <Text style={styles.compareLabel}>Ngày thiếu nước</Text>
                <Text style={styles.compareValMuted}>1h 20m</Text>
                <Text style={styles.compareSub}>Ít phục hồi hơn</Text>
              </View>
            </View>
          </View>

          {/* Caffeine Correlation */}
          <View style={styles.caffeineBox}>
            <View style={styles.caffeineLeft}>
              <Ionicons name="cafe-outline" size={18} color={Colors.onSurface} />
              <View>
                <Text style={styles.caffeineTitle}>Ngừng caffeine trước 15:00</Text>
                <Text style={styles.caffeineSub}>Giúp rút ngắn thời gian vào giấc 14 phút</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.outline} />
          </View>
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.margin,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surfaceContainer,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    ...Typography.labelMedium,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  badgeWrap: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 24,
    marginHorizontal: Spacing.margin,
    marginTop: 14,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  segmentBtnActive: {
    backgroundColor: Colors.card,
    ...Shadows.card,
  },
  segmentText: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
  },
  segmentTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  dateNavCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navWeek: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  navDates: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  streakCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  fireIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakTag: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.secondary,
    letterSpacing: 0.5,
  },
  streakDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.secondary,
  },
  streakTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 15,
  },
  streakSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.margin,
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  statusPill: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: '600',
  },
  averagesGrid: {
    paddingHorizontal: Spacing.margin,
    gap: 10,
  },
  avgCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
  },
  avgTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avgLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  avgIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avgNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.onSurface,
    marginTop: 4,
  },
  avgSubSuccess: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  miniProgressTrack: {
    height: 6,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: 3,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  scoreMax: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  avgSubFooter: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  timeRowCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
  },
  timeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeBoxBorder: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: Colors.surfaceContainer,
    paddingLeft: 12,
  },
  timeBoxIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBoxLabel: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  timeBoxVal: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 16,
  },
  chartCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 18,
    marginTop: 18,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  chartTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  chartSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  chartTarget: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: '600',
  },
  chartGraphicArea: {
    height: 180,
    justifyContent: 'flex-end',
    position: 'relative',
    marginTop: 10,
  },
  targetDashedLineWrap: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 0.8,
    borderColor: 'rgba(0,0,0,0.15)',
    borderStyle: 'dashed',
  },
  targetPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  targetPillText: {
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  barsFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    zIndex: 2,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  stackedBarWrap: {
    width: 22,
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'column-reverse',
  },
  stageSlice: {
    width: '100%',
  },
  barDayLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    marginTop: 6,
  },
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.surfaceContainer,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  rhythmCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 18,
    marginTop: 18,
  },
  rhythmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rhythmTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  rhythmSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  rhythmBadge: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rhythmBadgeText: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: '600',
  },
  ganttContainer: {
    marginTop: 14,
    gap: 12,
  },
  ganttHourMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  ganttMark: {
    fontSize: 9,
    color: Colors.outline,
  },
  ganttRow: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 10,
  },
  ganttRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ganttRowLabel: {
    fontSize: 11,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  ganttRowTime: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  ganttBarTrack: {
    height: 10,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 5,
    position: 'relative',
  },
  ganttBarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 5,
  },
  correlationsCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 18,
    marginTop: 18,
  },
  corrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  corrHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  corrTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  corrAiTag: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
  },
  corrHighlightBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 12,
  },
  corrSubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  waterDropMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corrSubTitle: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  corrBody: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  corrCompareGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  compareItem: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 8,
  },
  compareLabel: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  compareValPrimary: {
    ...Typography.labelLarge,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  compareValMuted: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
    marginTop: 2,
  },
  compareSub: {
    fontSize: 9,
    color: Colors.secondary,
    marginTop: 2,
  },
  caffeineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  caffeineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  caffeineTitle: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  caffeineSub: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
});

