import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Shadows } from '../../src/constants/theme';
import { useMedicationsToday, useMedicationsList } from '../../src/hooks/useMedication';

const DAYS = [
  { day: 'T2', date: '21', key: 'mon' },
  { day: 'T3', date: '22', key: 'tue' },
  { day: 'T4', date: '23', key: 'wed' },
  { day: 'T5', date: '24', key: 'thu', active: true },
  { day: 'T6', date: '25', key: 'fri' },
  { day: 'T7', date: '26', key: 'sat' },
  { day: 'CN', date: '27', key: 'sun' },
];

export default function MedicationDashboardScreen() {
  const router = useRouter();
  const { data, isLoading, confirmLog, isConfirming } = useMedicationsToday();
  const { data: allMeds } = useMedicationsList();
  const [selectedDay, setSelectedDay] = useState('thu');

  const reminders = data?.reminders ?? [];
  const totalCount = data?.totalCount ?? 0;
  const takenCount = data?.takenCount ?? 0;
  const percentage = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  const handleConfirm = async (scheduleId: string, status: 'TAKEN' | 'SKIPPED') => {
    try {
      const now = new Date().toISOString();
      await confirmLog({
        scheduleId,
        scheduledAt: now,
        status,
        takenAt: status === 'TAKEN' ? now : undefined,
      });
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái uống thuốc lúc này.');
    }
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
          <Text style={styles.backText}>Trang chủ</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerSub}>VITACARE</Text>
          <Text style={styles.headerTitle}>Lịch Uống Thuốc</Text>
        </View>

        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => router.push('/medication/add')}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Date Strip */}
        <View style={styles.dateStripWrap}>
          <View style={styles.dateHeaderRow}>
            <View style={styles.dateTitleRow}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <Text style={styles.dateMonthText}>Tháng 11, 2026</Text>
            </View>
            <View style={styles.weekPill}>
              <Text style={styles.weekPillText}>Tuần này</Text>
            </View>
          </View>

          <View style={styles.daysGrid}>
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
          </View>
        </View>

        {/* Compliance Progress Banner */}
        <View style={[styles.progressCard, Shadows.card]}>
          <View style={styles.progressCardTop}>
            <View style={styles.progressTitleWrap}>
              <View style={styles.verifiedIconWrap}>
                <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.progressSub}>Tiến độ cữ thuốc hôm nay</Text>
                <Text style={styles.progressMain}>
                  Đã uống {takenCount}/{totalCount} cữ ({percentage}%)
                </Text>
              </View>
            </View>

            <View style={styles.complianceBadge}>
              <View style={styles.complianceDot} />
              <Text style={styles.complianceBadgeText}>
                {percentage >= 66 ? 'Tuân thủ tốt' : 'Cần chú ý'}
              </Text>
            </View>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
          </View>

          <View style={styles.progressTimesRow}>
            <Text style={styles.progressTimeText}>Sáng: 08:00</Text>
            <Text style={[styles.progressTimeText, { color: Colors.primary, fontWeight: '700' }]}>
              Trưa: 12:30
            </Text>
            <Text style={styles.progressTimeText}>Tối: 20:00</Text>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.addMedButton}
            onPress={() => router.push('/medication/add')}
          >
            <Ionicons name="add-circle" size={20} color={Colors.onPrimary} />
            <Text style={styles.addMedButtonText}>Thêm đơn thuốc</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => Alert.alert('Thông báo', 'Tính năng quét mã đơn thuốc sẽ sử dụng Camera để nhận diện OCR tự động.')}
          >
            <Ionicons name="qr-code-outline" size={20} color={Colors.primary} />
            <Text style={styles.scanButtonText}>Quét mã đơn</Text>
          </TouchableOpacity>
        </View>

        {/* Schedule List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lịch uống thuốc</Text>
          <Text style={styles.sectionSub}>{reminders.length} cữ cần uống</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ padding: 24 }} />
        ) : reminders.length === 0 ? (
          <View style={[styles.emptyCard, Shadows.card]}>
            <MaterialCommunityIcons name="pill" size={44} color={Colors.outline} />
            <Text style={styles.emptyTitle}>Chưa có lịch uống thuốc nào</Text>
            <Text style={styles.emptySub}>
              Chạm vào "+ Thêm đơn thuốc" để thiết lập lịch nhắc uống định kỳ đúng giờ nhé!
            </Text>
          </View>
        ) : (
          reminders.map((rem) => {
            const isTaken = rem.status === 'TAKEN';
            const isPending = rem.status === 'PENDING';

            return (
              <View
                key={rem.scheduleId}
                style={[
                  styles.reminderCard,
                  Shadows.card,
                  isPending && styles.reminderCardPending,
                ]}
              >
                <View style={styles.reminderTop}>
                  <View style={styles.reminderTimeRow}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={isPending ? Colors.tertiary : Colors.onSurfaceVariant}
                    />
                    <Text style={[styles.reminderTimeText, isPending && { color: Colors.tertiary, fontWeight: '700' }]}>
                      {rem.reminderTime}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isTaken ? styles.statusPillTaken : styles.statusPillPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillLabel,
                        isTaken ? styles.statusLabelTaken : styles.statusLabelPending,
                      ]}
                    >
                      {isTaken ? '✓ Đã uống' : 'Đến giờ uống'}
                    </Text>
                  </View>
                </View>

                {/* Medication Info */}
                <TouchableOpacity
                  style={styles.medInfoRow}
                  onPress={() => router.push(`/medication/${rem.medicationId}`)}
                >
                  <View style={[styles.medIconWrap, isTaken && { backgroundColor: Colors.surfaceContainerLow }]}>
                    <MaterialCommunityIcons
                      name="pill"
                      size={24}
                      color={isTaken ? Colors.primary : Colors.tertiary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medNameText}>{rem.medicationName}</Text>
                    <Text style={styles.medDosageText}>{rem.dosageLabel || '1 viên • Uống sau khi ăn'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.outline} />
                </TouchableOpacity>

                {/* Action Buttons if Pending */}
                {isPending && (
                  <View style={styles.pendingActionsRow}>
                    <TouchableOpacity
                      style={styles.takeBtn}
                      onPress={() => handleConfirm(rem.scheduleId, 'TAKEN')}
                      disabled={isConfirming}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color={Colors.onPrimary} />
                      <Text style={styles.takeBtnText}>Đã uống</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.skipBtn}
                      onPress={() => handleConfirm(rem.scheduleId, 'SKIPPED')}
                      disabled={isConfirming}
                    >
                      <Text style={styles.skipBtnText}>Bỏ qua</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Medicine Inventory Alert Card */}
        <View style={styles.alertCard}>
          <View style={styles.alertTop}>
            <View style={styles.alertIconWrap}>
              <MaterialCommunityIcons name="archive-alert-outline" size={22} color={Colors.tertiary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.alertTagRow}>
                <Text style={styles.alertTag}>CẢNH BÁO TỦ THUỐC</Text>
                <View style={styles.alertCountBadge}>
                  <Text style={styles.alertCountText}>2 loại</Text>
                </View>
              </View>
              <Text style={styles.alertBody}>
                Dưới 5 ngày sử dụng: <Text style={{ fontWeight: '700' }}>Glucosamine</Text> (còn 4 viên), <Text style={{ fontWeight: '700' }}>Bio-Care</Text> (còn 3 gói).
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.alertActionBtn}>
            <Ionicons name="bag-handle-outline" size={16} color={Colors.primary} />
            <Text style={styles.alertActionText}>Mua thêm / Đặt lịch bổ sung</Text>
          </TouchableOpacity>
        </View>

        {/* Medical Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.outline} />
          <Text style={styles.disclaimerText}>
            VitaCare hỗ trợ ghi nhớ và nhắc nhở lịch sinh hoạt cá nhân, không thay thế chẩn đoán hay chỉ định y khoa từ bác sĩ chuyên môn.
          </Text>
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
  addHeaderBtn: {
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
  dateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateMonthText: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  weekPill: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  weekPillText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 6,
    ...Shadows.card,
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  dayItemActive: {
    backgroundColor: Colors.primary,
  },
  dayLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  dayLabelActive: {
    color: Colors.onPrimary,
  },
  dayNumber: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    marginTop: 2,
  },
  dayNumberActive: {
    color: Colors.onPrimary,
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  dayDotActive: {
    backgroundColor: '#89f5e7',
  },
  dayDotInactive: {
    backgroundColor: Colors.surfaceContainer,
  },
  progressCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
  },
  progressCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verifiedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  progressMain: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  complianceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  complianceBadgeText: {
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
  progressTimesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressTimeText: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing.margin,
    marginTop: 14,
  },
  addMedButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.card,
  },
  addMedButtonText: {
    ...Typography.labelMedium,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  scanButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.card,
  },
  scanButtonText: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: '600',
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
  sectionSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    marginTop: 10,
  },
  emptySub: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
  },
  reminderCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
  },
  reminderCardPending: {
    borderWidth: 1,
    borderColor: 'rgba(130, 81, 0, 0.2)',
  },
  reminderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reminderTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reminderTimeText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPillTaken: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  statusPillPending: {
    backgroundColor: '#fef3c7',
  },
  statusPillLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusLabelTaken: {
    color: Colors.primary,
  },
  statusLabelPending: {
    color: '#92400e',
  },
  medInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  medIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medNameText: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  medDosageText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  pendingActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.surfaceContainer,
  },
  takeBtn: {
    flex: 2,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  takeBtnText: {
    ...Typography.labelMedium,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  skipBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
  },
  alertCard: {
    backgroundColor: '#fffbeb',
    marginHorizontal: Spacing.margin,
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  alertTop: {
    flexDirection: 'row',
    gap: 12,
  },
  alertIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400e',
    letterSpacing: 0.5,
  },
  alertCountBadge: {
    backgroundColor: '#fde68a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  alertCountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400e',
  },
  alertBody: {
    ...Typography.bodySmall,
    color: '#78350f',
    marginTop: 4,
    lineHeight: 18,
  },
  alertActionBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadows.card,
  },
  alertActionText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '700',
  },
  disclaimerBox: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: Spacing.margin,
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLow,
  },
  disclaimerText: {
    ...Typography.bodySmall,
    color: Colors.outline,
    flex: 1,
    lineHeight: 16,
    fontSize: 11,
  },
});

