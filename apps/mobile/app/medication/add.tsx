import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Shadows } from '../../src/constants/theme';
import { useCreateMedication } from '../../src/hooks/useMedication';
import { MedicationFrequency } from '../../src/types';

const FORMS = [
  { id: 'tablet', label: 'Viên nén', icon: 'circle-outline' },
  { id: 'capsule', label: 'Viên nang', icon: 'pill' },
  { id: 'syrup', label: 'Siro / Nước', icon: 'water-outline' },
  { id: 'powder', label: 'Gói bột', icon: 'package-variant-closed' },
  { id: 'spray', label: 'Dạng xịt', icon: 'spray' },
  { id: 'cream', label: 'Dạng bôi', icon: 'hand-wash-outline' },
];

const MEAL_TIMINGS = [
  'Trước khi ăn (30p)',
  'Trong bữa ăn',
  'Sau khi ăn no',
  'Bất kỳ thời điểm nào',
];

export default function AddMedicationScreen() {
  const router = useRouter();
  const createMutation = useCreateMedication();

  const [name, setName] = useState('');
  const [selectedForm, setSelectedForm] = useState('capsule');
  const [doseQty, setDoseQty] = useState(1);
  const [unit, setUnit] = useState('Viên');
  const [strength, setStrength] = useState('500 mg');
  const [frequency, setFrequency] = useState<MedicationFrequency>('DAILY');
  const [slots, setSlots] = useState<string[]>(['08:00', '20:00']);
  const [selectedMealTiming, setSelectedMealTiming] = useState('Sau khi ăn no');
  const [note, setNote] = useState('');

  const handleAddSlot = () => {
    if (slots.length < 5) {
      setSlots([...slots, '12:30']);
    }
  };

  const handleRemoveSlot = (index: number) => {
    if (slots.length > 1) {
      setSlots(slots.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên thuốc.');
      return;
    }

    try {
      const dosageLabel = `${doseQty} ${unit} (${strength}) • ${selectedMealTiming}`;
      const schedules = slots.map((time) => ({
        frequency,
        reminderTime: time,
      }));

      await createMutation.mutateAsync({
        name: name.trim(),
        dosageLabel,
        note: note.trim() || undefined,
        schedules,
      });

      router.back();
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo đơn thuốc lúc này. Vui lòng thử lại.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.cancelText}>Hủy</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Thêm Thuốc Mới</Text>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section 1: Basic Info */}
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="pill" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Thông tin cơ bản</Text>
          </View>

          <Text style={styles.inputLabel}>
            Tên thuốc <Text style={{ color: Colors.error }}>*</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="VD: Glucosamine Sulfate, Panadol..."
            placeholderTextColor={Colors.outline}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Dạng thuốc</Text>
          <View style={styles.formsGrid}>
            {FORMS.map((f) => {
              const isSelected = selectedForm === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.formBtn, isSelected && styles.formBtnActive]}
                  onPress={() => setSelectedForm(f.id)}
                >
                  <MaterialCommunityIcons
                    name={f.icon as any}
                    size={22}
                    color={isSelected ? Colors.primary : Colors.onSurfaceVariant}
                  />
                  <Text style={[styles.formBtnLabel, isSelected && styles.formBtnLabelActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 2: Dosage & Unit */}
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="calculator-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Liều lượng & Đơn vị</Text>
          </View>

          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Mỗi lần uống</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setDoseQty((p) => Math.max(1, p - 1))}
                >
                  <Ionicons name="remove" size={18} color={Colors.onSurface} />
                </TouchableOpacity>
                <Text style={styles.stepQty}>{doseQty}</Text>
                <TouchableOpacity
                  style={[styles.stepBtn, { backgroundColor: Colors.primaryContainer }]}
                  onPress={() => setDoseQty((p) => Math.min(20, p + 1))}
                >
                  <Ionicons name="add" size={18} color={Colors.onPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Đơn vị tính</Text>
              <View style={styles.unitsRow}>
                {['Viên', 'Gói', 'ml'].map((u) => {
                  const isSelected = unit === u;
                  return (
                    <TouchableOpacity
                      key={u}
                      style={[styles.unitBtn, isSelected && styles.unitBtnActive]}
                      onPress={() => setUnit(u)}
                    >
                      <Text style={[styles.unitBtnText, isSelected && styles.unitBtnTextActive]}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Hàm lượng hoạt chất</Text>
          <TextInput
            style={styles.textInput}
            placeholder="VD: 500 mg, 1000 IU..."
            placeholderTextColor={Colors.outline}
            value={strength}
            onChangeText={setStrength}
          />
        </View>

        {/* Section 3: Schedule & Meal Timing */}
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Lịch nhắc uống thuốc</Text>
          </View>

          <Text style={styles.inputLabel}>Tần suất</Text>
          <View style={styles.frequencyRow}>
            {[
              { id: 'DAILY' as MedicationFrequency, label: 'Hàng ngày' },
              { id: 'INTERVAL' as MedicationFrequency, label: 'Cách ngày' },
              { id: 'CUSTOM' as MedicationFrequency, label: 'Khi cần' },
            ].map((fq) => {
              const isSelected = frequency === fq.id;
              return (
                <TouchableOpacity
                  key={fq.id}
                  style={[styles.freqBtn, isSelected && styles.freqBtnActive]}
                  onPress={() => setFrequency(fq.id)}
                >
                  <Text style={[styles.freqBtnText, isSelected && styles.freqBtnTextActive]}>
                    {fq.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dose Slots */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Giờ nhắc chi tiết</Text>
          {slots.map((time, idx) => (
            <View key={idx} style={styles.slotRow}>
              <View style={styles.slotLeft}>
                <Ionicons name="alarm-outline" size={18} color={Colors.secondary} />
                <Text style={styles.slotLabel}>Cữ {idx + 1}</Text>
              </View>
              <View style={styles.slotRight}>
                <TextInput
                  style={styles.slotInput}
                  value={time}
                  onChangeText={(val) => {
                    const newSlots = [...slots];
                    newSlots[idx] = val;
                    setSlots(newSlots);
                  }}
                  placeholder="08:00"
                />
                {slots.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeSlotBtn}
                    onPress={() => handleRemoveSlot(idx)}
                  >
                    <Ionicons name="close" size={16} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {slots.length < 4 && (
            <TouchableOpacity style={styles.addSlotBtn} onPress={handleAddSlot}>
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.addSlotText}>Thêm giờ uống trong ngày</Text>
            </TouchableOpacity>
          )}

          {/* Meal Timing */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Thời điểm so với bữa ăn</Text>
          <View style={styles.mealGrid}>
            {MEAL_TIMINGS.map((tm) => {
              const isSelected = selectedMealTiming === tm;
              return (
                <TouchableOpacity
                  key={tm}
                  style={[styles.mealBtn, isSelected && styles.mealBtnActive]}
                  onPress={() => setSelectedMealTiming(tm)}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.mealBtnText, isSelected && styles.mealBtnTextActive]}>
                    {tm}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 4: Notes */}
        <View style={[styles.card, Shadows.card]}>
          <Text style={styles.cardTitle}>Ghi chú thêm</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="VD: Uống với nhiều nước ấm, không nhai nát viên thuốc..."
            placeholderTextColor={Colors.outline}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Bottom CTA */}
        <View style={styles.submitWrap}>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSave}
            disabled={createMutation.isPending}
            activeOpacity={0.9}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color={Colors.onPrimary} />
                <Text style={styles.submitBtnText}>Lưu lịch uống thuốc</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.submitDisclaimer}>
            VitaCare sẽ gửi chuông báo định kỳ theo giờ bạn đã thiết lập
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
  cancelBtn: {
    padding: 6,
  },
  cancelText: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
  },
  headerTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  saveBtn: {
    padding: 6,
  },
  saveText: {
    ...Typography.labelLarge,
    color: Colors.primary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 20,
    padding: 16,
    marginTop: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 16,
  },
  inputLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 14,
    color: Colors.onSurface,
    ...Typography.bodyMedium,
  },
  formsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formBtn: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
  },
  formBtnActive: {
    backgroundColor: Colors.primaryFixed,
  },
  formBtnLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  formBtnLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  stepperRow: {
    height: 48,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepQty: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  unitsRow: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  unitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  unitBtnActive: {
    backgroundColor: Colors.card,
    ...Shadows.card,
  },
  unitBtnText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  unitBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
  },
  freqBtnActive: {
    backgroundColor: Colors.primaryContainer,
  },
  freqBtnText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  freqBtnTextActive: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  slotRow: {
    height: 48,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  slotRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotInput: {
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    minWidth: 64,
    textAlign: 'center',
  },
  removeSlotBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(186, 26, 26, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    marginTop: 4,
  },
  addSlotText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
  },
  mealBtnActive: {
    backgroundColor: Colors.primaryFixed,
  },
  mealBtnText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  mealBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 12,
    color: Colors.onSurface,
    ...Typography.bodyMedium,
    minHeight: 70,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  submitWrap: {
    paddingHorizontal: Spacing.margin,
    marginTop: 20,
  },
  submitBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.card,
  },
  submitBtnText: {
    ...Typography.labelLarge,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  submitDisclaimer: {
    ...Typography.bodySmall,
    color: Colors.outline,
    textAlign: 'center',
    marginTop: 8,
    fontSize: 11,
  },
});

