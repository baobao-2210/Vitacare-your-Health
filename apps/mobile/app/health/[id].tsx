import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '../../src/constants/theme';
import {
  useHealthRecordDetail,
  useUpdateHealthRecord,
  useDeleteHealthRecord,
  HealthRecordType,
} from '../../src/hooks/useHealthRecords';

export default function HealthRecordDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: record, isLoading, error } = useHealthRecordDetail(id || '');
  const updateMutation = useUpdateHealthRecord();
  const deleteMutation = useDeleteHealthRecord();

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [editSecondaryValue, setEditSecondaryValue] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const openEditModal = () => {
    if (!record) return;
    setEditValue(record.value.toString());
    setEditSecondaryValue(record.secondaryValue ? record.secondaryValue.toString() : '');
    setEditDate(dayjs(record.recordedAt).format('YYYY-MM-DD HH:mm'));
    setEditNote(record.note || '');
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!record) return;
    setEditError(null);

    const parsedDate = dayjs(editDate);
    if (!parsedDate.isValid()) {
      setEditError('Thời gian đo không hợp lệ.');
      return;
    }
    if (parsedDate.isAfter(dayjs())) {
      setEditError('Thời gian đo không được vượt quá hiện tại.');
      return;
    }

    const numVal = parseFloat(editValue);
    if (isNaN(numVal) || numVal <= 0) {
      setEditError('Vui lòng nhập giá trị đo hợp lệ lớn hơn 0.');
      return;
    }

    let numSecVal: number | undefined = undefined;
    if (record.recordType === HealthRecordType.BLOOD_PRESSURE) {
      const dia = parseFloat(editSecondaryValue);
      if (isNaN(dia) || dia <= 0) {
        setEditError('Vui lòng nhập cả huyết áp tâm trương.');
        return;
      }
      if (numVal <= dia) {
        setEditError('Tâm thu phải lớn hơn tâm trương.');
        return;
      }
      numSecVal = dia;
    }

    try {
      await updateMutation.mutateAsync({
        id: record.id,
        value: numVal,
        secondaryValue: numSecVal,
        recordedAt: parsedDate.toISOString(),
        note: editNote.trim() || undefined,
      });

      setIsEditOpen(false);
      Alert.alert('Thành công', 'Bản ghi chỉ số đã được cập nhật.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể cập nhật bản ghi.';
      setEditError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleDelete = () => {
    if (!record) return;

    Alert.alert(
      'Xác nhận xóa bản ghi',
      'Bạn có chắc chắn muốn xóa bản ghi chỉ số đo này khỏi hồ sơ sức khỏe không? Thao tác này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(record.id);
              Alert.alert('Đã xóa', 'Bản ghi chỉ số đã được xóa thành công.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              const msg = err?.response?.data?.message || err?.message || 'Không thể xóa bản ghi.';
              Alert.alert('Lỗi', typeof msg === 'string' ? msg : 'Xóa thất bại.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải chi tiết chỉ số...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !record) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi Tiết Chỉ Số</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>Không tìm thấy bản ghi</Text>
          <Text style={styles.errorSubtitle}>Bản ghi có thể đã bị xóa hoặc bạn không có quyền truy cập.</Text>
          <TouchableOpacity style={styles.backActionBtn} onPress={() => router.back()}>
            <Text style={styles.backActionText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getRecordMeta = () => {
    switch (record.recordType) {
      case HealthRecordType.BLOOD_PRESSURE:
        return {
          title: 'Huyết Áp Đo Được',
          icon: 'favorite',
          color: '#DC2626',
          bg: '#FEE2E2',
          targetRange: 'Mục tiêu: 90/60 - 120/80 mmHg',
          displayVal: `${record.value} / ${record.secondaryValue || '--'}`,
          unit: 'mmHg',
        };
      case HealthRecordType.HEART_RATE:
        return {
          title: 'Nhịp Tim Lúc Nghỉ',
          icon: 'show-chart',
          color: '#EA580C',
          bg: '#FFEDD5',
          targetRange: 'Bình thường: 60 - 100 bpm',
          displayVal: `${record.value}`,
          unit: 'bpm',
        };
      case HealthRecordType.BLOOD_GLUCOSE:
        return {
          title: 'Chỉ Số Đường Huyết',
          icon: 'bloodtype',
          color: '#7C3AED',
          bg: '#EDE9FE',
          targetRange: record.unit === 'mg/dL' ? 'Mục tiêu lúc đói: 70 - 130 mg/dL' : 'Mục tiêu lúc đói: 3.9 - 7.2 mmol/L',
          displayVal: `${record.value}`,
          unit: record.unit,
        };
      case HealthRecordType.WEIGHT:
        return {
          title: 'Cân Nặng Cơ Thể',
          icon: 'monitor-weight',
          color: Colors.primary,
          bg: Colors.primaryFixed,
          targetRange: 'Theo dõi chỉ số khối cơ thể (BMI)',
          displayVal: `${record.value}`,
          unit: 'kg',
        };
      default:
        return {
          title: 'Chỉ Số Sức Khỏe',
          icon: 'medical-services',
          color: Colors.secondary,
          bg: Colors.secondaryFixed,
          targetRange: 'Theo dõi chỉ số cá nhân',
          displayVal: `${record.value}`,
          unit: record.unit,
        };
    }
  };

  const meta = getRecordMeta();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* App Bar Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi Tiết Chỉ Số Đo</Text>
        <TouchableOpacity style={styles.editHeaderBtn} onPress={openEditModal}>
          <MaterialIcons name="edit" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Vital Card */}
        <View style={styles.mainVitalCard}>
          <View style={styles.cardTopRow}>
            <View style={[styles.vitalIconBox, { backgroundColor: meta.bg }]}>
              <MaterialIcons name={meta.icon as any} size={28} color={meta.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vitalCategoryTitle}>{meta.title}</Text>
              <Text style={styles.vitalMeasuredTime}>
                {dayjs(record.recordedAt).format('DD/MM/YYYY • HH:mm')}
              </Text>
            </View>
            <View style={styles.sourcePill}>
              <MaterialIcons name="edit" size={11} color={Colors.primary} />
              <Text style={styles.sourcePillText}>{record.source || 'MANUAL'}</Text>
            </View>
          </View>

          {/* Large Vital Value */}
          <View style={styles.largeValueBox}>
            <Text style={styles.largeValueText}>{meta.displayVal}</Text>
            <Text style={styles.largeUnitText}>{meta.unit}</Text>
          </View>

          {/* Reference Target Range */}
          <View style={styles.referenceRangeBox}>
            <MaterialIcons name="verified" size={16} color={Colors.secondary} />
            <Text style={styles.referenceRangeText}>{meta.targetRange}</Text>
          </View>
        </View>

        {/* Note / Context Details */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionHeaderTitle}>Ngữ cảnh & Lời dặn</Text>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nguồn dữ liệu:</Text>
            <Text style={styles.infoValue}>
              {record.source === 'MANUAL' ? 'Nhập tay cá nhân (Manual Entry)' : record.source}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày giờ ghi nhận:</Text>
            <Text style={styles.infoValue}>
              {dayjs(record.recordedAt).format('dddd, DD/MM/YYYY Lúc HH:mm')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ghi chú y khoa:</Text>
            <Text style={styles.infoValueNote}>
              {record.note ? record.note : 'Không có ghi chú thêm.'}
            </Text>
          </View>
        </View>

        {/* Disclaimer Card */}
        <View style={styles.disclaimerCard}>
          <MaterialIcons name="shield" size={18} color={Colors.primary} />
          <Text style={styles.disclaimerCardText}>
            Hồ sơ y tế VitaCare được bảo vệ theo nguyên tắc riêng tư của người dùng. Không tự ý dùng một chỉ số đơn lẻ để tự chẩn đoán bệnh.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editActionBtn} onPress={openEditModal} activeOpacity={0.8}>
            <MaterialIcons name="edit" size={18} color={Colors.primary} />
            <Text style={styles.editActionText}>Chỉnh sửa số đo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteActionBtn} onPress={handleDelete} activeOpacity={0.8}>
            <MaterialIcons name="delete-outline" size={18} color="#DC2626" />
            <Text style={styles.deleteActionText}>Xóa bản ghi</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Record Modal */}
      <Modal visible={isEditOpen} animationType="slide" transparent={true} onRequestClose={() => setIsEditOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh Sửa Bản Ghi Chỉ Số</Text>
              <TouchableOpacity onPress={() => setIsEditOpen(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {editError ? (
              <View style={styles.modalErrorBanner}>
                <MaterialIcons name="error-outline" size={16} color="#DC2626" />
                <Text style={styles.modalErrorText}>{editError}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Value Input */}
              {record.recordType === HealthRecordType.BLOOD_PRESSURE ? (
                <View style={{ gap: Spacing.sm }}>
                  <Text style={styles.modalInputLabel}>Tâm thu (Systolic, mmHg) *</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType="number-pad"
                    placeholder="120"
                    placeholderTextColor={Colors.textMuted}
                  />

                  <Text style={styles.modalInputLabel}>Tâm trương (Diastolic, mmHg) *</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    value={editSecondaryValue}
                    onChangeText={setEditSecondaryValue}
                    keyboardType="number-pad"
                    placeholder="80"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              ) : (
                <View>
                  <Text style={styles.modalInputLabel}>Giá trị đo ({record.unit}) *</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType="decimal-pad"
                    placeholder="Giá trị"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              )}

              {/* Date Input */}
              <Text style={[styles.modalInputLabel, { marginTop: Spacing.sm }]}>Thời gian đo (YYYY-MM-DD HH:mm) *</Text>
              <TextInput
                style={styles.modalTextInput}
                value={editDate}
                onChangeText={setEditDate}
                placeholder="YYYY-MM-DD HH:mm"
                placeholderTextColor={Colors.textMuted}
              />

              {/* Note Input */}
              <Text style={[styles.modalInputLabel, { marginTop: Spacing.sm }]}>Ghi chú</Text>
              <TextInput
                style={[styles.modalTextInput, { minHeight: 60, textAlignVertical: 'top' }]}
                value={editNote}
                onChangeText={setEditNote}
                multiline
                numberOfLines={3}
                placeholder="Ghi chú thêm..."
                placeholderTextColor={Colors.textMuted}
              />

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleUpdate}
                disabled={updateMutation.isPending}
                activeOpacity={0.85}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Cập Nhật Bản Ghi</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  editHeaderBtn: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  mainVitalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  vitalIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalCategoryTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  vitalMeasuredTime: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  sourcePillText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  largeValueBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
    gap: 8,
  },
  largeValueText: {
    fontSize: 48,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  largeUnitText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  referenceRangeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.lg,
  },
  referenceRangeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.secondary,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.card,
  },
  sectionHeaderTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceContainer,
    marginVertical: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    textAlign: 'right',
  },
  infoValueNote: {
    fontSize: FontSize.xs,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  disclaimerCardText: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  editActionBtn: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.primaryFixed,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  editActionText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  deleteActionBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#FEE2E2',
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteActionText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#DC2626',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  errorTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  errorSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  backActionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  backActionText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
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
    maxHeight: '80%',
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
  modalTextInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    fontSize: FontSize.xs,
    color: Colors.text,
  },
  modalSaveBtn: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  modalSaveBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
});
