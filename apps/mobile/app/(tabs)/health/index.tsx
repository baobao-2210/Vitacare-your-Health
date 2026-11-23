import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '../../../src/constants/theme';
import { useLatestVitals, useHealthRecordsList, HealthRecordType } from '../../../src/hooks/useHealthRecords';

export default function HealthDashboardScreen() {
  const router = useRouter();
  const { data: latestVitals, isLoading: isVitalsLoading } = useLatestVitals();
  const { data: recordsData, isLoading: isRecordsLoading } = useHealthRecordsList({ limit: 5 });

  const bpRecord = latestVitals?.[HealthRecordType.BLOOD_PRESSURE];
  const bgRecord = latestVitals?.[HealthRecordType.BLOOD_GLUCOSE];
  const hrRecord = latestVitals?.[HealthRecordType.HEART_RATE];
  const weightRecord = latestVitals?.[HealthRecordType.WEIGHT];

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Thông báo', `Không thể gọi tới số ${phone}`);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.logoBadge}>
            <MaterialIcons name="eco" size={22} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.brandSubtitle}>VITACARE</Text>
            <Text style={styles.brandTitle}>Sức Khỏe</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(tabs)/reminder')}
            accessibilityLabel="Thông báo"
          >
            <MaterialIcons name="notifications-none" size={24} color={Colors.textSecondary} />
            <View style={styles.notiBadge} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileAvatar}
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityLabel="Hồ sơ cá nhân"
          >
            <MaterialIcons name="person" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Medical Summary Hero Card */}
        <View style={styles.heroCard}>
          {/* Watermark Icon */}
          <View style={styles.watermarkContainer}>
            <MaterialIcons name="medical-information" size={88} color="rgba(255,255,255,0.08)" />
          </View>

          {/* Patient Header & Blood Group */}
          <View style={styles.patientRow}>
            <View style={styles.patientInfo}>
              <View style={styles.patientBadgeRow}>
                <Text style={styles.patientCode}>MÃ BỆNH ÁN #VC-8842</Text>
                <View style={styles.dotSeparator} />
                <Text style={styles.verifiedTag}>Xác thực CCCD</Text>
              </View>
              <Text style={styles.patientName}>Nguyễn Văn An</Text>
            </View>

            <View style={styles.bloodTypePill}>
              <Text style={styles.bloodTypeLabel}>NHÓM MÁU</Text>
              <Text style={styles.bloodTypeValue}>O+</Text>
              <Text style={styles.bloodTypeRh}>Rh+ Dương</Text>
            </View>
          </View>

          {/* Allergy & Condition Alerts */}
          <View style={styles.allergySection}>
            <View style={styles.allergyHeader}>
              <MaterialIcons name="warning" size={16} color="#FFDAD6" />
              <Text style={styles.allergyTitle}>DỊ ỨNG THUỐC & THỰC PHẨM:</Text>
            </View>
            <View style={styles.tagWrap}>
              <View style={styles.allergyTag}>
                <View style={styles.pulseDot} />
                <Text style={styles.allergyTagName}>Penicillin</Text>
                <Text style={styles.allergyTagSeverity}>(Vừa)</Text>
              </View>
              <View style={styles.allergyTag}>
                <View style={[styles.pulseDot, { backgroundColor: '#FF897D' }]} />
                <Text style={styles.allergyTagName}>Tôm cua hải sản</Text>
                <Text style={styles.allergyTagSeverity}>(Nhẹ)</Text>
              </View>
            </View>
          </View>

          {/* Chronic Condition & Emergency Contact Row */}
          <View style={styles.chronicCard}>
            <View style={styles.chronicRow}>
              <View style={styles.chronicLabelBox}>
                <MaterialIcons name="coronavirus" size={16} color={Colors.secondaryFixed} />
                <Text style={styles.chronicLabel}>Bệnh nền mạn tính:</Text>
              </View>
              <Text style={styles.chronicValue}>Viêm mũi dị ứng thời tiết</Text>
            </View>

            <View style={styles.dividerLight} />

            <View style={styles.chronicRow}>
              <View style={styles.chronicLabelBox}>
                <MaterialIcons name="contact-phone" size={16} color="#FFDAD6" />
                <Text style={styles.chronicLabel}>Khẩn cấp:</Text>
              </View>
              <View style={styles.emergencyActions}>
                <TouchableOpacity
                  style={styles.callLink}
                  onPress={() => handleCall('0912345678')}
                >
                  <Text style={styles.callLinkText}>BS. Tuấn</Text>
                  <MaterialIcons name="call" size={13} color={Colors.secondaryFixed} />
                </TouchableOpacity>
                <Text style={styles.callBullet}>•</Text>
                <TouchableOpacity
                  style={styles.callLink}
                  onPress={() => handleCall('0903123456')}
                >
                  <Text style={styles.callLinkText}>Mẹ</Text>
                  <MaterialIcons name="call" size={13} color={Colors.secondaryFixed} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid (4 Cards) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tác vụ nhanh</Text>
          <Text style={styles.securityTag}>Bảo mật E2EE</Text>
        </View>

        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => Alert.alert('Quét BHYT / CCCD', 'Đang kết nối chip NFC / QR CCCD điện tử.')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: Colors.primaryFixed }]}>
              <MaterialIcons name="qr-code-scanner" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Quét BHYT / CCCD</Text>
            <Text style={styles.actionSubtitle}>Đồng bộ chip điện tử</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/health/add')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: Colors.surfaceVariant }]}>
              <MaterialIcons name="document-scanner" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Tải lên kết quả</Text>
            <Text style={styles.actionSubtitle}>AI OCR bóc tách số</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => Alert.alert('Đặt lịch khám', 'Đang mở danh bạ bác sĩ & bệnh viện liên kết.')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: Colors.secondaryContainer }]}>
              <MaterialIcons name="event-available" size={22} color={Colors.secondary} />
            </View>
            <Text style={styles.actionTitle}>Đặt lịch khám</Text>
            <Text style={styles.actionSubtitle}>Chọn bác sĩ & giờ hẹn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => Alert.alert('Chia sẻ Hồ sơ', 'Xuất bản tóm tắt y khoa PDF có mật khẩu mã hóa 6 số.')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#D9E6DD' }]}>
              <MaterialIcons name="ios-share" size={22} color="#38443D" />
            </View>
            <Text style={styles.actionTitle}>Chia sẻ Hồ sơ</Text>
            <Text style={styles.actionSubtitle}>Xuất PDF có mã khóa</Text>
          </TouchableOpacity>
        </View>

        {/* Latest Lab Vitals Bar */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="biotech" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Sinh hóa gần nhất</Text>
          </View>
          <Text style={styles.sectionDate}>Hôm nay</Text>
        </View>

        {isVitalsLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.vitalsRow}>
            {/* Metric 1: Glucose */}
            <TouchableOpacity
              style={styles.vitalMiniCard}
              onPress={() => router.push(bgRecord ? `/health/${bgRecord.id}` as any : '/health/add')}
              activeOpacity={0.8}
            >
              <View style={styles.vitalMiniHeader}>
                <Text style={styles.vitalLabel} numberOfLines={1}>Đường huyết</Text>
                <View style={[styles.statusDot, { backgroundColor: bgRecord ? Colors.secondary : Colors.textMuted }]} />
              </View>
              <View style={styles.vitalValueRow}>
                <Text style={styles.vitalValueText}>
                  {bgRecord?.value ?? '--'}
                </Text>
                <Text style={styles.vitalUnitText}>
                  {bgRecord?.unit ?? 'mg/dL'}
                </Text>
              </View>
              <Text style={[styles.vitalRangeStatus, !bgRecord && { color: Colors.textMuted }]}>
                {bgRecord ? 'Gần nhất' : 'Chưa đo'}
              </Text>
            </TouchableOpacity>

            {/* Metric 2: Blood Pressure */}
            <TouchableOpacity
              style={styles.vitalMiniCard}
              onPress={() => router.push(bpRecord ? `/health/${bpRecord.id}` as any : '/health/add')}
              activeOpacity={0.8}
            >
              <View style={styles.vitalMiniHeader}>
                <Text style={styles.vitalLabel} numberOfLines={1}>Huyết áp</Text>
                <View style={[styles.statusDot, { backgroundColor: bpRecord ? Colors.secondary : Colors.textMuted }]} />
              </View>
              <View style={styles.vitalValueRow}>
                <Text style={styles.vitalValueText}>
                  {bpRecord ? `${bpRecord.value}/${bpRecord.secondaryValue || '--'}` : '--/--'}
                </Text>
              </View>
              <Text style={[styles.vitalRangeStatus, !bpRecord && { color: Colors.textMuted }]}>
                {bpRecord ? 'mmHg' : 'Chưa đo'}
              </Text>
            </TouchableOpacity>

            {/* Metric 3: Heart Rate */}
            <TouchableOpacity
              style={styles.vitalMiniCard}
              onPress={() => router.push(hrRecord ? `/health/${hrRecord.id}` as any : '/health/add')}
              activeOpacity={0.8}
            >
              <View style={styles.vitalMiniHeader}>
                <Text style={styles.vitalLabel} numberOfLines={1}>Nhịp tim</Text>
                <View style={[styles.statusDot, { backgroundColor: hrRecord ? Colors.secondary : Colors.textMuted }]} />
              </View>
              <View style={styles.vitalValueRow}>
                <Text style={styles.vitalValueText}>
                  {hrRecord?.value ?? '--'}
                </Text>
                <Text style={styles.vitalUnitText}>bpm</Text>
              </View>
              <Text style={[styles.vitalRangeStatus, !hrRecord && { color: Colors.textMuted }]}>
                {hrRecord ? 'Đo gần nhất' : 'Chưa đo'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* View All Vitals Button */}
        <TouchableOpacity
          style={styles.viewAllVitalsBtn}
          onPress={() => router.push('/health/history')}
          activeOpacity={0.8}
        >
          <Text style={styles.viewAllVitalsText}>Xem toàn bộ danh mục hồ sơ xét nghiệm</Text>
          <MaterialIcons name="arrow-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>

        {/* Upcoming Medical Appointments */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lịch hẹn sắp tới</Text>
          <View style={styles.urgentPill}>
            <View style={styles.pingDot} />
            <Text style={styles.urgentText}>Trong 3 ngày</Text>
          </View>
        </View>

        <View style={styles.appointmentCard}>
          <View style={styles.appointmentTopRow}>
            <View style={styles.doctorAvatarBox}>
              <MaterialIcons name="medical-services" size={26} color={Colors.primary} />
            </View>
            <View style={styles.appointmentDetail}>
              <View style={styles.appointmentMeta}>
                <Text style={styles.appointmentCategory}>NHA KHOA ĐỊNH KỲ</Text>
                <Text style={styles.appointmentTime}>09:30</Text>
              </View>
              <Text style={styles.appointmentMainTitle}>Khám Răng định kỳ 6 tháng</Text>
              <Text style={styles.appointmentDoctor}>ThS.BS Nguyễn Hoàng Nam</Text>
            </View>
          </View>

          <View style={styles.appointmentLocBox}>
            <View style={styles.locRow}>
              <MaterialIcons name="event" size={16} color={Colors.primary} />
              <Text style={styles.locTextPrimary}>Thứ Bảy, 02/11/2024 • 09:30 AM</Text>
            </View>
            <View style={styles.locRow}>
              <MaterialIcons name="location-on" size={16} color={Colors.textSecondary} />
              <Text style={styles.locTextSecondary} numberOfLines={1}>
                Nha khoa Quốc tế Paris - 84 Bà Triệu, Q. Hoàn Kiếm
              </Text>
            </View>
          </View>

          <View style={styles.appointmentBtnRow}>
            <TouchableOpacity
              style={styles.remindCalBtn}
              onPress={() => Alert.alert('Nhắc lịch', 'Đã thêm lịch hẹn vào ứng dụng Lịch của thiết bị!')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="notification-add" size={17} color="#FFFFFF" />
              <Text style={styles.remindCalText}>Nhắc nhở qua Lịch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.directBtn}
              onPress={() => Linking.openURL('https://maps.google.com/?q=84+Ba+Trieu+Ha+Noi')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="directions" size={17} color={Colors.primary} />
              <Text style={styles.directText}>Chỉ đường</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Records Timeline */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hồ sơ khám gần đây</Text>
          <TouchableOpacity onPress={() => router.push('/health/history')}>
            <Text style={styles.seeAllLink}>
              Xem tất cả ({Array.isArray(recordsData) ? recordsData.length : 0})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timelineList}>
          {isRecordsLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
          ) : Array.isArray(recordsData) && recordsData.length > 0 ? (
            recordsData.slice(0, 5).map((rec) => {
              const iconName =
                rec.recordType === HealthRecordType.BLOOD_PRESSURE
                  ? 'favorite'
                  : rec.recordType === HealthRecordType.HEART_RATE
                  ? 'show-chart'
                  : rec.recordType === HealthRecordType.BLOOD_GLUCOSE
                  ? 'bloodtype'
                  : rec.recordType === HealthRecordType.WEIGHT
                  ? 'monitor-weight'
                  : 'medical-services';

              const typeTitle =
                rec.recordType === HealthRecordType.BLOOD_PRESSURE
                  ? 'Huyết áp'
                  : rec.recordType === HealthRecordType.HEART_RATE
                  ? 'Nhịp tim'
                  : rec.recordType === HealthRecordType.BLOOD_GLUCOSE
                  ? 'Đường huyết'
                  : rec.recordType === HealthRecordType.WEIGHT
                  ? 'Cân nặng'
                  : 'Chỉ số đo';

              const formattedVal =
                rec.recordType === HealthRecordType.BLOOD_PRESSURE
                  ? `${rec.value}/${rec.secondaryValue || '--'} ${rec.unit}`
                  : `${rec.value} ${rec.unit}`;

              return (
                <TouchableOpacity
                  key={rec.id}
                  style={styles.timelineCard}
                  onPress={() => router.push(`/health/${rec.id}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.timelineIconBox, { backgroundColor: Colors.primaryFixed }]}>
                    <MaterialIcons name={iconName as any} size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineMetaRow}>
                      <Text style={styles.timelineDate}>
                        {dayjs(rec.recordedAt).format('DD/MM/YYYY • HH:mm')}
                      </Text>
                      <View style={styles.verifiedDocBadge}>
                        <MaterialIcons name="verified" size={12} color={Colors.secondary} />
                        <Text style={styles.verifiedDocText}>{rec.source || 'MANUAL'}</Text>
                      </View>
                    </View>
                    <Text style={styles.timelineTitle} numberOfLines={1}>
                      {typeTitle}: {formattedVal}
                    </Text>
                    <Text style={styles.timelineFacility} numberOfLines={1}>
                      {rec.note ? rec.note : 'Ghi nhận đo lường cá nhân'}
                    </Text>
                    <View style={styles.timelineFooter}>
                      <View style={styles.fileInfo}>
                        <MaterialIcons name="touch-app" size={14} color={Colors.primary} />
                        <Text style={styles.fileSizeText}>Xem chi tiết</Text>
                      </View>
                      <View style={styles.openFileBtn}>
                        <Text style={styles.openFileText}>Chi tiết</Text>
                        <MaterialIcons name="chevron-right" size={16} color={Colors.primary} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyRecentCard}>
              <MaterialIcons name="health-and-safety" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyRecentTitle}>Chưa có bản ghi sức khỏe gần đây</Text>
              <Text style={styles.emptyRecentSub}>Chạm vào nút bên dưới để ghi nhận chỉ số đầu tiên</Text>
              <TouchableOpacity
                style={styles.emptyRecentBtn}
                onPress={() => router.push('/health/add')}
              >
                <Text style={styles.emptyRecentBtnText}>+ Ghi nhận chỉ số mới</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Security & HIPAA Compliance Footnote */}
        <View style={styles.securityFooter}>
          <View style={styles.securityIconBox}>
            <MaterialIcons name="enhanced-encryption" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.securityTextBox}>
            <View style={styles.securityTitleRow}>
              <Text style={styles.securityTitle}>Bảo mật Chuẩn Y Tế E2EE • HIPAA</Text>
              <MaterialIcons name="verified-user" size={16} color={Colors.secondary} />
            </View>
            <Text style={styles.securityDesc}>
              Hồ sơ y tế của bạn được mã hóa an toàn 256-bit chuẩn y tế, chỉ bạn và bác sĩ được bạn ủy quyền mới có thể truy cập.
            </Text>
            <View style={styles.securityLinks}>
              <TouchableOpacity onPress={() => Alert.alert('Tiêu chuẩn HIPAA', 'Hệ thống tuân thủ bảo vệ thông tin sức khỏe cá nhân theo chuẩn quốc tế.')}>
                <Text style={styles.securityLinkText}>Tìm hiểu tiêu chuẩn</Text>
              </TouchableOpacity>
              <Text style={styles.callBullet}>•</Text>
              <TouchableOpacity onPress={() => Alert.alert('Quyền truy cập', 'Hiện chỉ có thiết bị của bạn được giải mã dữ liệu y tế.')}>
                <Text style={styles.securityLinkTextDim}>Quản lý quyền</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom spacing for bottom bar & FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/health/add')}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={22} color="#FFFFFF" />
        <Text style={styles.fabText}>Thêm hồ sơ mới</Text>
      </TouchableOpacity>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notiBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  profileAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  heroCard: {
    borderRadius: 20,
    backgroundColor: Colors.primaryContainer,
    padding: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.card,
  },
  watermarkContainer: {
    position: 'absolute',
    right: -10,
    top: -10,
    pointerEvents: 'none',
  },
  patientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  patientInfo: {
    flex: 1,
  },
  patientBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  patientCode: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.onPrimaryContainer,
    letterSpacing: 0.8,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.secondaryFixed,
  },
  verifiedTag: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.85)',
  },
  patientName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    marginTop: 2,
  },
  bloodTypePill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  bloodTypeLabel: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.secondaryFixed,
    letterSpacing: 0.6,
  },
  bloodTypeValue: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    lineHeight: 28,
  },
  bloodTypeRh: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.75)',
  },
  allergySection: {
    marginTop: Spacing.md,
    zIndex: 1,
  },
  allergyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  allergyTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.surfaceContainerLow,
    letterSpacing: 0.5,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  allergyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.error,
  },
  allergyTagName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#93000A',
  },
  allergyTagSeverity: {
    fontSize: FontSize.xs,
    color: '#93000A',
    opacity: 0.8,
  },
  chronicCard: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    gap: 6,
    zIndex: 1,
  },
  chronicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chronicLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chronicLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.85)',
  },
  chronicValue: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  dividerLight: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  emergencyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  callLinkText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.secondaryFixed,
  },
  callBullet: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: FontSize.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  securityTag: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  sectionDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  seeAllLink: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  actionSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  vitalMiniCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    ...Shadows.card,
  },
  vitalMiniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  vitalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginTop: 4,
  },
  vitalValueText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  vitalUnitText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  vitalRangeStatus: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  viewAllVitalsBtn: {
    backgroundColor: Colors.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  viewAllVitalsText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  urgentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  pingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  appointmentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  appointmentTopRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  doctorAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentDetail: {
    flex: 1,
  },
  appointmentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentCategory: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
    letterSpacing: 0.6,
  },
  appointmentTime: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  appointmentMainTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: 2,
  },
  appointmentDoctor: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  appointmentLocBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 4,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locTextPrimary: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  locTextSecondary: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  appointmentBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  remindCalBtn: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  remindCalText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  directBtn: {
    paddingHorizontal: 14,
    height: 40,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  directText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  timelineList: {
    gap: Spacing.sm,
  },
  timelineCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  timelineIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  verifiedDocBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  verifiedDocText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
  },
  statusBadgeGrey: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusBadgeGreyText: {
    fontSize: 9,
    color: Colors.textSecondary,
  },
  qrBadge: {
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  qrBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  timelineTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: 2,
  },
  timelineFacility: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timelineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainer,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fileSizeText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  openFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openFileText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  securityFooter: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  securityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTextBox: {
    flex: 1,
  },
  securityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  securityTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  securityDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  securityLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  securityLinkText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  securityLinkTextDim: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: 24,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 18,
    height: 52,
    borderRadius: 26,
    gap: 8,
    ...Shadows.elevated,
  },
  fabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  emptyRecentCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
    marginVertical: Spacing.sm,
  },
  emptyRecentTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  emptyRecentSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  emptyRecentBtn: {
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  emptyRecentBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
});
