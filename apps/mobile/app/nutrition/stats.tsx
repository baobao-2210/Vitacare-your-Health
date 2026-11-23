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
import Svg, { Circle } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/constants/theme';
import { useNutritionToday } from '../../src/hooks/useNutrition';

const { width } = Dimensions.get('window');

const SEVEN_DAYS = [
  { day: 'T2', kcal: 2120, pct: 76 },
  { day: 'T3', kcal: 1940, pct: 68 },
  { day: 'T4', kcal: 2180, pct: 80 },
  { day: 'T5', kcal: 1820, pct: 64, isToday: true },
  { day: 'T6', kcal: 2040, pct: 72 },
  { day: 'T7', kcal: 2280, pct: 85 },
  { day: 'CN', kcal: 1480, pct: 52 },
];

export default function NutritionStatsScreen() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('week');
  const { data: todayData } = useNutritionToday();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Trở lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Thống Kê Dinh Dưỡng
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Timeframe Selector */}
        <View style={styles.timeframeContainer}>
          <TouchableOpacity
            style={[styles.timeframeBtn, timeframe === 'week' && styles.timeframeBtnActive]}
            onPress={() => setTimeframe('week')}
          >
            <Text style={[styles.timeframeBtnText, timeframe === 'week' && styles.timeframeBtnTextActive]}>
              Tuần này
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeframeBtn, timeframe === 'month' && styles.timeframeBtnActive]}
            onPress={() => setTimeframe('month')}
          >
            <Text style={[styles.timeframeBtnText, timeframe === 'month' && styles.timeframeBtnTextActive]}>
              Tháng này
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeframeBtn, timeframe === 'quarter' && styles.timeframeBtnActive]}
            onPress={() => setTimeframe('quarter')}
          >
            <Text style={[styles.timeframeBtnText, timeframe === 'quarter' && styles.timeframeBtnTextActive]}>
              3 Tháng
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date period sub-strip */}
        <View style={styles.periodRow}>
          <View style={styles.periodLeft}>
            <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
            <Text style={styles.periodText}>Tuần hiện tại: 7 ngày qua</Text>
          </View>
          <View style={styles.updateBadge}>
            <View style={styles.updateDot} />
            <Text style={styles.updateText}>Cập nhật theo dữ liệu thực tế</Text>
          </View>
        </View>

        {/* Weekly Summary Bento */}
        <View style={styles.bentoGrid}>
          {/* Card 1: Full-width Average */}
          <View style={styles.bentoFullCard}>
            <View style={styles.bentoFullLeft}>
              <Text style={styles.bentoLabel}>Calo trung bình / ngày</Text>
              <View style={styles.bentoValueRow}>
                <Text style={styles.bentoMainVal}>1.980</Text>
                <Text style={styles.bentoUnit}>kcal</Text>
              </View>
              <View style={styles.bentoTargetRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                <Text style={styles.bentoTargetText}>Đạt 90% mục tiêu (2.200 kcal)</Text>
              </View>
            </View>

            {/* Progress Mini Ring */}
            <View style={styles.miniRingWrapper}>
              <Svg width={64} height={64} viewBox="0 0 48 48">
                <Circle
                  cx="24"
                  cy="24"
                  r={20}
                  stroke="#e9edff"
                  strokeWidth={4.5}
                  fill="transparent"
                />
                <Circle
                  cx="24"
                  cy="24"
                  r={20}
                  stroke="#166534"
                  strokeWidth={4.5}
                  strokeDasharray="125.6"
                  strokeDashoffset="12.5"
                  strokeLinecap="round"
                  fill="transparent"
                  transform="rotate(-90 24 24)"
                />
              </Svg>
              <Text style={styles.miniRingPct}>90%</Text>
            </View>
          </View>

          {/* Card 2 & 3: Half-width Bento */}
          <View style={styles.bentoHalfRow}>
            <View style={styles.bentoHalfCard}>
              <View style={styles.bentoHalfHead}>
                <Text style={styles.bentoLabel}>Thâm hụt calo</Text>
                <Ionicons name="trending-down" size={18} color={Colors.secondary} />
              </View>
              <View style={styles.bentoHalfValRow}>
                <Text style={[styles.bentoHalfVal, { color: Colors.primary }]}>-220</Text>
                <Text style={styles.bentoHalfSub}>kcal/ngày</Text>
              </View>
              <Text style={styles.bentoDesc}>Duy trì cân nặng 68kg lý tưởng</Text>
            </View>

            <View style={styles.bentoHalfCard}>
              <View style={styles.bentoHalfHead}>
                <Text style={styles.bentoLabel}>Tuân thủ mục tiêu</Text>
                <Ionicons name="ribbon-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.bentoHalfValRow}>
                <Text style={styles.bentoHalfVal}>6/7</Text>
                <Text style={styles.bentoHalfSub}>ngày</Text>
              </View>
              <Text style={[styles.bentoDesc, { color: Colors.primary, fontWeight: '600' }]}>
                Trong vùng chuẩn
              </Text>
            </View>
          </View>
        </View>

        {/* 7-Day Calorie Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.sectionTitle}>Lượng Calo 7 ngày</Text>
              <Text style={styles.chartSubtitle}>So sánh mục tiêu 2.200 kcal</Text>
            </View>
            <View style={styles.todayLegend}>
              <View style={styles.todayLegendDot} />
              <Text style={styles.todayLegendText}>Hôm nay</Text>
            </View>
          </View>

          <View style={styles.chartBarsContainer}>
            {/* 2200 dashed line */}
            <View style={styles.chartDashedLine}>
              <View style={styles.dashedTrack} />
              <Text style={styles.dashedLabel}>2.200</Text>
            </View>

            <View style={styles.barsGrid}>
              {SEVEN_DAYS.map((d) => (
                <View key={d.day} style={styles.barCol}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${d.pct}%` },
                      d.isToday && styles.barFillToday,
                    ]}
                  />
                  <Text style={[styles.barDayLabel, d.isToday && styles.barDayLabelToday]}>
                    {d.day}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Macronutrient Balance Ratio */}
        <View style={styles.macroBalanceCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.sectionTitle}>Cân bằng Đa lượng (Macro)</Text>
              <Text style={styles.chartSubtitle}>Tỷ lệ hấp thụ năng lượng tuần</Text>
            </View>
            <Ionicons name="pie-chart-outline" size={20} color={Colors.primary} />
          </View>

          {/* Multi-segmented Progress Bar */}
          <View style={styles.multiSegBar}>
            <View style={[styles.segFill, { width: '52%', backgroundColor: '#00685f' }]} />
            <View style={[styles.segFill, { width: '26%', backgroundColor: '#006e2f' }]} />
            <View style={[styles.segFill, { width: '22%', backgroundColor: '#825100' }]} />
          </View>

          {/* Macro Breakdown Rows */}
          <View style={styles.macroRowsList}>
            <View style={styles.macroRowItem}>
              <View style={styles.macroRowLeft}>
                <View style={[styles.macroRowDot, { backgroundColor: '#00685f' }]} />
                <View>
                  <Text style={styles.macroRowTitle}>Tinh bột (Carbs)</Text>
                  <Text style={styles.macroRowSub}>Mục tiêu: 45 - 55%</Text>
                </View>
              </View>
              <View style={styles.macroRowRight}>
                <Text style={styles.macroRowPct}>52%</Text>
                <View style={styles.optBadge}>
                  <Text style={styles.optBadgeText}>Tối ưu</Text>
                </View>
              </View>
            </View>

            <View style={styles.macroRowItem}>
              <View style={styles.macroRowLeft}>
                <View style={[styles.macroRowDot, { backgroundColor: '#006e2f' }]} />
                <View>
                  <Text style={styles.macroRowTitle}>Chất đạm (Protein)</Text>
                  <Text style={styles.macroRowSub}>Mục tiêu: 20 - 30%</Text>
                </View>
              </View>
              <View style={styles.macroRowRight}>
                <Text style={[styles.macroRowPct, { color: '#006e2f' }]}>26%</Text>
                <View style={[styles.optBadge, { backgroundColor: '#6bff8f' }]}>
                  <Text style={[styles.optBadgeText, { color: '#007432' }]}>Rất tốt</Text>
                </View>
              </View>
            </View>

            <View style={styles.macroRowItem}>
              <View style={styles.macroRowLeft}>
                <View style={[styles.macroRowDot, { backgroundColor: '#825100' }]} />
                <View>
                  <Text style={styles.macroRowTitle}>Chất béo (Fat)</Text>
                  <Text style={styles.macroRowSub}>Mục tiêu: 20 - 25%</Text>
                </View>
              </View>
              <View style={styles.macroRowRight}>
                <Text style={styles.macroRowPct}>22%</Text>
                <View style={styles.optBadge}>
                  <Text style={styles.optBadgeText}>Lành mạnh</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Calorie Distribution by Meal */}
        <View style={styles.mealDistCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.sectionTitle}>Phân bổ Năng lượng Bữa ăn</Text>
              <Text style={styles.chartSubtitle}>Khung giờ nạp năng lượng trong ngày</Text>
            </View>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
          </View>

          <View style={styles.mealBlocksGrid}>
            <View style={styles.mealBlock}>
              <Ionicons name="sunny-outline" size={18} color={Colors.primary} />
              <Text style={styles.mealBlockLabel}>Sáng</Text>
              <Text style={styles.mealBlockPct}>28%</Text>
            </View>
            <View style={[styles.mealBlock, styles.activeMealBlock]}>
              <Ionicons name="restaurant" size={18} color="#ffffff" />
              <Text style={[styles.mealBlockLabel, { color: '#ffffff' }]}>Trưa</Text>
              <Text style={[styles.mealBlockPct, { color: '#ffffff' }]}>38%</Text>
            </View>
            <View style={styles.mealBlock}>
              <Ionicons name="moon-outline" size={18} color={Colors.primary} />
              <Text style={styles.mealBlockLabel}>Tối</Text>
              <Text style={styles.mealBlockPct}>24%</Text>
            </View>
            <View style={styles.mealBlock}>
              <Ionicons name="leaf-outline" size={18} color={Colors.primary} />
              <Text style={styles.mealBlockLabel}>Phụ</Text>
              <Text style={styles.mealBlockPct}>10%</Text>
            </View>
          </View>

          {/* Clinical Doctor Insight */}
          <View style={styles.doctorCard}>
            <View style={styles.doctorIconBox}>
              <Ionicons name="medical" size={18} color={Colors.primary} />
            </View>
            <View style={styles.doctorTextWrap}>
              <Text style={styles.doctorTag}>LỜI KHUYÊN BÁC SĨ VITACARE</Text>
              <Text style={styles.doctorDesc}>
                Tỷ lệ nạp calo tập trung vào ban ngày giúp hệ tiêu hóa nghỉ ngơi trước 20:00 và cải thiện chất lượng giấc ngủ sâu.
              </Text>
            </View>
          </View>
        </View>

        {/* Micronutrients Warning & Status */}
        <View style={styles.microCard}>
          <Text style={styles.sectionTitle}>Vi chất & Cảnh báo Dinh dưỡng</Text>
          {/* Sodium */}
          <View style={styles.warningBox}>
            <View style={styles.warningHead}>
              <View style={styles.warningLeft}>
                <Ionicons name="warning" size={18} color={Colors.error} />
                <Text style={styles.warningTitle}>Natri (Muối)</Text>
              </View>
              <View style={styles.warningTag}>
                <Text style={styles.warningTagText}>Gần ngưỡng</Text>
              </View>
            </View>
            <View style={styles.warningValRow}>
              <Text style={styles.warningSubText}>Mức nạp trung bình:</Text>
              <Text style={styles.warningValText}>2.100 / 2.300 mg/ngày</Text>
            </View>
            <View style={styles.warningBarTrack}>
              <View style={[styles.warningBarFill, { width: '91%', backgroundColor: Colors.error }]} />
            </View>
            <Text style={styles.warningTip}>
              💡 Lời khuyên: Chú ý giảm nước mắm chấm và nước dùng phở/bún để bảo vệ huyết áp.
            </Text>
          </View>

          {/* Fiber */}
          <View style={[styles.warningBox, { backgroundColor: '#f1f3ff' }]}>
            <View style={styles.warningHead}>
              <View style={styles.warningLeft}>
                <Ionicons name="leaf" size={18} color="#007432" />
                <Text style={styles.warningTitle}>Chất xơ</Text>
              </View>
              <View style={[styles.warningTag, { backgroundColor: '#6bff8f' }]}>
                <Text style={[styles.warningTagText, { color: '#007432' }]}>Khá tốt</Text>
              </View>
            </View>
            <View style={styles.warningValRow}>
              <Text style={styles.warningSubText}>Mức nạp trung bình:</Text>
              <Text style={[styles.warningValText, { color: Colors.primary }]}>24 / 28 g/ngày</Text>
            </View>
            <View style={styles.warningBarTrack}>
              <View style={[styles.warningBarFill, { width: '85%', backgroundColor: Colors.secondary }]} />
            </View>
            <Text style={styles.warningTip}>
              🌿 Gợi ý: Nên tăng thêm 1 phần rau luộc hoặc trái cây ít đường vào bữa trưa.
            </Text>
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
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f3ff',
    padding: 4,
    borderRadius: BorderRadius.full,
  },
  timeframeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  timeframeBtnActive: {
    backgroundColor: '#166534',
    ...Shadows.soft,
  },
  timeframeBtnText: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
  },
  timeframeBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  periodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  periodText: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  updateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  updateText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  bentoGrid: {
    gap: 10,
  },
  bentoFullCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.card,
  },
  bentoFullLeft: {
    gap: 4,
  },
  bentoLabel: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
  },
  bentoValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  bentoMainVal: {
    ...Typography.displayLarge,
    color: Colors.onSurface,
    fontWeight: '800',
  },
  bentoUnit: {
    ...Typography.labelLarge,
    color: Colors.onSurfaceVariant,
  },
  bentoTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bentoTargetText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  miniRingWrapper: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  miniRingPct: {
    position: 'absolute',
    ...Typography.labelMedium,
    color: Colors.primary,
    fontWeight: '800',
  },
  bentoHalfRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bentoHalfCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 6,
    ...Shadows.soft,
  },
  bentoHalfHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoHalfValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  bentoHalfVal: {
    ...Typography.headlineMedium,
    color: Colors.onSurface,
    fontWeight: '800',
  },
  bentoHalfSub: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  bentoDesc: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
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
  chartSubtitle: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  todayLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f3ff',
    paddingHorizontal: 10,
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
  chartBarsContainer: {
    position: 'relative',
    height: 180,
    justifyContent: 'flex-end',
    paddingTop: 20,
  },
  chartDashedLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashedTrack: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderStyle: 'dashed',
  },
  dashedLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    marginLeft: 6,
  },
  barsGrid: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingTop: 20,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 8,
  },
  barFill: {
    width: 24,
    backgroundColor: '#166534',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barFillToday: {
    backgroundColor: Colors.secondary,
  },
  barDayLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  barDayLabelToday: {
    color: Colors.secondary,
    fontWeight: '800',
  },
  macroBalanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
  },
  multiSegBar: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f1f3ff',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segFill: {
    height: '100%',
  },
  macroRowsList: {
    gap: 8,
  },
  macroRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f3ff',
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  macroRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  macroRowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  macroRowTitle: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  macroRowSub: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  macroRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroRowPct: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  optBadge: {
    backgroundColor: '#a6f4b5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  optBadgeText: {
    ...Typography.labelSmall,
    color: '#005226',
    fontWeight: '700',
  },
  mealDistCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
  },
  mealBlocksGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  mealBlock: {
    flex: 1,
    backgroundColor: '#f1f3ff',
    padding: 10,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: 4,
  },
  activeMealBlock: {
    backgroundColor: '#166534',
  },
  mealBlockLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  mealBlockPct: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '800',
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#e9edff',
    padding: 12,
    borderRadius: BorderRadius.lg,
  },
  doctorIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a6f4b5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  doctorTextWrap: {
    flex: 1,
    gap: 2,
  },
  doctorTag: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  doctorDesc: {
    ...Typography.bodySmall,
    color: Colors.onSurface,
    lineHeight: 18,
  },
  microCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
  },
  warningBox: {
    backgroundColor: '#ffdad630',
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 8,
  },
  warningHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warningLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warningTitle: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  warningTag: {
    backgroundColor: '#ffdad6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  warningTagText: {
    ...Typography.labelSmall,
    color: Colors.error,
    fontWeight: '700',
  },
  warningValRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warningSubText: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  warningValText: {
    ...Typography.labelMedium,
    color: Colors.error,
    fontWeight: '700',
  },
  warningBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e9edff',
    overflow: 'hidden',
  },
  warningBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  warningTip: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
  },
});

