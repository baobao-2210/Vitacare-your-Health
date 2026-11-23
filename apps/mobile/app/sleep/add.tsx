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
import { useSleepLatest } from '../../src/hooks/useSleep';
import { SleepQuality } from '../../src/types';

interface MoodOption {
  quality: SleepQuality;
  emoji: string;
  label: string;
}

const MOODS: MoodOption[] = [
  { quality: 'VERY_POOR', emoji: '😫', label: 'Rất mệt' },
  { quality: 'POOR', emoji: '🥱', label: 'Uể oải' },
  { quality: 'NORMAL', emoji: '😐', label: 'Bình thường' },
  { quality: 'GOOD', emoji: '😊', label: 'Tươi tỉnh' },
  { quality: 'EXCELLENT', emoji: '⚡', label: 'Tràn đầy' },
];

const FACTORS = [
  { id: 'coffee', label: 'Uống cà phê muộn', icon: 'coffee-outline' },
  { id: 'phone', label: 'Dùng điện thoại sát giờ', icon: 'cellphone' },
  { id: 'exercise', label: 'Tập thể dục chiều', icon: 'dumbbell' },
  { id: 'stress', label: 'Căng thẳng / Stress', icon: 'brain' },
  { id: 'cool_room', label: 'Phòng ngủ mát mẻ', icon: 'air-conditioner' },
  { id: 'heavy_meal', label: 'Ăn no trước khi ngủ', icon: 'food' },
  { id: 'book', label: 'Đọc sách thư giãn', icon: 'book-open-page-variant' },
];

export default function AddSleepLogScreen() {
  const router = useRouter();
  const { addLog, isAdding } = useSleepLatest();

  const [isMainSleep, setIsMainSleep] = useState(true);
  const [startTime, setStartTime] = useState('23:30');
  const [endTime, setEndTime] = useState('07:15');
  const [selectedQuality, setSelectedQuality] = useState<SleepQuality>('GOOD');
  const [awakenCount, setAwakenCount] = useState(1);
  const [selectedFactors, setSelectedFactors] = useState<string[]>(['cool_room', 'book']);
  const [note, setNote] = useState('');

  // Calculate duration
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  let totalMinutes = 0;
  if (!isNaN(startH) && !isNaN(startM) && !isNaN(endH) && !isNaN(endM)) {
    let startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;
    if (endTotal <= startTotal) {
      endTotal += 24 * 60; // next day
    }
    totalMinutes = endTotal - startTotal;
  }
  const durH = Math.floor(totalMinutes / 60);
  const durM = totalMinutes % 60;
  const targetH = 8;
  const achievedPercent = Math.min(100, Math.round((totalMinutes / (targetH * 60)) * 100));

  const toggleFactor = (id: string) => {
    setSelectedFactors((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    try {
      // Build ISO dates
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const [sH, sM] = startTime.split(':').map(Number);
      const [eH, eM] = endTime.split(':').map(Number);

      const startDateObj = isMainSleep && sH >= 12 ? yesterday : now;
      startDateObj.setHours(sH, sM, 0, 0);

      const endDateObj = new Date(now);
      endDateObj.setHours(eH, eM, 0, 0);

      const factorLabels = FACTORS.filter((f) => selectedFactors.includes(f.id))
        .map((f) => f.label)
        .join(', ');

      const fullNote = [
        awakenCount > 0 ? `Thức giấc ${awakenCount} lần` : null,
        factorLabels ? `Yếu tố: ${factorLabels}` : null,
        note.trim(),
      ]
        .filter(Boolean)
        .join(' • ');

      await addLog({
        sleepStart: startDateObj.toISOString(),
        sleepEnd: endDateObj.toISOString(),
        quality: selectedQuality,
        note: fullNote || undefined,
      });

      router.back();
    } catch {
      Alert.alert('Lỗi', 'Không thể ghi nhận giấc ngủ. Vui lòng kiểm tra lại thời gian.');
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
          <Ionicons name="close" size={24} color={Colors.onSurface} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Ghi Nhận Giấc Ngủ</Text>

        <TouchableOpacity
          style={styles.saveHeaderBtn}
          onPress={handleSubmit}
          disabled={isAdding}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color={Colors.onPrimary} />
          ) : (
            <Text style={styles.saveHeaderBtnText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Sleep Type Switcher */}
        <View style={styles.segmentWrap}>
          <TouchableOpacity
            style={[styles.segmentBtn, isMainSleep && styles.segmentBtnActive]}
            onPress={() => setIsMainSleep(true)}
          >
            <MaterialCommunityIcons
              name="bed"
              size={18}
              color={isMainSleep ? Colors.primary : Colors.onSurfaceVariant}
            />
            <Text style={[styles.segmentText, isMainSleep && styles.segmentTextActive]}>
              Giấc ngủ chính
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, !isMainSleep && styles.segmentBtnActive]}
            onPress={() => {
              setIsMainSleep(false);
              setStartTime('12:45');
              setEndTime('13:15');
            }}
          >
            <Ionicons
              name="sunny-outline"
              size={18}
              color={!isMainSleep ? Colors.primary : Colors.onSurfaceVariant}
            />
            <Text style={[styles.segmentText, !isMainSleep && styles.segmentTextActive]}>
              Ngủ trưa / Phụ
            </Text>
          </TouchableOpacity>
        </View>

        {/* Visual Time Selectors Card */}
        <View style={[styles.timeCard, Shadows.card]}>
          <View style={styles.timeCardHeader}>
            <Text style={styles.cardHeaderLabel}>KHOẢNG THỜI GIAN NẰM NGỦ</Text>
            <View style={styles.autoPill}>
              <Text style={styles.autoPillText}>Tự động tính</Text>
            </View>
          </View>

          <View style={styles.timeInputsRow}>
            {/* Start Sleep */}
            <View style={styles.timeInputBox}>
              <View style={styles.timeInputBoxTop}>
                <Text style={styles.timeBoxLabel}>Bắt đầu ngủ</Text>
                <MaterialCommunityIcons name="moon-waning-crescent" size={16} color={Colors.tertiary} />
              </View>
              <TextInput
                style={styles.timeInput}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="23:30"
                keyboardType="numbers-and-punctuation"
              />
              <Text style={styles.timeBoxSub}>Định dạng HH:mm</Text>
            </View>

            {/* Wake Up */}
            <View style={styles.timeInputBox}>
              <View style={styles.timeInputBoxTop}>
                <Text style={styles.timeBoxLabel}>Thức dậy</Text>
                <Ionicons name="sunny-outline" size={16} color={Colors.secondary} />
              </View>
              <TextInput
                style={styles.timeInput}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="07:15"
                keyboardType="numbers-and-punctuation"
              />
              <Text style={styles.timeBoxSub}>Định dạng HH:mm</Text>
            </View>
          </View>

          {/* Duration Summary */}
          <View style={styles.durationBanner}>
            <View style={styles.durationLeft}>
              <View style={styles.durationIconWrap}>
                <MaterialCommunityIcons name="bed-clock" size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.durationLabel}>Tổng thời gian ngủ thực tế</Text>
                <Text style={styles.durationVal}>
                  {durH} giờ {durM} phút{' '}
                  <Text style={{ fontSize: 11, color: Colors.onSurfaceVariant, fontWeight: 'normal' }}>
                    / {targetH}h mục tiêu
                  </Text>
                </Text>
              </View>
            </View>
            <View style={styles.achievedPill}>
              <Text style={styles.achievedPillText}>{achievedPercent}% Đạt</Text>
            </View>
          </View>
        </View>

        {/* Quality & Mood */}
        <View style={[styles.qualityCard, Shadows.card]}>
          <View style={styles.qualityHeader}>
            <Text style={styles.qualityTitle}>Cảm giác khi thức dậy</Text>
            <Text style={styles.qualitySub}>Chọn trạng thái</Text>
          </View>

          <View style={styles.moodsRow}>
            {MOODS.map((m) => {
              const isSelected = selectedQuality === m.quality;
              return (
                <TouchableOpacity
                  key={m.quality}
                  style={[styles.moodBtn, isSelected && styles.moodBtnActive]}
                  onPress={() => setSelectedQuality(m.quality)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, isSelected && styles.moodLabelActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Awaken Count Stepper */}
          <View style={styles.awakenRow}>
            <View>
              <Text style={styles.awakenLabel}>Số lần thức giấc ban đêm</Text>
              <Text style={styles.awakenSub}>Gián đoạn chu kỳ ngủ sâu</Text>
            </View>

            <View style={styles.stepperWrap}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setAwakenCount((p) => Math.max(0, p - 1))}
              >
                <Ionicons name="remove" size={16} color={Colors.onSurface} />
              </TouchableOpacity>
              <Text style={styles.stepCountText}>{awakenCount} lần</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setAwakenCount((p) => Math.min(10, p + 1))}
              >
                <Ionicons name="add" size={16} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Sleep Factors */}
        <View style={[styles.factorsCard, Shadows.card]}>
          <View style={styles.factorsHeader}>
            <View>
              <Text style={styles.factorsTitle}>Yếu tố ảnh hưởng</Text>
              <Text style={styles.factorsSub}>Chọn các hoạt động hoặc môi trường</Text>
            </View>
            <View style={styles.selectedCountPill}>
              <Text style={styles.selectedCountText}>{selectedFactors.length} đã chọn</Text>
            </View>
          </View>

          <View style={styles.factorsFlow}>
            {FACTORS.map((f) => {
              const isSelected = selectedFactors.includes(f.id);
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.factorChip, isSelected && styles.factorChipActive]}
                  onPress={() => toggleFactor(f.id)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={f.icon as any}
                    size={16}
                    color={isSelected ? Colors.primary : Colors.onSurfaceVariant}
                  />
                  <Text style={[styles.factorChipText, isSelected && styles.factorChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Note input */}
        <View style={[styles.notesCard, Shadows.card]}>
          <Text style={styles.notesTitle}>Ghi chú thêm</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Ví dụ: Ngủ rất ngon, không bị tỉnh giấc nửa đêm..."
            placeholderTextColor={Colors.outline}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <View style={styles.submitWrap}>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={isAdding}
            activeOpacity={0.9}
          >
            {isAdding ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={20} color={Colors.onPrimary} />
                <Text style={styles.submitBtnText}>Xác nhận & Ghi nhận giấc ngủ</Text>
              </>
            )}
          </TouchableOpacity>
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
    padding: 6,
  },
  headerTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  saveHeaderBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveHeaderBtnText: {
    ...Typography.labelMedium,
    color: Colors.onPrimary,
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
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
  timeCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 18,
    marginTop: 14,
  },
  timeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  autoPill: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  autoPillText: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: '600',
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInputBox: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 12,
  },
  timeInputBoxTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBoxLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  timeInput: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.onSurface,
    marginVertical: 4,
  },
  timeBoxSub: {
    fontSize: 9,
    color: Colors.outline,
  },
  durationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
  },
  durationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  durationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationLabel: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  durationVal: {
    ...Typography.labelLarge,
    color: Colors.primary,
    fontWeight: '700',
  },
  achievedPill: {
    backgroundColor: Colors.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  achievedPillText: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: '700',
  },
  qualityCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 18,
    marginTop: 16,
  },
  qualityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  qualityTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  qualitySub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  moodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLow,
  },
  moodBtnActive: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.05 }],
  },
  moodEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  moodLabelActive: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  awakenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 12,
    marginTop: 16,
  },
  awakenLabel: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  awakenSub: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 16,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCountText: {
    ...Typography.labelMedium,
    color: Colors.primary,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  factorsCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 18,
    marginTop: 16,
  },
  factorsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  factorsTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  factorsSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  selectedCountPill: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  selectedCountText: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: '600',
  },
  factorsFlow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  factorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLow,
  },
  factorChipActive: {
    backgroundColor: Colors.primaryFixed,
  },
  factorChipText: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  factorChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  notesCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 18,
    marginTop: 16,
  },
  notesTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 12,
    color: Colors.onSurface,
    ...Typography.bodyMedium,
    minHeight: 70,
    textAlignVertical: 'top',
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
});

