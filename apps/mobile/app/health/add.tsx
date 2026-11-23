import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '../../src/constants/theme';
import { useCreateHealthRecord, HealthRecordType } from '../../src/hooks/useHealthRecords';

const CATEGORIES = [
  { id: 'bp', label: 'Huyết áp', type: HealthRecordType.BLOOD_PRESSURE, defaultUnit: 'mmHg', icon: 'favorite' },
  { id: 'heart', label: 'Nhịp tim', type: HealthRecordType.HEART_RATE, defaultUnit: 'bpm', icon: 'show-chart' },
  { id: 'blood', label: 'Đường huyết', type: HealthRecordType.BLOOD_GLUCOSE, defaultUnit: 'mg/dL', icon: 'bloodtype' },
  { id: 'weight', label: 'Cân nặng', type: HealthRecordType.WEIGHT, defaultUnit: 'kg', icon: 'monitor-weight' },
  { id: 'other', label: 'Khác', type: HealthRecordType.OTHER, defaultUnit: '', icon: 'medical-services' },
];

const GLUCOSE_CONTEXTS = [
  { id: 'fasting', label: 'Lúc đói (Nhịn ăn ≥ 8h)' },
  { id: 'postprandial', label: 'Sau ăn 2 giờ' },
  { id: 'bedtime', label: 'Trước khi đi ngủ' },
  { id: 'random', label: 'Đo ngẫu nhiên / Bất kỳ' },
];

export default function AddHealthRecordScreen() {
  const router = useRouter();
  const createMutation = useCreateHealthRecord();

  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0]);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('mmHg');
  const [glucoseContext, setGlucoseContext] = useState(GLUCOSE_CONTEXTS[0].id);
  const [glucoseUnit, setGlucoseUnit] = useState<'mg/dL' | 'mmol/L'>('mg/dL');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD HH:mm'));
  const [hospital, setHospital] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSelectCategory = (cat: typeof CATEGORIES[0]) => {
    setSelectedCat(cat);
    setFormError(null);
    if (cat.type === HealthRecordType.BLOOD_PRESSURE) {
      setUnit('mmHg');
    } else if (cat.type === HealthRecordType.HEART_RATE) {
      setUnit('bpm');
    } else if (cat.type === HealthRecordType.BLOOD_GLUCOSE) {
      setUnit(glucoseUnit);
    } else if (cat.type === HealthRecordType.WEIGHT) {
      setUnit('kg');
    } else {
      setUnit('');
    }
  };

  const handleToggleGlucoseUnit = (newUnit: 'mg/dL' | 'mmol/L') => {
    setGlucoseUnit(newUnit);
    setUnit(newUnit);
    if (value) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        if (newUnit === 'mmol/L' && unit === 'mg/dL') {
          setValue((num / 18.0).toFixed(1));
        } else if (newUnit === 'mg/dL' && unit === 'mmol/L') {
          setValue(Math.round(num * 18.0).toString());
        }
      }
    }
  };

  // Clinical physiological evaluation & warning calculation
  const clinicalWarning = useMemo((): { title: string; message: string; color: string } | null => {
    if (selectedCat.type === HealthRecordType.BLOOD_PRESSURE) {
      const sys = parseFloat(systolic);
      const dia = parseFloat(diastolic);
      if (!isNaN(sys) && !isNaN(dia)) {
        if (sys >= 140 || dia >= 90) {
          return {
            title: 'Cảnh báo: Huyết áp ở mức cao',
            message: 'Chỉ số đo vượt ngưỡng bình thường (140/90 mmHg). Hãy nghỉ ngơi 15 phút, tránh căng thẳng và đo lại.',
            color: '#DC2626',
          };
        }
        if (sys < 90 || dia < 60) {
          return {
            title: 'Cảnh báo: Huyết áp ở mức thấp',
            message: 'Chỉ số đo thấp hơn mức khuyến nghị (90/60 mmHg). Hãy bù nước, ăn nhẹ và tránh đứng dậy đột ngột.',
            color: '#D97706',
          };
        }
        if (sys >= 120 && sys < 140) {
          return {
            title: 'Huyết áp tiền tăng nhẹ',
            message: 'Huyết áp tâm thu hơi cao so với mức tối ưu (< 120 mmHg). Cần chú ý giảm muối và vận động đều.',
            color: '#2563EB',
          };
        }
      }
    } else if (selectedCat.type === HealthRecordType.HEART_RATE) {
      const hr = parseFloat(value);
      if (!isNaN(hr)) {
        if (hr > 100) {
          return {
            title: 'Cảnh báo: Nhịp tim nhanh (> 100 bpm)',
            message: 'Nhịp tim lúc nghỉ ngơi đang cao. Hãy ngồi thư giãn, hít thở sâu và tránh dùng chất kích thích.',
            color: '#DC2626',
          };
        }
        if (hr < 55) {
          return {
            title: 'Cảnh báo: Nhịp tim chậm (< 55 bpm)',
            message: 'Nhịp tim đang ở mức chậm. Nếu bạn không phải vận động viên chuyên nghiệp và thấy mệt mỏi, cần theo dõi kỹ.',
            color: '#D97706',
          };
        }
      }
    } else if (selectedCat.type === HealthRecordType.BLOOD_GLUCOSE) {
      const glu = parseFloat(value);
      if (!isNaN(glu)) {
        if (glucoseUnit === 'mg/dL') {
          if (glu < 70) {
            return {
              title: 'Cảnh báo nguy hiểm: Hạ đường huyết (< 70 mg/dL)',
              message: 'Cần bổ sung ngay 15g đường nhanh (nửa ly nước cam hoặc 3 viên kẹo) để tránh hạ đường huyết nghiêm trọng.',
              color: '#DC2626',
            };
          }
          if (glu > 180) {
            return {
              title: 'Cảnh báo: Đường huyết tăng cao (> 180 mg/dL)',
              message: 'Chỉ số đường huyết vượt ngưỡng an toàn sau ăn. Hãy uống đủ nước và kiểm tra lại chế độ ăn uống.',
              color: '#D97706',
            };
          }
        } else {
          if (glu < 3.9) {
            return {
              title: 'Cảnh báo nguy hiểm: Hạ đường huyết (< 3.9 mmol/L)',
              message: 'Cần bổ sung ngay đường nhanh để tránh ngất hoặc hạ đường huyết sâu.',
              color: '#DC2626',
            };
          }
          if (glu > 10.0) {
            return {
              title: 'Cảnh báo: Đường huyết cao (> 10.0 mmol/L)',
              message: 'Chỉ số vượt mức khuyến nghị. Chú ý theo dõi và tham vấn bác sĩ điều trị.',
              color: '#D97706',
            };
          }
        }
      }
    } else if (selectedCat.type === HealthRecordType.WEIGHT) {
      const w = parseFloat(value);
      if (!isNaN(w) && (w < 30 || w > 250)) {
        return {
          title: 'Kiểm tra lại số đo cân nặng',
          message: 'Chỉ số cân nặng có vẻ khác thường so với phạm vi thông thường. Vui lòng xác nhận lại.',
          color: '#D97706',
        };
      }
    }
    return null;
  }, [selectedCat.type, systolic, diastolic, value, glucoseUnit]);

  const handleSave = async () => {
    setFormError(null);

    // Date validation
    const parsedDate = dayjs(date);
    if (!parsedDate.isValid()) {
      setFormError('Thời gian đo không hợp lệ. Vui lòng nhập theo định dạng YYYY-MM-DD HH:mm.');
      return;
    }
    if (parsedDate.isAfter(dayjs())) {
      setFormError('Thời gian đo không được vượt quá thời điểm hiện tại.');
      return;
    }

    let finalValue = 0;
    let finalSecondaryValue: number | undefined = undefined;

    if (selectedCat.type === HealthRecordType.BLOOD_PRESSURE) {
      const sys = parseFloat(systolic);
      const dia = parseFloat(diastolic);

      if (isNaN(sys) || isNaN(dia) || sys <= 0 || dia <= 0) {
        setFormError('Vui lòng nhập đầy đủ cả huyết áp tâm thu và tâm trương (lớn hơn 0).');
        return;
      }
      if (sys <= dia) {
        setFormError('Huyết áp tâm thu (số trên) phải lớn hơn huyết áp tâm trương (số dưới).');
        return;
      }
      if (sys < 50 || sys > 300 || dia < 30 || dia > 200) {
        setFormError('Chỉ số huyết áp nằm ngoài giới hạn sinh học hợp lý (50-300 / 30-200 mmHg).');
        return;
      }

      finalValue = sys;
      finalSecondaryValue = dia;
    } else if (selectedCat.type === HealthRecordType.HEART_RATE) {
      const hr = parseFloat(value);
      if (isNaN(hr) || hr <= 0) {
        setFormError('Vui lòng nhập nhịp tim hợp lệ.');
        return;
      }
      if (hr < 25 || hr > 260) {
        setFormError('Nhịp tim phải nằm trong khoảng sinh lý từ 25 đến 260 bpm.');
        return;
      }
      finalValue = hr;
    } else if (selectedCat.type === HealthRecordType.BLOOD_GLUCOSE) {
      const glu = parseFloat(value);
      if (isNaN(glu) || glu <= 0) {
        setFormError('Vui lòng nhập chỉ số đường huyết hợp lệ.');
        return;
      }
      if (glucoseUnit === 'mmol/L' && (glu < 0.5 || glu > 50)) {
        setFormError('Chỉ số đường huyết (mmol/L) không hợp lý (0.5 - 50 mmol/L).');
        return;
      }
      if (glucoseUnit === 'mg/dL' && (glu < 10 || glu > 900)) {
        setFormError('Chỉ số đường huyết (mg/dL) không hợp lý (10 - 900 mg/dL).');
        return;
      }
      finalValue = glu;
    } else if (selectedCat.type === HealthRecordType.WEIGHT) {
      const w = parseFloat(value);
      if (isNaN(w) || w <= 0) {
        setFormError('Vui lòng nhập cân nặng hợp lệ.');
        return;
      }
      if (w < 10 || w > 350) {
        setFormError('Cân nặng phải nằm trong khoảng hợp lý từ 10 đến 350 kg.');
        return;
      }
      finalValue = w;
    } else {
      const v = parseFloat(value);
      if (isNaN(v) || v <= 0) {
        setFormError('Vui lòng nhập giá trị đo hợp lệ.');
        return;
      }
      finalValue = v;
    }

    // Build medical context note
    let fullNote = notes.trim();
    if (selectedCat.type === HealthRecordType.BLOOD_GLUCOSE) {
      const ctxLabel = GLUCOSE_CONTEXTS.find((c) => c.id === glucoseContext)?.label;
      fullNote = `[Thời điểm: ${ctxLabel}] ${fullNote}`.trim();
    }
    if (hospital.trim()) {
      fullNote = `[Cơ sở: ${hospital.trim()}] ${fullNote}`.trim();
    }

    try {
      await createMutation.mutateAsync({
        recordType: selectedCat.type,
        value: finalValue,
        secondaryValue: finalSecondaryValue,
        unit: unit.trim() || selectedCat.defaultUnit,
        recordedAt: parsedDate.toISOString(),
        note: fullNote || undefined,
        source: 'MANUAL',
      });

      Alert.alert(
        'Đã lưu thành công',
        `Chỉ số ${selectedCat.label} đã được lưu an toàn vào hồ sơ sức khỏe của bạn.`,
        [{ text: 'Xem kết quả', onPress: () => router.replace('/(tabs)/health') }]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể lưu bản ghi sức khỏe.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* App Bar Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ghi Nhận Chỉ Số Sức Khỏe</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Info */}
        <View style={styles.progressBanner}>
          <View style={styles.bannerLeft}>
            <View style={styles.bannerIcon}>
              <MaterialIcons name="edit-note" size={22} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.bannerTitle}>Nhập Chỉ Số Thủ Công</Text>
              <Text style={styles.bannerSubtitle}>Lưu trữ chỉ số đo cá nhân hoặc từ sổ khám</Text>
            </View>
          </View>
          <View style={styles.sourceTag}>
            <Text style={styles.sourceTagText}>MANUAL</Text>
          </View>
        </View>

        {/* Validation Error Banner */}
        {formError ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : null}

        {/* Clinical Warning Banner (Non-blocking) */}
        {clinicalWarning ? (
          <View style={[styles.clinicalWarningBanner, { borderColor: clinicalWarning.color }]}>
            <MaterialIcons name="warning" size={20} color={clinicalWarning.color} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.clinicalWarningTitle, { color: clinicalWarning.color }]}>
                {clinicalWarning.title}
              </Text>
              <Text style={styles.clinicalWarningText}>{clinicalWarning.message}</Text>
            </View>
          </View>
        ) : null}

        {/* Section 1: Category Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardSectionTitle}>Chọn loại chỉ số</Text>
          <Text style={styles.cardSectionSub}>Chạm để chuyển đổi loại đo lường</Text>

          <View style={styles.catChipsWrap}>
            {CATEGORIES.map((cat) => {
              const active = selectedCat.id === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, active && styles.catChipActive]}
                  onPress={() => handleSelectCategory(cat)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={cat.icon as any}
                    size={16}
                    color={active ? '#FFFFFF' : Colors.text}
                  />
                  <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 2: Vital Value Inputs */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardSectionTitle}>Số liệu đo lường *</Text>
          <Text style={styles.cardSectionSub}>
            {selectedCat.type === HealthRecordType.BLOOD_PRESSURE
              ? 'Nhập cả huyết áp tâm thu và tâm trương'
              : `Nhập giá trị đo bằng đơn vị ${unit}`}
          </Text>

          {/* Blood Pressure Dual Input */}
          {selectedCat.type === HealthRecordType.BLOOD_PRESSURE ? (
            <View style={styles.bpGrid}>
              <View style={styles.bpCol}>
                <Text style={styles.inputLabel}>Tâm thu (Số trên) *</Text>
                <View style={styles.measureInputBox}>
                  <TextInput
                    style={styles.measureInput}
                    value={systolic}
                    onChangeText={setSystolic}
                    keyboardType="number-pad"
                    placeholder="120"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <Text style={styles.measureUnitInside}>mmHg</Text>
                </View>
                <Text style={styles.inputHint}>Mục tiêu: 90 - 129</Text>
              </View>

              <View style={styles.bpSeparator}>
                <Text style={styles.bpSeparatorSlash}>/</Text>
              </View>

              <View style={styles.bpCol}>
                <Text style={styles.inputLabel}>Tâm trương (Số dưới) *</Text>
                <View style={styles.measureInputBox}>
                  <TextInput
                    style={styles.measureInput}
                    value={diastolic}
                    onChangeText={setDiastolic}
                    keyboardType="number-pad"
                    placeholder="80"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <Text style={styles.measureUnitInside}>mmHg</Text>
                </View>
                <Text style={styles.inputHint}>Mục tiêu: 60 - 84</Text>
              </View>
            </View>
          ) : (
            <View style={styles.singleMeasureRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Giá trị đo *</Text>
                <View style={styles.measureInputBox}>
                  <TextInput
                    style={styles.measureInput}
                    value={value}
                    onChangeText={setValue}
                    keyboardType="decimal-pad"
                    placeholder={
                      selectedCat.type === HealthRecordType.HEART_RATE
                        ? '72'
                        : selectedCat.type === HealthRecordType.WEIGHT
                        ? '68.5'
                        : selectedCat.type === HealthRecordType.BLOOD_GLUCOSE
                        ? '95'
                        : '0.0'
                    }
                    placeholderTextColor={Colors.textMuted}
                  />
                  <Text style={styles.measureUnitInside}>{unit}</Text>
                </View>
              </View>

              {/* Glucose Unit Toggle */}
              {selectedCat.type === HealthRecordType.BLOOD_GLUCOSE && (
                <View style={styles.unitToggleWrap}>
                  <Text style={styles.inputLabel}>Đơn vị đo</Text>
                  <View style={styles.unitToggleRow}>
                    <TouchableOpacity
                      style={[styles.unitBtn, glucoseUnit === 'mg/dL' && styles.unitBtnActive]}
                      onPress={() => handleToggleGlucoseUnit('mg/dL')}
                    >
                      <Text style={[styles.unitBtnText, glucoseUnit === 'mg/dL' && styles.unitBtnTextActive]}>
                        mg/dL
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.unitBtn, glucoseUnit === 'mmol/L' && styles.unitBtnActive]}
                      onPress={() => handleToggleGlucoseUnit('mmol/L')}
                    >
                      <Text style={[styles.unitBtnText, glucoseUnit === 'mmol/L' && styles.unitBtnTextActive]}>
                        mmol/L
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Glucose Context Chips */}
          {selectedCat.type === HealthRecordType.BLOOD_GLUCOSE && (
            <View style={{ marginTop: Spacing.md }}>
              <Text style={styles.inputLabel}>Thời điểm đo đường huyết</Text>
              <View style={styles.glucoseChipsWrap}>
                {GLUCOSE_CONTEXTS.map((ctx) => {
                  const active = glucoseContext === ctx.id;
                  return (
                    <TouchableOpacity
                      key={ctx.id}
                      style={[styles.ctxChip, active && styles.ctxChipActive]}
                      onPress={() => setGlucoseContext(ctx.id)}
                    >
                      {active && <MaterialIcons name="check" size={13} color="#FFFFFF" />}
                      <Text style={[styles.ctxChipText, active && styles.ctxChipTextActive]}>
                        {ctx.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Measurement Date & Time */}
          <View style={{ marginTop: Spacing.md }}>
            <Text style={styles.inputLabel}>Thời điểm đo (YYYY-MM-DD HH:mm) *</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="access-time" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD HH:mm"
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity
                onPress={() => setDate(dayjs().format('YYYY-MM-DD HH:mm'))}
                style={styles.nowBadge}
              >
                <Text style={styles.nowBadgeText}>Hiện tại</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section 3: Optional Medical Context */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardSectionTitle}>Thông tin bổ sung (Tùy chọn)</Text>
          <Text style={styles.cardSectionSub}>Ghi lại ngữ cảnh để theo dõi sát hơn</Text>

          <Text style={styles.inputLabel}>Cơ sở y tế / Thiết bị đo</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="local-hospital" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              value={hospital}
              onChangeText={setHospital}
              placeholder="VD: Máy đo Omron tại nhà, BV Tâm Anh..."
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <Text style={[styles.inputLabel, { marginTop: Spacing.sm }]}>Ghi chú / Triệu chứng kèm theo</Text>
          <TextInput
            style={styles.notesArea}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholder="VD: Đo sau khi chạy bộ 10 phút, cảm thấy hơi chóng mặt..."
            placeholderTextColor={Colors.textMuted}
          />

          <View style={styles.disclaimerBox}>
            <MaterialIcons name="info-outline" size={15} color={Colors.textSecondary} />
            <Text style={styles.disclaimerText}>
              Lưu ý: Chỉ số sức khỏe chỉ mang tính chất theo dõi cá nhân, không đưa ra kết luận chẩn đoán bệnh học độc lập.
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom CTA Bar */}
      <View style={styles.fixedBottomBar}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSave}
          disabled={createMutation.isPending}
          activeOpacity={0.85}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="save" size={20} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Lưu Bản Ghi Sức Khỏe</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  progressBanner: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.card,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sourceTag: {
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  sourceTagText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: '#DC2626',
    flex: 1,
    fontWeight: FontWeight.semibold,
  },
  clinicalWarningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  clinicalWarningTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  clinicalWarningText: {
    fontSize: 11,
    color: Colors.text,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.card,
  },
  cardSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  cardSectionSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  catChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
  bpGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  bpCol: {
    flex: 1,
  },
  bpSeparator: {
    paddingHorizontal: Spacing.sm,
    paddingTop: 18,
    alignItems: 'center',
  },
  bpSeparatorSlash: {
    fontSize: 28,
    fontWeight: FontWeight.normal,
    color: Colors.textSecondary,
  },
  measureInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    height: 52,
  },
  measureInput: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  measureUnitInside: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  inputHint: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  singleMeasureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  unitToggleWrap: {
    width: 140,
  },
  unitToggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 52,
    padding: 3,
  },
  unitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
  },
  unitBtnActive: {
    backgroundColor: Colors.primary,
  },
  unitBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  unitBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
  glucoseChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.xs,
  },
  ctxChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ctxChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  ctxChipText: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  ctxChipTextActive: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.text,
  },
  nowBadge: {
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  nowBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  notesArea: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    fontSize: FontSize.xs,
    color: Colors.text,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: Spacing.sm,
    padding: Spacing.xs,
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 14,
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.card,
  },
  submitBtn: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
});
