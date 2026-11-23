import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '../../../src/constants/theme';
import { useAuthStore } from '../../../src/stores/auth.store';
import { api } from '../../../src/lib/api';
import { calculateBmi } from '../../../src/utils/bmi';
import { biometricService } from '../../../src/services/biometric.service';
import { Gender } from '../../../src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, healthProfile, bmiAnalysis, isAuthenticated, isDemoMode, logout, updateProfileState, fetchProfile } = useAuthStore();

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(true);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState<Gender>('MALE');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Load biometric preference and device status
  useEffect(() => {
    biometricService.getStatus().then((status) => {
      setHasBiometricHardware(status.hasHardware && status.isEnrolled);
      setBiometricEnabled(status.isEnabledByUser);
    });

    // Refresh profile on mount if not in demo mode and authenticated
    if (!isDemoMode && isAuthenticated) {
      fetchProfile().catch(() => {});
    }
  }, [isDemoMode, isAuthenticated]);

  // Derived patient code from user id
  const patientCode = useMemo(() => {
    if (!user?.id) return '#VC-DEMO';
    const cleanId = user.id.replace(/-/g, '').slice(0, 4).toUpperCase();
    return `#VC-${cleanId}`;
  }, [user?.id]);

  // Derived age from DOB
  const calculatedAge = useMemo(() => {
    if (!healthProfile?.dateOfBirth) return null;
    const diff = dayjs().diff(dayjs(healthProfile.dateOfBirth), 'year');
    return isNaN(diff) || diff < 0 ? null : diff;
  }, [healthProfile?.dateOfBirth]);

  // Dynamic BMI
  const currentBmi = useMemo(() => {
    if (bmiAnalysis) return bmiAnalysis;
    return calculateBmi(healthProfile?.heightCm, healthProfile?.weightKg);
  }, [bmiAnalysis, healthProfile?.heightCm, healthProfile?.weightKg]);

  const handleToggleBiometric = async (value: boolean) => {
    if (value && !hasBiometricHardware) {
      Alert.alert(
        'Sinh trắc học không khả dụng',
        'Thiết bị chưa hỗ trợ hoặc chưa đăng ký vân tay / Face ID trong cài đặt máy.',
      );
      setBiometricEnabled(false);
      return;
    }

    const success = await biometricService.setEnabled(value);
    if (success) {
      setBiometricEnabled(value);
    } else {
      setBiometricEnabled(!value);
    }
  };

  const openEditModal = () => {
    setEditFullName(user?.fullName || '');
    setEditDob(healthProfile?.dateOfBirth ? dayjs(healthProfile.dateOfBirth).format('YYYY-MM-DD') : '');
    setEditGender(healthProfile?.gender || 'MALE');
    setEditHeight(healthProfile?.heightCm ? String(healthProfile.heightCm) : '');
    setEditWeight(healthProfile?.weightKg ? String(healthProfile.weightKg) : '');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setEditError(null);

    // Validation
    const trimmedName = editFullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setEditError('Họ và tên phải có ít nhất 2 ký tự.');
      return;
    }

    let parsedHeight: number | undefined;
    if (editHeight.trim()) {
      parsedHeight = parseFloat(editHeight.trim());
      if (isNaN(parsedHeight) || parsedHeight < 30 || parsedHeight > 250) {
        setEditError('Chiều cao phải là số hợp lệ từ 30 cm đến 250 cm.');
        return;
      }
    }

    let parsedWeight: number | undefined;
    if (editWeight.trim()) {
      parsedWeight = parseFloat(editWeight.trim());
      if (isNaN(parsedWeight) || parsedWeight < 2 || parsedWeight > 300) {
        setEditError('Cân nặng phải là số hợp lệ từ 2 kg đến 300 kg.');
        return;
      }
    }

    let formattedDob: string | undefined;
    if (editDob.trim()) {
      const parsedDate = dayjs(editDob.trim(), 'YYYY-MM-DD', true);
      if (!parsedDate.isValid() || parsedDate.isAfter(dayjs())) {
        setEditError('Ngày sinh không hợp lệ hoặc ở tương lai (Định dạng YYYY-MM-DD).');
        return;
      }
      formattedDob = editDob.trim();
    }

    try {
      setIsSaving(true);

      if (isDemoMode) {
        // Chế độ demo: lưu cục bộ trong Zustand store
        updateProfileState(
          { fullName: trimmedName },
          {
            heightCm: parsedHeight ?? null,
            weightKg: parsedWeight ?? null,
            gender: editGender,
            dateOfBirth: formattedDob ?? null,
          },
        );
        setIsEditModalOpen(false);
        Alert.alert(
          'Đã cập nhật (Demo)',
          'Hồ sơ của bạn đã được cập nhật cục bộ trên thiết bị trong chế độ Dùng thử.',
        );
        return;
      }

      // Gửi request thực tế lên Backend API
      const patchData = {
        fullName: trimmedName,
        ...(formattedDob !== undefined && { dateOfBirth: formattedDob }),
        ...(parsedHeight !== undefined && { heightCm: parsedHeight }),
        ...(parsedWeight !== undefined && { weightKg: parsedWeight }),
        gender: editGender,
      };

      const res = await api.patch('/profile', patchData);
      const payload = res.data?.data || res.data;

      if (payload?.user || payload?.healthProfile) {
        updateProfileState(payload.user || {}, payload.healthProfile || {});
      }

      setIsEditModalOpen(false);
      Alert.alert('Thành công', 'Hồ sơ sức khỏe của bạn đã được lưu an toàn lên hệ thống.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể cập nhật hồ sơ.';
      setEditError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản VitaCare?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (err) {
              console.warn('[Profile] Logout error:', err);
            } finally {
              router.replace('/(auth)/login');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* App Bar Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.logoBadge}>
            <MaterialIcons name="person" size={22} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.brandSubtitle}>VITACARE</Text>
            <Text style={styles.brandTitle}>Hồ Sơ Cá Nhân</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={openEditModal}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="edit" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Patient Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {(user?.fullName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity style={styles.cameraBadge} onPress={openEditModal}>
                <MaterialIcons name="edit" size={13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileMainInfo}>
              <View style={styles.verifiedRow}>
                <Text style={styles.patientCode}>{patientCode}</Text>
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={12} color={Colors.secondary} />
                  <Text style={styles.verifiedText}>
                    {isDemoMode ? 'Bản Dùng Thử' : 'Đã xác thực HL7'}
                  </Text>
                </View>
              </View>

              <Text style={styles.userName}>{user?.fullName || 'Người dùng VitaCare'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@vitacare.vn'}</Text>

              <View style={styles.tagsRow}>
                <View style={styles.miniPill}>
                  <Text style={styles.miniPillLabel}>Giới tính: </Text>
                  <Text style={styles.miniPillVal}>
                    {healthProfile?.gender === 'FEMALE' ? 'Nữ' : 'Nam'}
                  </Text>
                </View>

                {calculatedAge !== null ? (
                  <View style={styles.miniPill}>
                    <Text style={styles.miniPillLabel}>Tuổi: </Text>
                    <Text style={styles.miniPillVal}>{calculatedAge}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Quick Edit Action Bar */}
          <TouchableOpacity style={styles.editProfileBannerBtn} onPress={openEditModal} activeOpacity={0.85}>
            <MaterialIcons name="tune" size={16} color={Colors.primary} />
            <Text style={styles.editProfileBannerText}>Chỉnh sửa thông tin thể chất</Text>
            <MaterialIcons name="chevron-right" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Biometrics Bento (4 Tiles) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chỉ số sinh trắc học</Text>
          <TouchableOpacity onPress={openEditModal}>
            <Text style={styles.editLink}>Cập nhật</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bentoGrid}>
          {/* Height */}
          <View style={styles.bentoTile}>
            <View style={[styles.tileIconBox, { backgroundColor: Colors.primaryFixed }]}>
              <MaterialIcons name="straighten" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.tileLabel}>Chiều cao</Text>
            <View style={styles.rowAlign}>
              <Text style={styles.tileValue}>{healthProfile?.heightCm ?? '--'}</Text>
              <Text style={styles.tileUnit}>cm</Text>
            </View>
          </View>

          {/* Weight */}
          <View style={styles.bentoTile}>
            <View style={[styles.tileIconBox, { backgroundColor: Colors.secondaryFixed }]}>
              <MaterialIcons name="monitor-weight" size={20} color={Colors.secondary} />
            </View>
            <Text style={styles.tileLabel}>Cân nặng</Text>
            <View style={styles.rowAlign}>
              <Text style={styles.tileValue}>{healthProfile?.weightKg ?? '--'}</Text>
              <Text style={styles.tileUnit}>kg</Text>
            </View>
          </View>

          {/* BMI */}
          <View style={styles.bentoTile}>
            <View style={[styles.tileIconBox, { backgroundColor: '#FEF3C7' }]}>
              <MaterialIcons name="accessibility" size={20} color="#B45309" />
            </View>
            <Text style={styles.tileLabel}>Chỉ số BMI</Text>
            <View style={styles.rowAlign}>
              <Text style={styles.tileValue}>{currentBmi?.bmi ?? '--'}</Text>
              <Text style={[styles.tileUnit, { color: currentBmi?.categoryColor || Colors.secondary, fontWeight: '700' }]}>
                {currentBmi?.categoryText || 'Chưa rõ'}
              </Text>
            </View>
          </View>

          {/* Age */}
          <View style={styles.bentoTile}>
            <View style={[styles.tileIconBox, { backgroundColor: '#EDE9FE' }]}>
              <MaterialIcons name="cake" size={20} color="#6D28D9" />
            </View>
            <Text style={styles.tileLabel}>Tuổi sinh học</Text>
            <View style={styles.rowAlign}>
              <Text style={styles.tileValue}>{calculatedAge ?? '--'}</Text>
              <Text style={styles.tileUnit}>tuổi</Text>
            </View>
          </View>
        </View>

        {/* Health Goals Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mục tiêu sức khỏe hàng ngày</Text>
        </View>

        <View style={styles.goalsCard}>
          <View style={styles.goalRow}>
            <View style={styles.goalLeft}>
              <View style={[styles.goalIcon, { backgroundColor: Colors.secondaryFixed }]}>
                <MaterialIcons name="local-drink" size={18} color={Colors.secondary} />
              </View>
              <Text style={styles.goalName}>Nước uống</Text>
            </View>
            <Text style={styles.goalTarget}>2,000 ml / ngày</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.goalRow}>
            <View style={styles.goalLeft}>
              <View style={[styles.goalIcon, { backgroundColor: Colors.primaryFixed }]}>
                <MaterialIcons name="directions-walk" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.goalName}>Vận động</Text>
            </View>
            <Text style={styles.goalTarget}>8,000 bước / ngày</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.goalRow}>
            <View style={styles.goalLeft}>
              <View style={[styles.goalIcon, { backgroundColor: '#EEF2FF' }]}>
                <MaterialIcons name="bedtime" size={18} color="#4338CA" />
              </View>
              <Text style={styles.goalName}>Giấc ngủ</Text>
            </View>
            <Text style={styles.goalTarget}>8.0 giờ / đêm</Text>
          </View>
        </View>

        {/* Security & Settings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bảo mật & Quyền riêng tư</Text>
        </View>

        <View style={styles.menuCard}>
          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <MaterialIcons name="fingerprint" size={22} color={Colors.primary} />
              <View>
                <Text style={styles.menuTitle}>Khóa vân tay / Face ID</Text>
                <Text style={styles.menuSubtitle}>
                  {hasBiometricHardware
                    ? 'Bảo vệ dữ liệu y tế mỗi khi mở ứng dụng'
                    : 'Thiết bị không khả dụng'}
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              disabled={!hasBiometricHardware}
              trackColor={{ false: Colors.surfaceContainer, true: Colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <MaterialIcons name="cloud-sync" size={22} color={Colors.secondary} />
              <View>
                <Text style={styles.menuTitle}>Đồng bộ đám mây bảo mật</Text>
                <Text style={styles.menuSubtitle}>Mã hóa E2EE và lưu trữ an toàn</Text>
              </View>
            </View>
            <Switch
              value={cloudSyncEnabled}
              onValueChange={setCloudSyncEnabled}
              trackColor={{ false: Colors.surfaceContainer, true: Colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('Đổi mật khẩu', 'Vui lòng kiểm tra email của bạn để nhận liên kết đổi mật khẩu.')}
          >
            <View style={styles.menuLeft}>
              <MaterialIcons name="lock-reset" size={22} color={Colors.textSecondary} />
              <Text style={styles.menuTitle}>Đổi mật khẩu tài khoản</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>VitaCare Mobile v2.1.0 • Chuẩn Y Tế E2EE HL7</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cập Nhật Hồ Sơ Sức Khỏe</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {editError ? (
              <View style={styles.modalErrorBanner}>
                <MaterialIcons name="error-outline" size={16} color="#DC2626" />
                <Text style={styles.modalErrorText}>{editError}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Full Name */}
              <Text style={styles.modalInputLabel}>Họ và tên *</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalTextInput}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Nhập họ và tên..."
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* DOB */}
              <Text style={[styles.modalInputLabel, { marginTop: Spacing.sm }]}>Ngày sinh (YYYY-MM-DD)</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalTextInput}
                  value={editDob}
                  onChangeText={setEditDob}
                  placeholder="Ví dụ: 1995-10-20"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={10}
                />
              </View>

              {/* Gender Selector */}
              <Text style={[styles.modalInputLabel, { marginTop: Spacing.sm }]}>Giới tính</Text>
              <View style={styles.genderRow}>
                {(['MALE', 'FEMALE', 'OTHER'] as Gender[]).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderOption,
                      editGender === g && styles.genderOptionSelected,
                    ]}
                    onPress={() => setEditGender(g)}
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        editGender === g && styles.genderOptionTextSelected,
                      ]}
                    >
                      {g === 'MALE' ? 'Nam' : g === 'FEMALE' ? 'Nữ' : 'Khác'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Height & Weight Row */}
              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalInputLabel, { marginTop: Spacing.sm }]}>Chiều cao (cm)</Text>
                  <View style={styles.modalInputWrapper}>
                    <TextInput
                      style={styles.modalTextInput}
                      value={editHeight}
                      onChangeText={setEditHeight}
                      placeholder="172.5"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalInputLabel, { marginTop: Spacing.sm }]}>Cân nặng (kg)</Text>
                  <View style={styles.modalInputWrapper}>
                    <TextInput
                      style={styles.modalTextInput}
                      value={editWeight}
                      onChangeText={setEditWeight}
                      placeholder="68.0"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.bmiPreviewNote}>
                * Chỉ số BMI và phân loại thể trạng sẽ tự động được tính toán lại sau khi lưu.
              </Text>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsEditModalOpen(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelBtnText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Lưu Thay Đổi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  settingsBtn: {
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
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
  },
  profileTopRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileMainInfo: {
    flex: 1,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patientCode: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
  },
  userName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: 2,
  },
  userEmail: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  miniPillLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  miniPillVal: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  editProfileBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryFixed,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
  },
  editProfileBannerText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    flex: 1,
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  editLink: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  bentoTile: {
    width: '48%',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 4,
    ...Shadows.card,
  },
  tileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tileLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  tileValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  tileUnit: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  goalsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.card,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  goalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  goalTarget: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceContainer,
    marginVertical: Spacing.xs,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  menuTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  menuSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  logoutText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.error,
  },
  versionText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  modalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  modalErrorText: {
    fontSize: 11,
    color: '#DC2626',
    flex: 1,
  },
  modalInputLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  modalInputWrapper: {
    height: 44,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  modalTextInput: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderOption: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  genderOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFixed,
  },
  genderOptionText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bmiPreviewNote: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 2,
    height: 46,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  modalSaveBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
});
