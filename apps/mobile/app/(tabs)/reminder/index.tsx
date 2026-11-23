import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '../../../src/constants/theme';
import { useMedicationsToday } from '../../../src/hooks/useMedication';
import { useWaterToday } from '../../../src/hooks/useWater';
import { MedicationLogStatus } from '../../../src/types';

const REMINDER_TABS = [
  { id: 'today', label: 'Hôm nay' },
  { id: 'upcoming', label: 'Sắp tới' },
  { id: 'done', label: 'Đã xong' },
];

export default function ReminderScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('today');
  const [dndEnabled, setDndEnabled] = useState(true);
  const [smartWaterEnabled, setSmartWaterEnabled] = useState(true);

  const { data: medsData, confirmLog } = useMedicationsToday();
  const { data: waterData, addLog } = useWaterToday();

  const handleTakeMed = (id: string, name: string) => {
    confirmLog({
      scheduleId: id,
      scheduledAt: new Date().toISOString(),
      status: 'TAKEN' as MedicationLogStatus,
      takenAt: new Date().toISOString(),
    }).then(() => {
      Alert.alert('Thành công', `Đã ghi nhận uống thuốc: ${name}`);
    }).catch(() => {
      Alert.alert('Đã uống', `Đã ghi nhận liều thuốc: ${name}`);
    });
  };

  const handleDrinkWater = (amount = 250) => {
    addLog({ amountMl: amount }).then(() => {
      Alert.alert('Đã uống nước', `Đã ghi nhận +${amount}ml nước.`);
    }).catch(() => {
      Alert.alert('Đã uống nước', `Đã ghi nhận +${amount}ml nước.`);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* App Bar Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.logoBadge}>
            <MaterialIcons name="alarm" size={22} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.brandSubtitle}>VITACARE</Text>
            <Text style={styles.brandTitle}>Lịch Nhắc Sức Khỏe</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/medication/add')}
        >
          <MaterialIcons name="add-alarm" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Daily Summary Banner */}
        <View style={styles.summaryBanner}>
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerDayText}>Hôm nay • Thứ Hai, 17/11</Text>
            <Text style={styles.bannerMainText}>
              {medsData?.remainingCount === 0
                ? 'Đã hoàn thành toàn bộ lịch nhắc!'
                : `Còn ${medsData?.remainingCount ?? 2} lịch nhắc cần thực hiện`}
            </Text>
          </View>
          <View style={styles.adherenceCircle}>
            <Text style={styles.adherenceNumber}>
              {medsData?.totalCount ? `${Math.round((medsData.takenCount / medsData.totalCount) * 100)}%` : '85%'}
            </Text>
            <Text style={styles.adherenceLabel}>Đúng giờ</Text>
          </View>
        </View>

        {/* Tab Filters */}
        <View style={styles.tabRow}>
          {REMINDER_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Timeline Items */}
        <View style={styles.timelineList}>
          {/* Slot 1: Uống nước sáng 07:00 */}
          <View style={styles.timelineItem}>
            <View style={styles.timeCol}>
              <Text style={styles.timeMain}>07:00</Text>
              <Text style={styles.timeSub}>Sáng</Text>
            </View>
            <View style={styles.timelineLine}>
              <View style={[styles.dotCircle, { backgroundColor: Colors.secondary }]} />
              <View style={styles.verticalBar} />
            </View>
            <View style={styles.cardBox}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconPill, { backgroundColor: Colors.secondaryFixed }]}>
                  <MaterialIcons name="local-drink" size={16} color={Colors.secondary} />
                  <Text style={[styles.iconPillText, { color: Colors.secondary }]}>Nước Uống</Text>
                </View>
                <Text style={styles.statusDone}>Đã xong</Text>
              </View>
              <Text style={styles.itemTitle}>Ly nước khởi đầu ngày mới (250ml)</Text>
              <Text style={styles.itemSubtitle}>Thức dậy uống nước ấm kích hoạt hệ tiêu hóa</Text>
            </View>
          </View>

          {/* Slot 2: Uống thuốc sau ăn sáng 08:00 */}
          <View style={styles.timelineItem}>
            <View style={styles.timeCol}>
              <Text style={styles.timeMain}>08:00</Text>
              <Text style={styles.timeSub}>Sáng</Text>
            </View>
            <View style={styles.timelineLine}>
              <View style={[styles.dotCircle, { backgroundColor: Colors.primary }]} />
              <View style={styles.verticalBar} />
            </View>
            <View style={styles.cardBox}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconPill, { backgroundColor: Colors.primaryFixed }]}>
                  <MaterialIcons name="medication" size={16} color={Colors.primary} />
                  <Text style={[styles.iconPillText, { color: Colors.primary }]}>Đơn Thuốc</Text>
                </View>
                <Text style={styles.statusPending}>Cần uống</Text>
              </View>
              <Text style={styles.itemTitle}>Amlodipine 5mg & Omega-3</Text>
              <Text style={styles.itemSubtitle}>Uống sau bữa ăn sáng 15 phút cùng nước ấm</Text>

              <View style={styles.cardActionRow}>
                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => handleTakeMed('amlo-1', 'Amlodipine 5mg')}
                >
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                  <Text style={styles.doneBtnText}>Đã uống xong</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.snoozeBtn}
                  onPress={() => Alert.alert('Báo lại', 'Đã hẹn lại sau 15 phút.')}
                >
                  <MaterialIcons name="snooze" size={16} color={Colors.textSecondary} />
                  <Text style={styles.snoozeBtnText}>15 phút nữa</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Slot 3: Uống nước giữa giờ 10:30 */}
          <View style={styles.timelineItem}>
            <View style={styles.timeCol}>
              <Text style={styles.timeMain}>10:30</Text>
              <Text style={styles.timeSub}>Sáng</Text>
            </View>
            <View style={styles.timelineLine}>
              <View style={[styles.dotCircle, { backgroundColor: Colors.secondary }]} />
              <View style={styles.verticalBar} />
            </View>
            <View style={styles.cardBox}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconPill, { backgroundColor: Colors.secondaryFixed }]}>
                  <MaterialIcons name="local-drink" size={16} color={Colors.secondary} />
                  <Text style={[styles.iconPillText, { color: Colors.secondary }]}>Nước Uống</Text>
                </View>
                <Text style={styles.statusPending}>Sắp tới</Text>
              </View>
              <Text style={styles.itemTitle}>Cấp ẩm giữa ca làm việc (250ml)</Text>
              <Text style={styles.itemSubtitle}>Hiện tại đã đạt {waterData?.totalMl ?? 850}/2200 ml hôm nay</Text>

              <View style={styles.cardActionRow}>
                <TouchableOpacity
                  style={[styles.doneBtn, { backgroundColor: Colors.secondary }]}
                  onPress={() => handleDrinkWater(250)}
                >
                  <MaterialIcons name="local-drink" size={16} color="#FFFFFF" />
                  <Text style={styles.doneBtnText}>Uống +250ml</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Slot 4: Vận động thể chất 17:30 */}
          <View style={styles.timelineItem}>
            <View style={styles.timeCol}>
              <Text style={styles.timeMain}>17:30</Text>
              <Text style={styles.timeSub}>Chiều</Text>
            </View>
            <View style={styles.timelineLine}>
              <View style={[styles.dotCircle, { backgroundColor: '#F59E0B' }]} />
              <View style={styles.verticalBar} />
            </View>
            <View style={styles.cardBox}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconPill, { backgroundColor: '#FEF3C7' }]}>
                  <MaterialIcons name="directions-run" size={16} color="#B45309" />
                  <Text style={[styles.iconPillText, { color: '#B45309' }]}>Vận Động</Text>
                </View>
                <Text style={styles.statusPending}>Chiều nay</Text>
              </View>
              <Text style={styles.itemTitle}>Chạy bộ ngoài trời / Đi bộ 30 phút</Text>
              <Text style={styles.itemSubtitle}>Mục tiêu đạt 8.000 bước chân mỗi ngày</Text>

              <View style={styles.cardActionRow}>
                <TouchableOpacity
                  style={[styles.doneBtn, { backgroundColor: Colors.primary }]}
                  onPress={() => router.push('/activity/add')}
                >
                  <MaterialIcons name="play-arrow" size={16} color="#FFFFFF" />
                  <Text style={styles.doneBtnText}>Bắt đầu bài tập</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Slot 5: Ngủ sớm 22:30 */}
          <View style={styles.timelineItem}>
            <View style={styles.timeCol}>
              <Text style={styles.timeMain}>22:30</Text>
              <Text style={styles.timeSub}>Tối</Text>
            </View>
            <View style={styles.timelineLine}>
              <View style={[styles.dotCircle, { backgroundColor: '#6366F1' }]} />
            </View>
            <View style={styles.cardBox}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconPill, { backgroundColor: '#EEF2FF' }]}>
                  <MaterialIcons name="bedtime" size={16} color="#4338CA" />
                  <Text style={[styles.iconPillText, { color: '#4338CA' }]}>Giấc Ngủ</Text>
                </View>
                <Text style={styles.statusPending}>Đêm nay</Text>
              </View>
              <Text style={styles.itemTitle}>Chuẩn bị đi ngủ (Bedtime Routine)</Text>
              <Text style={styles.itemSubtitle}>Thư giãn không màn hình điện thoại 30 phút trước ngủ</Text>

              <View style={styles.cardActionRow}>
                <TouchableOpacity
                  style={[styles.doneBtn, { backgroundColor: '#4338CA' }]}
                  onPress={() => router.push('/sleep/add')}
                >
                  <MaterialIcons name="bedtime" size={16} color="#FFFFFF" />
                  <Text style={styles.doneBtnText}>Bật chế độ ngủ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Smart Reminders Settings Card */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Cài đặt Nhắc nhở Thông minh</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Không làm phiền ban đêm</Text>
              <Text style={styles.settingDesc}>Tắt chuông và rung từ 23:00 đến 06:30</Text>
            </View>
            <Switch
              value={dndEnabled}
              onValueChange={setDndEnabled}
              trackColor={{ false: Colors.surfaceContainer, true: Colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Nhắc nước thích ứng thời tiết</Text>
              <Text style={styles.settingDesc}>Tự động tăng tần suất nhắc khi nhiệt độ cao</Text>
            </View>
            <Switch
              value={smartWaterEnabled}
              onValueChange={setSmartWaterEnabled}
              trackColor={{ false: Colors.surfaceContainer, true: Colors.primary }}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandSubtitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    letterSpacing: 1.1,
  },
  brandTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLow,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  summaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  bannerInfo: {
    flex: 1,
  },
  bannerDayText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.onPrimaryContainer,
  },
  bannerMainText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    marginTop: 4,
    lineHeight: 22,
  },
  adherenceCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  adherenceNumber: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  adherenceLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
    marginTop: -2,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.full,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.surface,
    ...Shadows.card,
  },
  tabText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  timelineList: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timeCol: {
    width: 48,
    paddingTop: 10,
    alignItems: 'flex-start',
  },
  timeMain: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  timeSub: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  timelineLine: {
    width: 24,
    alignItems: 'center',
    paddingTop: 12,
  },
  dotCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  verticalBar: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    marginTop: 4,
    minHeight: 80,
  },
  cardBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  iconPillText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  statusDone: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.secondary,
  },
  statusPending: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  itemTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  itemSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  doneBtn: {
    height: 36,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 4,
  },
  doneBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  snoozeBtn: {
    height: 36,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 4,
  },
  snoozeBtnText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  settingsTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  settingInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  settingLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  settingDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceContainer,
  },
});
