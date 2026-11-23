import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Shadows } from '../../src/constants/theme';
import { useWaterToday, useWaterHistory } from '../../src/hooks/useWater';

export default function WaterHistoryScreen() {
  const router = useRouter();
  const { data: todayData } = useWaterToday();
  const { data: historyData } = useWaterHistory();

  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [targetMl, setTargetMl] = useState(2500);

  const goalMl = todayData?.goalMl ?? targetMl;
  const todayMl = todayData?.totalMl ?? 0;

  const BARS = [
    { day: 'T2', ml: 2600, percent: 104, val: '2.6L', height: 81, isMet: true },
    { day: 'T3', ml: 2500, percent: 100, val: '2.5L', height: 78, isMet: true },
    { day: 'T4', ml: 2200, percent: 88, val: '2.2L', height: 68, isMet: false },
    { day: 'Nay', ml: todayMl, percent: Math.round((todayMl / goalMl) * 100), val: `${(todayMl / 1000).toFixed(1)}L`, height: Math.min(100, Math.max(12, Math.round((todayMl / 3200) * 100))), isToday: true, isMet: todayMl >= goalMl },
    { day: 'T6', ml: 0, percent: 0, val: '-', height: 8, isFuture: true },
    { day: 'T7', ml: 0, percent: 0, val: '-', height: 8, isFuture: true },
    { day: 'CN', ml: 0, percent: 0, val: '-', height: 8, isFuture: true },
  ];

  const handleSaveGoal = () => {
    setModalVisible(false);
    Alert.alert('Thành công', `Đã cập nhật mục tiêu mới: ${targetMl} ml/ngày`);
  };

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

        <Text style={styles.headerTitle}>Thống Kê Nước Uống</Text>

        <View style={styles.statusBadge}>
          <Ionicons name="water" size={14} color={Colors.primary} />
          <Text style={styles.statusBadgeText}>Ổn định</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Segmented Control */}
        <View style={styles.segmentWrap}>
          {(['week', 'month', 'year'] as const).map((tab) => {
            const isSelected = timeframe === tab;
            const labels = { week: 'Tuần này', month: 'Tháng này', year: 'Năm nay' };
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.segmentBtn, isSelected && styles.segmentBtnActive]}
                onPress={() => setTimeframe(tab)}
              >
                <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date Navigator */}
        <View style={styles.dateNavRow}>
          <TouchableOpacity style={styles.navArrow}>
            <Ionicons name="chevron-back" size={20} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          <View style={styles.dateRangeTextWrap}>
            <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
            <Text style={styles.dateRangeText}>
              <Text style={{ fontWeight: '700' }}>Tuần 47</Text> (17/11 – 23/11/2026)
            </Text>
          </View>
          <TouchableOpacity style={[styles.navArrow, { opacity: 0.3 }]}>
            <Ionicons name="chevron-forward" size={20} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Bento Summary Cards */}
        <View style={styles.bentoContainer}>
          {/* Main Average Card */}
          <View style={[styles.avgCard, Shadows.card]}>
            <View style={styles.avgCardTop}>
              <View>
                <Text style={styles.cardSubTitle}>Trung bình mỗi ngày</Text>
                <View style={styles.avgValueRow}>
                  <Text style={styles.avgValue}>2.320</Text>
                  <Text style={styles.avgUnit}>ml / ngày</Text>
                </View>
              </View>
              <View style={styles.goalPercentBadge}>
                <Ionicons name="trending-up" size={14} color={Colors.primary} />
                <Text style={styles.goalPercentText}>93% mục tiêu</Text>
              </View>
            </View>

            <View style={styles.progressWrap}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Tiến độ hoàn thành</Text>
                <Text style={styles.progressValue}>2.320 / {goalMl} ml</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '92.8%' }]} />
              </View>
            </View>
          </View>

          {/* 2 Mini Cards */}
          <View style={styles.miniCardsRow}>
            <View style={[styles.miniCard, Shadows.card]}>
              <View style={styles.miniIconWrap}>
                <Ionicons name="water-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.miniLabel}>Tổng đã nạp</Text>
              <View style={styles.miniValRow}>
                <Text style={styles.miniVal}>16,2</Text>
                <Text style={styles.miniUnit}>Lít</Text>
              </View>
              <Text style={styles.miniTrend}>+1,4L so tuần trước</Text>
            </View>

            <View style={[styles.miniCard, Shadows.card]}>
              <View style={[styles.miniIconWrap, { backgroundColor: '#fee2e2' }]}>
                <MaterialCommunityIcons name="fire" size={18} color="#ef4444" />
              </View>
              <Text style={styles.miniLabel}>Chuỗi kỷ lục</Text>
              <View style={styles.miniValRow}>
                <Text style={styles.miniVal}>5</Text>
                <Text style={styles.miniUnit}>Ngày liền</Text>
              </View>
              <Text style={styles.miniTrend}>🔥 Giữ phong độ nhé!</Text>
            </View>
          </View>
        </View>

        {/* Daily Bar Chart */}
        <View style={[styles.chartCard, Shadows.card]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Lượng Nước Từng Ngày</Text>
              <Text style={styles.chartSub}>Mục tiêu chuẩn: {goalMl} ml/ngày</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.legendText}>≥100%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#8bd79b' }]} />
                <Text style={styles.legendText}>&lt;100%</Text>
              </View>
            </View>
          </View>

          {/* Bar Chart Area */}
          <View style={styles.chartArea}>
            {/* Target line */}
            <View style={styles.targetLineWrap}>
              <View style={styles.targetDashedLine} />
              <View style={styles.targetBadge}>
                <Text style={styles.targetBadgeText}>{goalMl} ml</Text>
              </View>
            </View>

            {/* Bars */}
            <View style={styles.barsRow}>
              {BARS.map((bar, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.barItem}
                  onPress={() =>
                    setActiveTooltip(
                      `${bar.day}: ${bar.ml > 0 ? `${bar.ml}ml (${bar.percent}%)` : 'Chưa ghi nhận'}`
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text style={[styles.barMlText, bar.isToday && styles.barMlTextToday]}>
                    {bar.val}
                  </Text>
                  <View style={styles.barOuterTrack}>
                    <View
                      style={[
                        styles.barInnerFill,
                        { height: `${bar.height}%` },
                        bar.isFuture
                          ? styles.barFillFuture
                          : bar.isToday
                          ? styles.barFillToday
                          : bar.isMet
                          ? styles.barFillMet
                          : styles.barFillUnder,
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, bar.isToday && styles.barLabelToday]}>
                    {bar.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Feedback Tooltip Banner */}
          <View style={styles.feedbackBanner}>
            <Text style={styles.feedbackBannerText}>
              {activeTooltip || 'Chạm vào từng cột để xem chi tiết lượng ml từng ngày'}
            </Text>
          </View>
        </View>

        {/* Intake Time Distribution */}
        <View style={[styles.distCard, Shadows.card]}>
          <View style={styles.distHeader}>
            <View>
              <Text style={styles.distTitle}>Phân Bổ Khung Giờ</Text>
              <Text style={styles.distSub}>Tỷ lệ nạp chất lỏng theo nhịp sinh học</Text>
            </View>
            <View style={styles.distIconWrap}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
            </View>
          </View>

          {/* Segmented bar */}
          <View style={styles.multiBar}>
            <View style={[styles.multiSegment, { width: '35%', backgroundColor: Colors.primary }]} />
            <View style={[styles.multiSegment, { width: '25%', backgroundColor: Colors.secondary }]} />
            <View style={[styles.multiSegment, { width: '30%', backgroundColor: '#4ae176' }]} />
            <View style={[styles.multiSegment, { width: '10%', backgroundColor: Colors.surfaceDim }]} />
          </View>
          <View style={styles.multiBarLabels}>
            <Text style={styles.multiBarLabel}>06:00</Text>
            <Text style={styles.multiBarLabel}>12:00</Text>
            <Text style={styles.multiBarLabel}>17:00</Text>
            <Text style={styles.multiBarLabel}>22:00</Text>
          </View>

          {/* Legend Grid */}
          <View style={styles.distGrid}>
            <View style={styles.distGridItem}>
              <View style={styles.distDotTitleRow}>
                <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.distGridLabel}>Buổi Sáng</Text>
              </View>
              <Text style={styles.distGridVal}>35%</Text>
            </View>

            <View style={styles.distGridItem}>
              <View style={styles.distDotTitleRow}>
                <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
                <Text style={styles.distGridLabel}>Buổi Trưa</Text>
              </View>
              <Text style={styles.distGridVal}>25%</Text>
            </View>

            <View style={styles.distGridItem}>
              <View style={styles.distDotTitleRow}>
                <View style={[styles.legendDot, { backgroundColor: '#4ae176' }]} />
                <Text style={styles.distGridLabel}>Buổi Chiều</Text>
              </View>
              <Text style={styles.distGridVal}>30%</Text>
            </View>

            <View style={styles.distGridItem}>
              <View style={styles.distDotTitleRow}>
                <View style={[styles.legendDot, { backgroundColor: Colors.surfaceDim }]} />
                <Text style={styles.distGridLabel}>Sau 20h Tối</Text>
              </View>
              <Text style={[styles.distGridVal, { color: Colors.secondary }]}>10% (Tốt)</Text>
            </View>
          </View>

          {/* Doctor Insight */}
          <View style={styles.doctorCard}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.doctorTitle}>Nhận định chuyên gia VitaCare</Text>
              <Text style={styles.doctorBody}>
                Khung giờ uống phân bổ rất khoa học, giảm dần về đêm giúp bảo vệ thận và duy trì giấc ngủ sâu, tránh tiểu đêm.
              </Text>
            </View>
          </View>
        </View>

        {/* Goal Adjustment Card */}
        <View style={[styles.goalCard, Shadows.card]}>
          <View style={styles.goalCardTop}>
            <View>
              <Text style={styles.goalSub}>CÁ NHÂN HÓA THỂ TRẠNG</Text>
              <Text style={styles.goalTitle}>Mục Tiêu Nước Hàng Ngày</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.goalMetric}>{goalMl.toLocaleString('vi-VN')}</Text>
              <Text style={styles.goalMetricUnit}>ml / ngày</Text>
            </View>
          </View>

          <View style={styles.goalInfoBox}>
            <View style={styles.goalInfoRow}>
              <Text style={styles.goalInfoLabel}>🏋️ Cân nặng hiện tại:</Text>
              <Text style={styles.goalInfoVal}>65 kg</Text>
            </View>
            <View style={styles.goalInfoRow}>
              <Text style={styles.goalInfoLabel}>🏃 Cường độ vận động:</Text>
              <Text style={styles.goalInfoVal}>Trung bình ~45 phút / ngày</Text>
            </View>
            <View style={styles.goalInfoRow}>
              <Text style={styles.goalInfoLabel}>🌤️ Thời tiết địa phương:</Text>
              <Text style={styles.goalInfoVal}>Nhiệt đới ấm (31°C)</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.adjustGoalBtn}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="options-outline" size={20} color={Colors.primary} />
            <Text style={styles.adjustGoalText}>Điều chỉnh mục tiêu hoặc giờ nhắc</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Adjust Goal Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Điều Chỉnh Mục Tiêu Nước</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Mục tiêu nước mỗi ngày (ml)</Text>
            <View style={styles.modalStepperRow}>
              <TouchableOpacity
                style={styles.modalStepBtn}
                onPress={() => setTargetMl((p) => Math.max(1000, p - 100))}
              >
                <Ionicons name="remove" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <View style={styles.modalValWrap}>
                <Text style={styles.modalValText}>{targetMl}</Text>
                <Text style={styles.modalValUnit}>ml</Text>
              </View>
              <TouchableOpacity
                style={styles.modalStepBtn}
                onPress={() => setTargetMl((p) => Math.min(4500, p + 100))}
              >
                <Ionicons name="add" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { marginTop: 16 }]}>Tần suất nhắc nhở tự động</Text>
            <View style={styles.reminderRow}>
              <TouchableOpacity style={styles.reminderPill}>
                <Text style={styles.reminderPillText}>Mỗi 1 giờ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.reminderPill, styles.reminderPillActive]}>
                <Text style={[styles.reminderPillText, styles.reminderPillTextActive]}>Mỗi 1.5 giờ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reminderPill}>
                <Text style={styles.reminderPillText}>Mỗi 2 giờ</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveGoal}>
              <Text style={styles.modalSaveBtnText}>Lưu thay đổi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '600',
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
  dateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.margin,
    marginTop: 14,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRangeTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateRangeText: {
    ...Typography.bodyMedium,
    color: Colors.onSurface,
  },
  bentoContainer: {
    paddingHorizontal: Spacing.margin,
    marginTop: 16,
    gap: 10,
  },
  avgCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
  },
  avgCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardSubTitle: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
  },
  avgValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  avgValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  avgUnit: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  goalPercentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  goalPercentText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '700',
  },
  progressWrap: {
    marginTop: 14,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  progressValue: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  miniCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  miniCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 14,
  },
  miniIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  miniLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  miniValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 2,
  },
  miniVal: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  miniUnit: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  miniTrend: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 18,
    marginTop: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  chartTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  chartSub: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  chartArea: {
    height: 180,
    justifyContent: 'flex-end',
    position: 'relative',
    marginTop: 10,
  },
  targetLineWrap: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  targetDashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 0.8,
    borderColor: 'rgba(0, 104, 95, 0.3)',
    borderStyle: 'dashed',
  },
  targetBadge: {
    backgroundColor: Colors.card,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  targetBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    zIndex: 2,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barMlText: {
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  barMlTextToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  barOuterTrack: {
    width: 22,
    height: 120,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barInnerFill: {
    width: '100%',
    borderRadius: 6,
  },
  barFillMet: {
    backgroundColor: Colors.primary,
  },
  barFillUnder: {
    backgroundColor: '#8bd79b',
  },
  barFillToday: {
    backgroundColor: Colors.secondary,
  },
  barFillFuture: {
    backgroundColor: Colors.surfaceContainer,
  },
  barLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    marginTop: 6,
  },
  barLabelToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  feedbackBanner: {
    marginTop: 12,
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  feedbackBannerText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  distCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 18,
    marginTop: 16,
  },
  distHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  distSub: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  distIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 16,
  },
  multiSegment: {
    height: '100%',
  },
  multiBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  multiBarLabel: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  distGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  distGridItem: {
    width: '48%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distDotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distGridLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurface,
  },
  distGridVal: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  doctorCard: {
    backgroundColor: '#d8f3dc',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  doctorTitle: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '700',
  },
  doctorBody: {
    ...Typography.bodySmall,
    color: '#1b4332',
    lineHeight: 16,
    marginTop: 2,
  },
  goalCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 18,
    marginTop: 16,
  },
  goalCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  goalSub: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  goalTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
    marginTop: 2,
  },
  goalMetric: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
  },
  goalMetricUnit: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  goalInfoBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginTop: 14,
  },
  goalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalInfoLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  goalInfoVal: {
    ...Typography.labelSmall,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  adjustGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainerLow,
    marginTop: 14,
  },
  adjustGoalText: {
    ...Typography.labelMedium,
    color: Colors.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceContainer,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  modalLabel: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
    marginBottom: 8,
  },
  modalStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 8,
  },
  modalStepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  modalValWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  modalValText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
  },
  modalValUnit: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  reminderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reminderPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
  },
  reminderPillActive: {
    backgroundColor: Colors.primary,
  },
  reminderPillText: {
    ...Typography.labelSmall,
    color: Colors.onSurface,
  },
  reminderPillTextActive: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  modalSaveBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    ...Shadows.card,
  },
  modalSaveBtnText: {
    ...Typography.labelLarge,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
});

