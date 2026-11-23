import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Shadows } from '../../src/constants/theme';
import { useSleepLatest } from '../../src/hooks/useSleep';

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

export default function SleepDashboardScreen() {
  const router = useRouter();
  const { data, isLoading } = useSleepLatest();
  const [selectedDay, setSelectedDay] = useState('thu');

  const latestLog = data?.latestLog;
  const targetHours = data?.targetHours ?? 8;
  const durationHours = latestLog?.durationHours ?? 7.8;
  const percentage = data?.percentage ?? Math.round((durationHours / targetHours) * 100);

  const sleepStart = latestLog
    ? new Date(latestLog.sleepStart).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '23:15';
  const sleepEnd = latestLog
    ? new Date(latestLog.sleepEnd).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '07:00';

  const durationH = Math.floor(durationHours);
  const durationM = Math.round((durationHours - durationH) * 60);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Bar */}
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
          <Text style={styles.headerTitle}>Theo Dõi Giấc Ngủ</Text>
        </View>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => router.push('/sleep/stats')}
        >
          <Ionicons name="stats-chart" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Calendar Strip */}
        <View style={styles.dateStripWrap}>
          <View style={styles.dateHeaderRow}>
            <View>
              <Text style={styles.greetingText}>Chào buổi sáng 👋</Text>
              <View style={styles.greetingSubRow}>
                <View style={styles.greenDot} />
                <Text style={styles.greetingSub}>
                  Đêm qua: {durationH}h {durationM}m • Đạt {percentage}% mục tiêu ({targetHours}h)
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.calIconBtn}
              onPress={() => router.push('/sleep/stats')}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
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

        {/* Hero Night Card */}
        <View style={[styles.heroNightCard, Shadows.elevated]}>
          <View style={styles.heroTop}>
            <View>
              <View style={styles.tagPill}>
                <Ionicons name="sparkles" size={14} color="#89f5e7" />
                <Text style={styles.tagPillText}>Phục hồi năng lượng tối ưu</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreNumber}>88</Text>
                <Text style={styles.scoreMax}>/ 100</Text>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>Rất tốt</Text>
                </View>
              </View>
            </View>

            <View style={styles.moonIconWrap}>
              <MaterialCommunityIcons name="moon-waning-crescent" size={32} color="#89f5e7" />
            </View>
          </View>

          {/* Time Schedule Details */}
          <View style={styles.scheduleBox}>
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleIconWrap}>
                <MaterialCommunityIcons name="bed-clock" size={18} color="#89f5e7" />
              </View>
              <View>
                <Text style={styles.scheduleLabel}>Đi ngủ</Text>
                <Text style={styles.scheduleTime}>{sleepStart}</Text>
              </View>
            </View>

            <View style={[styles.scheduleItem, styles.scheduleItemBorder]}>
              <View style={styles.scheduleIconWrap}>
                <Ionicons name="sunny-outline" size={18} color="#ffd166" />
              </View>
              <View>
                <Text style={styles.scheduleLabel}>Thức dậy</Text>
                <Text style={styles.scheduleTime}>{sleepEnd}</Text>
              </View>
            </View>
          </View>

          {/* Hypnogram Stage Bar */}
          <View style={styles.hypnoSection}>
            <View style={styles.hypnoHeader}>
              <Text style={styles.hypnoTitle}>Giai đoạn giấc ngủ</Text>
              <Text style={styles.hypnoTotal}>Tổng: {durationH}h {durationM}m</Text>
            </View>

            <View style={styles.hypnoBar}>
              <View style={[styles.hypnoSeg, { width: '28%', backgroundColor: '#4ae176' }]} />
              <View style={[styles.hypnoSeg, { width: '24%', backgroundColor: '#39b8fd' }]} />
              <View style={[styles.hypnoSeg, { width: '42%', backgroundColor: '#89f5e7' }]} />
              <View style={[styles.hypnoSeg, { width: '6%', backgroundColor: '#ffdad6' }]} />
            </View>

            <View style={styles.hypnoLegendGrid}>
              <View style={styles.hypnoLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#4ae176' }]} />
                <Text style={styles.legendStageName}>Ngủ sâu (Deep):</Text>
                <Text style={styles.legendStageVal}>2h 10m (28%)</Text>
              </View>

              <View style={styles.hypnoLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#39b8fd' }]} />
                <Text style={styles.legendStageName}>Ngủ mơ (REM):</Text>
                <Text style={styles.legendStageVal}>1h 50m (24%)</Text>
              </View>

              <View style={styles.hypnoLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#89f5e7' }]} />
                <Text style={styles.legendStageName}>Ngủ nông (Light):</Text>
                <Text style={styles.legendStageVal}>3h 15m (42%)</Text>
              </View>

              <View style={styles.hypnoLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ffdad6' }]} />
                <Text style={styles.legendStageName}>Thức dậy (Awake):</Text>
                <Text style={styles.legendStageVal}>30m (6%)</Text>
              </View>
            </View>
          </View>

          {/* CTA to stats */}
          <TouchableOpacity
            style={styles.heroActionBtn}
            onPress={() => router.push('/sleep/stats')}
          >
            <Text style={styles.heroActionText}>Xem phân tích chuyên sâu chi tiết</Text>
            <Ionicons name="chevron-forward" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, Shadows.card]}
            onPress={() => router.push('/sleep/add')}
          >
            <View style={styles.actionTopRow}>
              <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(0, 104, 95, 0.12)' }]}>
                <MaterialCommunityIcons name="bed" size={22} color={Colors.primary} />
              </View>
              <View style={styles.actionPill}>
                <Text style={styles.actionPillText}>07:00 AM</Text>
              </View>
            </View>
            <Text style={styles.actionTitle}>Chế độ Đi ngủ</Text>
            <Text style={styles.actionSub}>Báo thức êm dịu & cách ly âm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, Shadows.card]}
            onPress={() => router.push('/sleep/add')}
          >
            <View style={styles.actionTopRow}>
              <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(0, 101, 145, 0.12)' }]}>
                <Ionicons name="add-circle" size={24} color={Colors.secondary} />
              </View>
              <Ionicons name="arrow-forward" size={18} color={Colors.onSurfaceVariant} />
            </View>
            <Text style={styles.actionTitle}>Ghi nhận thủ công</Text>
            <Text style={styles.actionSub}>Nhập giấc ngủ trưa hoặc đêm</Text>
          </TouchableOpacity>
        </View>

        {/* Sleep Vitals */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chỉ số Sinh học khi ngủ</Text>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>Thời gian thực</Text>
          </View>
        </View>

        <View style={styles.vitalsGrid}>
          {/* Heart Rate */}
          <View style={[styles.vitalCard, Shadows.card]}>
            <View style={styles.vitalHeader}>
              <View style={[styles.vitalIconWrap, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="heart" size={18} color="#ef4444" />
              </View>
              <Text style={styles.vitalStatus}>Ổn định</Text>
            </View>
            <Text style={styles.vitalName}>Nhịp tim khi ngủ</Text>
            <View style={styles.vitalValRow}>
              <Text style={styles.vitalVal}>58</Text>
              <Text style={styles.vitalUnit}>bpm</Text>
            </View>
            <Text style={styles.vitalFooter}>Thấp nhất 52 bpm lúc 03:20</Text>
          </View>

          {/* Breathing Rate */}
          <View style={[styles.vitalCard, Shadows.card]}>
            <View style={styles.vitalHeader}>
              <View style={[styles.vitalIconWrap, { backgroundColor: '#e0f2fe' }]}>
                <MaterialCommunityIcons name="weather-windy" size={18} color={Colors.secondary} />
              </View>
              <Text style={styles.vitalStatus}>Tốt</Text>
            </View>
            <Text style={styles.vitalName}>Nhịp thở trung bình</Text>
            <View style={styles.vitalValRow}>
              <Text style={styles.vitalVal}>14</Text>
              <Text style={styles.vitalUnit}>nhịp/phút</Text>
            </View>
            <Text style={styles.vitalFooter}>Đều đặn, không ngắt quãng</Text>
          </View>

          {/* SpO2 */}
          <View style={[styles.vitalCard, Shadows.card]}>
            <View style={styles.vitalHeader}>
              <View style={[styles.vitalIconWrap, { backgroundColor: '#e2f9f5' }]}>
                <Ionicons name="water" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.vitalStatus}>98% SpO2</Text>
            </View>
            <Text style={styles.vitalName}>Oxy trong máu</Text>
            <View style={styles.vitalValRow}>
              <Text style={styles.vitalVal}>98</Text>
              <Text style={styles.vitalUnit}>%</Text>
            </View>
            <Text style={styles.vitalFooter}>Bão hòa oxy tối ưu</Text>
          </View>

          {/* Bedroom Temp */}
          <View style={[styles.vitalCard, Shadows.card]}>
            <View style={styles.vitalHeader}>
              <View style={[styles.vitalIconWrap, { backgroundColor: Colors.surfaceContainer }]}>
                <MaterialCommunityIcons name="thermometer" size={18} color={Colors.onSurfaceVariant} />
              </View>
              <Text style={styles.vitalStatus}>Lý tưởng</Text>
            </View>
            <Text style={styles.vitalName}>Môi trường phòng</Text>
            <View style={styles.vitalValRow}>
              <Text style={styles.vitalVal}>24.5</Text>
              <Text style={styles.vitalUnit}>°C</Text>
            </View>
            <Text style={styles.vitalFooter}>Âm lượng 32dB (Yên tĩnh)</Text>
          </View>
        </View>

        {/* Power Nap Card */}
        <View style={[styles.napCard, Shadows.card]}>
          <View style={styles.napLeft}>
            <View style={styles.napIconWrap}>
              <MaterialCommunityIcons name="leaf" size={24} color={Colors.secondary} />
            </View>
            <View>
              <View style={styles.napTitleRow}>
                <Text style={styles.napTitle}>Giấc ngủ trưa hồi sức</Text>
                <View style={styles.napDot} />
              </View>
              <Text style={styles.napSub}>12:45 – 13:15 (30 phút) • Đã hoàn tất</Text>
            </View>
          </View>
          <View style={styles.napBadge}>
            <Text style={styles.napBadgeText}>+15 điểm</Text>
          </View>
        </View>

        {/* Doctor Advice Card */}
        <View style={[styles.adviceCard, Shadows.card]}>
          <View style={styles.adviceHeader}>
            <View style={styles.adviceIconWrap}>
              <Ionicons name="medical" size={18} color="#ffffff" />
            </View>
            <Text style={styles.adviceTag}>LỜI KHUYÊN TỪ BÁC SĨ VITACARE</Text>
          </View>
          <Text style={styles.adviceBody}>
            Nhịp sinh học của bạn đang rất đều đặn! Hãy duy trì thói quen tắt màn hình điện thoại trước <Text style={{ fontWeight: '700', color: '#c9e6ff' }}>22:45</Text> tối nay để kích thích giải phóng Melatonin tự nhiên và kéo dài pha ngủ sâu (Deep Sleep).
          </Text>
          <View style={styles.adviceFooter}>
            <View style={styles.doctorVerifiedRow}>
              <Ionicons name="checkmark-circle" size={16} color="#89f5e7" />
              <Text style={styles.doctorVerifiedText}>Được duyệt bởi Hội đồng Y khoa VitaCare</Text>
            </View>
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
  greetingText: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
  },
  greetingSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  greetingSub: {
    ...Typography.bodySmall,
    color: Colors.secondary,
    fontWeight: '600',
  },
  calIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#89f5e7',
  },
  dayDotInactive: {
    backgroundColor: Colors.secondary,
  },
  heroNightCard: {
    backgroundColor: '#1b2438',
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 20,
    marginTop: 10,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 104, 95, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#89f5e7',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 8,
  },
  scoreNumber: {
    fontSize: 38,
    fontWeight: '800',
    color: '#ffffff',
  },
  scoreMax: {
    fontSize: 14,
    color: '#89f5e7',
    fontWeight: '600',
  },
  scoreBadge: {
    backgroundColor: 'rgba(57, 184, 253, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  scoreBadgeText: {
    ...Typography.labelSmall,
    color: '#39b8fd',
    fontWeight: '700',
  },
  moonIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 12,
    marginTop: 16,
  },
  scheduleItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scheduleItemBorder: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
    paddingLeft: 12,
  },
  scheduleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  scheduleTime: {
    ...Typography.labelLarge,
    color: '#ffffff',
    fontWeight: '700',
  },
  hypnoSection: {
    marginTop: 16,
  },
  hypnoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hypnoTitle: {
    ...Typography.labelMedium,
    color: 'rgba(255,255,255,0.8)',
  },
  hypnoTotal: {
    ...Typography.labelSmall,
    color: 'rgba(255,255,255,0.6)',
  },
  hypnoBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  hypnoSeg: {
    height: '100%',
  },
  hypnoLegendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  hypnoLegendItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendStageName: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  legendStageVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 'auto',
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  heroActionText: {
    ...Typography.labelMedium,
    color: '#ffffff',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.margin,
    marginTop: 18,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
  },
  actionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  actionPillText: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: '600',
  },
  actionTitle: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  actionSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.margin,
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  liveBadge: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveBadgeText: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: '600',
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.margin,
    gap: 12,
  },
  vitalCard: {
    width: (width - Spacing.margin * 2 - 12) / 2,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 14,
  },
  vitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vitalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalStatus: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.secondary,
  },
  vitalName: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  vitalValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginTop: 2,
  },
  vitalVal: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  vitalUnit: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  vitalFooter: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.surfaceContainer,
  },
  napCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  napLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  napIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 101, 145, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  napTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  napTitle: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  napDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  napSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  napBadge: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  napBadgeText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '700',
  },
  adviceCard: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.margin,
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  adviceIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adviceTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#89f5e7',
    letterSpacing: 0.5,
  },
  adviceBody: {
    ...Typography.bodyMedium,
    color: '#ffffff',
    lineHeight: 20,
  },
  adviceFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  doctorVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doctorVerifiedText: {
    fontSize: 11,
    color: '#89f5e7',
    fontWeight: '600',
  },
});

