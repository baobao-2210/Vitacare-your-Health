import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/constants/theme';
import { useWaterToday } from '../../src/hooks/useWater';

const { width } = Dimensions.get('window');

const DAYS = [
  { day: 'T2', date: '21', key: 'mon' },
  { day: 'T3', date: '22', key: 'tue' },
  { day: 'T4', date: '23', key: 'wed' },
  { day: 'T5', date: '24', key: 'thu', active: true },
  { day: 'T6', date: '25', key: 'fri' },
  { day: 'T7', date: '26', key: 'sat' },
  { day: 'CN', date: '27', key: 'sun' },
];

export default function WaterTrackerScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, addLog, isAdding, deleteLog } = useWaterToday();
  const [selectedDay, setSelectedDay] = useState('thu');

  const totalMl = data?.totalMl ?? 0;
  const goalMl = data?.goalMl ?? 2500;
  const percentage = data?.percentage ?? (goalMl > 0 ? Math.round((totalMl / goalMl) * 100) : 0);
  const remainingMl = Math.max(0, goalMl - totalMl);
  const logs = data?.logs ?? [];

  // SVG Gauge calculations
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, percentage) / 100) * circumference;

  const handleQuickAdd = async (amount: number) => {
    try {
      await addLog({ amountMl: amount });
    } catch {
      Alert.alert('Lỗi', 'Không thể ghi nhận nước uống lúc này.');
    }
  };

  const handleDelete = (id: string, amount: number) => {
    Alert.alert('Xác nhận', `Bạn có muốn xóa lần uống ${amount}ml này không?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLog(id);
          } catch {
            Alert.alert('Lỗi', 'Không thể xóa bản ghi.');
          }
        },
      },
    ]);
  };

  const lastLog = logs.length > 0 ? logs[0] : null;
  const lastLogTime = lastLog
    ? new Date(lastLog.consumedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backText}>Trang chủ</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerSub}>VITACARE</Text>
          <Text style={styles.headerTitle}>Theo dõi Nước uống</Text>
        </View>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => router.push('/water/history')}
        >
          <Ionicons name="bar-chart-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Date Strip */}
        <View style={styles.dateStripWrap}>
          <View style={styles.dateHeaderRow}>
            <View>
              <Text style={styles.dateSub}>LỊCH TRÌNH CẤP NƯỚC</Text>
              <Text style={styles.dateMonth}>Tháng 11, 2026</Text>
            </View>
            <View style={styles.todayBadge}>
              <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
              <Text style={styles.todayBadgeText}>Hôm nay</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroller}>
            {DAYS.map((d) => {
              const isSelected = selectedDay === d.key;
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.dayItem, isSelected && styles.dayItemActive]}
                  onPress={() => setSelectedDay(d.key)}
                >
                  <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>{d.day}</Text>
                  <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive]}>{d.date}</Text>
                  <View style={[styles.dayDot, isSelected ? styles.dayDotActive : styles.dayDotInactive]} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Hero Card */}
        <View style={[styles.heroCard, Shadows.card]}>
          {/* Card Top Pill */}
          <View style={styles.heroTop}>
            <View style={styles.heroUserWrap}>
              <View style={styles.waterDropIcon}>
                <Ionicons name="water" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.heroGoalTitle}>Mục tiêu hằng ngày</Text>
                <Text style={styles.heroUserSub}>Người dùng VitaCare • 65kg</Text>
              </View>
            </View>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>Tần suất đều</Text>
            </View>
          </View>

          {/* Circular SVG Gauge */}
          <View style={styles.gaugeContainer}>
            <Svg width={180} height={180} style={styles.svgRotate}>
              <Defs>
                <LinearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#4ae176" />
                  <Stop offset="100%" stopColor="#006591" />
                </LinearGradient>
              </Defs>
              <Circle
                cx="90"
                cy="90"
                r={radius}
                stroke={Colors.surfaceContainer}
                strokeWidth={12}
                fill="transparent"
              />
              <Circle
                cx="90"
                cy="90"
                r={radius}
                stroke="url(#waterGrad)"
                strokeWidth={12}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </Svg>

            <View style={styles.gaugeInner}>
              <Text style={styles.gaugeLabel}>ĐÃ UỐNG</Text>
              <View style={styles.gaugeValueRow}>
                <Text style={styles.gaugeValue}>{totalMl.toLocaleString('vi-VN')}</Text>
                <Text style={styles.gaugeUnit}>/ {goalMl.toLocaleString('vi-VN')} ml</Text>
              </View>
              <View style={styles.percentBadge}>
                <Text style={styles.percentBadgeText}>{percentage}% hoàn thành</Text>
              </View>
            </View>
          </View>

          {/* Encouragement text */}
          <View style={styles.encouragementWrap}>
            <Text style={styles.encouragementMain}>
              {remainingMl > 0 ? (
                <>
                  Còn <Text style={{ color: Colors.primary, fontWeight: '700' }}>{remainingMl.toLocaleString('vi-VN')} ml</Text> nữa để hoàn thành mục tiêu ngày!
                </>
              ) : (
                'Tuyệt vời! Bạn đã xuất sắc hoàn thành mục tiêu nước hôm nay! 🎉'
              )}
            </Text>
            <Text style={styles.encouragementSub}>
              Cơ thể bạn đang phản hồi rất tích cực với nhịp độ cấp nước đều đặn này.
            </Text>
          </View>

          {/* Quick Status Footer */}
          <View style={styles.heroFooter}>
            <View style={styles.heroFooterItem}>
              <View style={styles.heroFooterIconWrap}>
                <Ionicons name="time-outline" size={16} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroFooterLabel}>Uống gần nhất</Text>
                <Text style={styles.heroFooterValue}>
                  {lastLog ? `${lastLogTime} (${lastLog.amountMl}ml)` : 'Chưa có'}
                </Text>
              </View>
            </View>

            <View style={styles.heroFooterItem}>
              <View style={[styles.heroFooterIconWrap, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="alarm-outline" size={16} color={Colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroFooterLabel}>Cốc tiếp theo</Text>
                <Text style={[styles.heroFooterValue, { color: Colors.primary }]}>Sau 1 giờ (dự kiến)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Log Presets */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="add-circle" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Nạp nước nhanh</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/water/add')}>
            <Text style={styles.sectionLink}>Tùy chỉnh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.presetsGrid}>
          <TouchableOpacity
            style={[styles.presetCard, Shadows.card]}
            onPress={() => handleQuickAdd(100)}
            disabled={isAdding}
          >
            <View style={styles.presetIconWrap}>
              <Ionicons name="cafe-outline" size={22} color={Colors.primary} />
            </View>
            <View style={styles.presetContent}>
              <Text style={styles.presetAmount}>+100 ml</Text>
              <Text style={styles.presetDesc}>Ngụm nhỏ</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.presetCard, Shadows.card]}
            onPress={() => handleQuickAdd(200)}
            disabled={isAdding}
          >
            <View style={styles.presetIconWrap}>
              <MaterialCommunityIcons name="tea" size={22} color={Colors.primary} />
            </View>
            <View style={styles.presetContent}>
              <Text style={styles.presetAmount}>+200 ml</Text>
              <Text style={styles.presetDesc}>Cốc trà ấm</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.presetCard, Shadows.card]}
            onPress={() => handleQuickAdd(250)}
            disabled={isAdding}
          >
            <View style={styles.presetIconWrap}>
              <MaterialCommunityIcons name="glass-cocktail" size={22} color={Colors.primary} />
            </View>
            <View style={styles.presetContent}>
              <Text style={styles.presetAmount}>+250 ml</Text>
              <Text style={styles.presetDesc}>Cốc chuẩn</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.presetCard, Shadows.card]}
            onPress={() => handleQuickAdd(500)}
            disabled={isAdding}
          >
            <View style={styles.presetIconWrap}>
              <MaterialCommunityIcons name="bottle-tonic-outline" size={22} color={Colors.primary} />
            </View>
            <View style={styles.presetContent}>
              <Text style={styles.presetAmount}>+500 ml</Text>
              <Text style={styles.presetDesc}>Bình cá nhân</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Custom Input Button */}
        <TouchableOpacity
          style={styles.customAddButton}
          onPress={() => router.push('/water/add')}
        >
          <Ionicons name="create-outline" size={20} color={Colors.onPrimary} />
          <Text style={styles.customAddButtonText}>+ Nhập số ml tùy chỉnh</Text>
        </TouchableOpacity>

        {/* Weekly Mini Stats Visualizer */}
        <View style={[styles.statsCard, Shadows.card]}>
          <View style={styles.statsHeader}>
            <View>
              <Text style={styles.statsSub}>THỐNG KÊ 7 NGÀY</Text>
              <Text style={styles.statsTitle}>Đạt 91% mục tiêu tuần</Text>
            </View>
            <View style={styles.trendPill}>
              <Ionicons name="trending-up" size={14} color={Colors.secondary} />
              <Text style={styles.trendText}>+8% tuần qua</Text>
            </View>
          </View>

          {/* Simple weekly bars */}
          <View style={styles.barsContainer}>
            {[
              { day: 'T2', val: '2.4L', height: 85 },
              { day: 'T3', val: '2.5L', height: 92 },
              { day: 'T4', val: '2.1L', height: 76 },
              { day: 'Nay', val: `${(totalMl / 1000).toFixed(1)}L`, height: Math.min(100, Math.max(15, percentage)), isToday: true },
              { day: 'T6', val: '-', height: 10 },
              { day: 'T7', val: '-', height: 10 },
              { day: 'CN', val: '-', height: 10 },
            ].map((bar, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={[styles.barValText, bar.isToday && styles.barValTextToday]}>
                  {bar.val}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${bar.height}%` },
                      bar.isToday ? styles.barFillToday : styles.barFillRegular,
                    ]}
                  />
                </View>
                <Text style={[styles.barDayText, bar.isToday && styles.barDayTextToday]}>
                  {bar.day}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.statsFooter}>
            <Text style={styles.statsAvg}>
              Trung bình ngày: <Text style={{ fontWeight: '700', color: Colors.onSurface }}>2.230 ml</Text>
            </Text>
            <Text style={styles.statsTarget}>Mục tiêu: {goalMl} ml/ngày</Text>
          </View>
        </View>

        {/* Today's Intake Timeline */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="time" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Nhật ký hôm nay</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{logs.length} cữ nạp</Text>
          </View>
        </View>

        <View style={[styles.logsContainer, Shadows.card]}>
          {isLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ padding: 24 }} />
          ) : logs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="water-off-outline" size={40} color={Colors.outline} />
              <Text style={styles.emptyTitle}>Chưa có lần nạp nước nào</Text>
              <Text style={styles.emptySub}>Hãy chạm vào các nút ở trên để ghi nhận cữ nước đầu tiên!</Text>
            </View>
          ) : (
            logs.map((log) => {
              const time = new Date(log.consumedAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logLeft}>
                    <View style={styles.logIcon}>
                      <Ionicons name="water-outline" size={20} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.logAmountRow}>
                        <Text style={styles.logAmount}>{log.amountMl} ml</Text>
                        <View style={styles.logTimePill}>
                          <Text style={styles.logTime}>{time}</Text>
                        </View>
                      </View>
                      <Text style={styles.logNote}>{log.note || 'Cấp nước thường nhật'}</Text>
                    </View>
                  </View>

                  <View style={styles.logActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleDelete(log.id, log.amountMl)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          <TouchableOpacity
            style={styles.historyLinkBtn}
            onPress={() => router.push('/water/history')}
          >
            <Text style={styles.historyLinkText}>Xem toàn bộ lịch sử chi tiết</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Scientific Tip Card */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <Ionicons name="bulb-outline" size={22} color={Colors.onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.tipHeaderRow}>
              <Text style={styles.tipTag}>MẸO KHOA HỌC VITACARE</Text>
              <View style={styles.tipDot} />
              <Text style={styles.tipTime}>Hôm nay</Text>
            </View>
            <Text style={styles.tipTitle}>Thời điểm vàng uống nước</Text>
            <Text style={styles.tipBody}>
              "Uống một cốc nước ấm 200ml trước bữa ăn 30 phút giúp kích hoạt enzym tiêu hóa, bôi trơn thành ruột và giảm áp lực co thắt dạ dày hiệu quả."
            </Text>
            <Text style={styles.tipDoctor}>Bác sĩ chuyên khoa tiêu hóa VitaCare khuyên dùng</Text>
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
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  headerTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  historyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  dateStripWrap: {
    paddingHorizontal: Spacing.margin,
    paddingTop: 12,
    paddingBottom: 8,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateSub: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  dateMonth: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  todayBadgeText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  daysScroller: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  dayItem: {
    width: 44,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  dayItemActive: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.05 }],
  },
  dayLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  dayLabelActive: {
    color: Colors.onPrimary,
    opacity: 0.9,
  },
  dayNumber: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    marginTop: 2,
    fontWeight: '600',
  },
  dayNumberActive: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 4,
  },
  dayDotActive: {
    backgroundColor: '#6bff8f',
  },
  dayDotInactive: {
    backgroundColor: Colors.secondary,
  },
  heroCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroUserWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  waterDropIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGoalTitle: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  heroUserSub: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  statusPillText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    position: 'relative',
    height: 180,
  },
  svgRotate: {
    transform: [{ rotate: '-90deg' }],
  },
  gaugeInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  gaugeValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 2,
  },
  gaugeValue: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  gaugeUnit: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  percentBadge: {
    marginTop: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  percentBadgeText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '700',
  },
  encouragementWrap: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  encouragementMain: {
    ...Typography.bodyMedium,
    color: Colors.onSurface,
    fontWeight: '500',
    textAlign: 'center',
  },
  encouragementSub: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 2,
  },
  heroFooter: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  heroFooterItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroFooterIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFooterLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  heroFooterValue: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.margin,
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  sectionLink: {
    ...Typography.labelMedium,
    color: Colors.primary,
    fontWeight: '600',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.margin,
    gap: 10,
  },
  presetCard: {
    width: (width - Spacing.margin * 2 - 10) / 2,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  presetIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetContent: {
    flex: 1,
  },
  presetAmount: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 16,
  },
  presetDesc: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  customAddButton: {
    marginHorizontal: Spacing.margin,
    marginTop: 10,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.card,
  },
  customAddButtonText: {
    ...Typography.labelLarge,
    color: Colors.onPrimary,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 18,
    marginTop: 24,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsSub: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  statsTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
    marginTop: 2,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  trendText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingVertical: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barValText: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  barValTextToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  barTrack: {
    width: 24,
    height: 80,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  barFillRegular: {
    backgroundColor: '#4ae176',
  },
  barFillToday: {
    backgroundColor: Colors.primary,
  },
  barDayText: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    marginTop: 6,
  },
  barDayTextToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.surfaceContainer,
  },
  statsAvg: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  statsTarget: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  logsContainer: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    marginTop: 8,
  },
  emptySub: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surfaceContainer,
  },
  logLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logAmount: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  logTimePill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  logTime: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  logNote: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  logActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
  historyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
  },
  historyLinkText: {
    ...Typography.labelMedium,
    color: Colors.primary,
    fontWeight: '600',
  },
  tipCard: {
    backgroundColor: Colors.primaryContainer,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 18,
    marginTop: 20,
    flexDirection: 'row',
    gap: 14,
  },
  tipIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8bd79b',
    letterSpacing: 0.5,
  },
  tipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8bd79b',
  },
  tipTime: {
    ...Typography.labelSmall,
    color: 'rgba(255,255,255,0.8)',
  },
  tipTitle: {
    ...Typography.headlineSmall,
    color: Colors.onPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  tipBody: {
    ...Typography.bodyMedium,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 20,
    marginTop: 4,
  },
  tipDoctor: {
    ...Typography.labelSmall,
    color: '#8bd79b',
    marginTop: 8,
  },
});

