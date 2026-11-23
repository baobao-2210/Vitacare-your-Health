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
import Svg, { Path, Rect, Defs, LinearGradient, Stop, ClipPath } from 'react-native-svg';
import { Colors, Spacing, Typography, Shadows } from '../../src/constants/theme';
import { useWaterToday } from '../../src/hooks/useWater';

interface Beverage {
  id: string;
  name: string;
  rate: number;
  sub: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const BEVERAGES: Beverage[] = [
  { id: 'water', name: 'Nước lọc', rate: 1.0, sub: 'Hấp thụ hoàn hảo', icon: 'water-outline' },
  { id: 'detox', name: 'Nước Detox', rate: 0.95, sub: 'Chanh, dưa leo, sả', icon: 'leaf-circle-outline' },
  { id: 'tea', name: 'Trà thảo mộc', rate: 0.9, sub: 'Hoa cúc, trà xanh', icon: 'tea' },
  { id: 'electrolyte', name: 'Điện giải', rate: 0.9, sub: 'Bổ sung khoáng', icon: 'flash-outline' },
  { id: 'juice', name: 'Nước ép tươi', rate: 0.8, sub: 'Cam, táo, sữa hạt', icon: 'cup-water' },
  { id: 'coffee', name: 'Cà phê đen', rate: 0.7, sub: 'Americano / Ít đường', icon: 'coffee-outline' },
];

const TEMPERATURES = [
  { id: 'warm', label: 'Nước ấm', icon: 'thermometer-high' },
  { id: 'room', label: 'Thường (25°C)', icon: 'thermometer' },
  { id: 'cold', label: 'Nước mát', icon: 'thermometer-low' },
];

export default function AddWaterLogScreen() {
  const router = useRouter();
  const { data, addLog, isAdding } = useWaterToday();

  const [amount, setAmount] = useState(300);
  const [selectedBev, setSelectedBev] = useState<Beverage>(BEVERAGES[0]);
  const [selectedTemp, setSelectedTemp] = useState('room');
  const [note, setNote] = useState('');

  const todayTotal = data?.totalMl ?? 0;
  const goalMl = data?.goalMl ?? 2500;
  const effectiveMl = Math.round(amount * selectedBev.rate);
  const projectedTotal = todayTotal + effectiveMl;
  const projectedPercent = Math.min(100, Math.round((projectedTotal / goalMl) * 100));

  // Visual Cup fill height: 50ml -> 20px, 1000ml -> 140px
  const fillHeight = Math.max(20, Math.min(140, ((amount - 50) / 950) * 120 + 20));
  const fillY = 160 - fillHeight;

  const handleAdjust = (delta: number) => {
    setAmount((prev) => Math.max(50, Math.min(1000, prev + delta)));
  };

  const handlePreset = (val: number) => {
    setAmount(val);
  };

  const handleSubmit = async () => {
    try {
      const fullNote = [
        selectedBev.id !== 'water' ? selectedBev.name : null,
        selectedTemp === 'warm' ? 'Ấm' : selectedTemp === 'cold' ? 'Lạnh' : null,
        note.trim(),
      ]
        .filter(Boolean)
        .join(' - ');

      await addLog({
        amountMl: amount,
        note: fullNote || undefined,
      });

      router.back();
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu bản ghi lúc này. Vui lòng thử lại.');
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
          <Text style={styles.backText}>Trở lại</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Ghi Nhận Nước</Text>

        <View style={styles.todayPill}>
          <Ionicons name="water-outline" size={14} color={Colors.primary} />
          <Text style={styles.todayPillText}>{todayTotal}ml</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Interactive Cup Module */}
        <View style={[styles.cupCard, Shadows.card]}>
          <Text style={styles.cardHeaderLabel}>LƯỢNG NƯỚC UỐNG</Text>

          <View style={styles.cupVisualWrap}>
            <Svg width={140} height={180} viewBox="0 0 160 200">
              <Defs>
                <LinearGradient id="cupWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#4ae176" stopOpacity="0.85" />
                  <Stop offset="100%" stopColor="#006e2f" stopOpacity="0.95" />
                </LinearGradient>
                <ClipPath id="cupClip">
                  <Path d="M 30,12 L 130,12 C 132,12 134,13.8 133.7,16 L 121,170 C 120.2,180 112,188 101,188 L 59,188 C 48,188 39.8,180 39,170 L 26.3,16 C 26,13.8 28,12 30,12 Z" />
                </ClipPath>
              </Defs>

              {/* Glass shell background */}
              <Path
                d="M 30,12 L 130,12 C 132,12 134,13.8 133.7,16 L 121,170 C 120.2,180 112,188 101,188 L 59,188 C 48,188 39.8,180 39,170 L 26.3,16 C 26,13.8 28,12 30,12 Z"
                fill="#e9edff"
                opacity={0.65}
              />

              {/* Liquid fill */}
              <Rect
                x="20"
                y={fillY}
                width="120"
                height={fillHeight + 30}
                fill="url(#cupWaterGrad)"
                clipPath="url(#cupClip)"
              />

              {/* Glass Rim */}
              <Path d="M 28,12 L 132,12" stroke="#bfc9bd" strokeWidth={3} strokeLinecap="round" />
            </Svg>

            {/* Readout floating inside */}
            <View style={styles.cupReadout}>
              <View style={styles.amountDisplayRow}>
                <Text style={styles.amountDisplayText}>{amount}</Text>
                <Text style={styles.amountUnitText}>ml</Text>
              </View>
              <View style={styles.effectivePill}>
                <Text style={styles.effectivePillText}>
                  {Math.round(selectedBev.rate * 100)}% Cấp ẩm (~{effectiveMl}ml)
                </Text>
              </View>
            </View>
          </View>

          {/* Stepper Buttons */}
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => handleAdjust(-50)}
              activeOpacity={0.8}
            >
              <Ionicons name="remove" size={24} color={Colors.onSurface} />
            </TouchableOpacity>

            <View style={styles.amountPill}>
              <Text style={styles.amountPillText}>{amount} ml</Text>
            </View>

            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: Colors.primary }]}
              onPress={() => handleAdjust(50)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color={Colors.onPrimary} />
            </TouchableOpacity>
          </View>

          {/* Quick Preset Vessels */}
          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={[styles.vesselBtn, amount === 250 && styles.vesselBtnActive]}
              onPress={() => handlePreset(250)}
            >
              <Ionicons name="cafe-outline" size={20} color={Colors.primary} />
              <Text style={styles.vesselLabel}>Cốc con</Text>
              <Text style={styles.vesselSub}>250 ml</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.vesselBtn, amount === 500 && styles.vesselBtnActive]}
              onPress={() => handlePreset(500)}
            >
              <MaterialCommunityIcons name="tea" size={20} color={Colors.primary} />
              <Text style={styles.vesselLabel}>Ly giữ nhiệt</Text>
              <Text style={styles.vesselSub}>500 ml</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.vesselBtn, amount === 600 && styles.vesselBtnActive]}
              onPress={() => handlePreset(600)}
            >
              <MaterialCommunityIcons name="bottle-tonic-outline" size={20} color={Colors.primary} />
              <Text style={styles.vesselLabel}>Bình thể thao</Text>
              <Text style={styles.vesselSub}>600 ml</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Beverage Selection */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Loại thức uống</Text>
          <Text style={styles.sectionSub}>Hệ số hấp thụ</Text>
        </View>

        <View style={styles.bevGrid}>
          {BEVERAGES.map((bev) => {
            const isSelected = selectedBev.id === bev.id;
            return (
              <TouchableOpacity
                key={bev.id}
                style={[styles.bevCard, isSelected && styles.bevCardActive, Shadows.card]}
                onPress={() => setSelectedBev(bev)}
                activeOpacity={0.85}
              >
                <View style={[styles.bevIconWrap, isSelected && styles.bevIconWrapActive]}>
                  <MaterialCommunityIcons
                    name={bev.icon}
                    size={22}
                    color={isSelected ? Colors.primary : Colors.onSurfaceVariant}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.bevTitleRow}>
                    <Text style={styles.bevName} numberOfLines={1}>{bev.name}</Text>
                    <View style={[styles.rateBadge, isSelected && styles.rateBadgeActive]}>
                      <Text style={styles.rateBadgeText}>{Math.round(bev.rate * 100)}%</Text>
                    </View>
                  </View>
                  <Text style={styles.bevSub} numberOfLines={1}>{bev.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Temperature & Notes Details */}
        <View style={[styles.detailsCard, Shadows.card]}>
          <Text style={styles.cardSectionTitle}>Chi tiết nhật ký</Text>

          {/* Temperature */}
          <Text style={styles.inputLabel}>Nhiệt độ nước</Text>
          <View style={styles.tempGroup}>
            {TEMPERATURES.map((t) => {
              const isSelected = selectedTemp === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tempBtn, isSelected && styles.tempBtnActive]}
                  onPress={() => setSelectedTemp(t.id)}
                >
                  <MaterialCommunityIcons
                    name={t.icon as any}
                    size={16}
                    color={isSelected ? Colors.onPrimary : Colors.onSurfaceVariant}
                  />
                  <Text style={[styles.tempBtnText, isSelected && styles.tempBtnTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Note Input */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Ghi chú bổ sung</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ví dụ: Uống sau khi đi bộ 30 phút..."
            placeholderTextColor={Colors.outline}
            value={note}
            onChangeText={setNote}
          />

          {/* Quick Tag suggestions */}
          <View style={styles.tagsRow}>
            {['☀️ Vừa thức dậy', '🏃 Sau vận động', '🥪 Trong bữa ăn'].map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.tagChip}
                onPress={() => setNote(tag)}
              >
                <Text style={styles.tagChipText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Motivational Tip Card */}
        <View style={styles.scienceCard}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.scienceTitle}>Mẹo sức khỏe từ VitaCare</Text>
            <Text style={styles.scienceBody}>
              Duy trì uống từng ngụm nhỏ cách nhau 15-20 phút sẽ giúp cơ thể thẩm thấu tế bào tốt hơn 30% so với uống ngụm lớn một lần.
            </Text>
          </View>
        </View>

        {/* Submit Deck */}
        <View style={styles.submitDeck}>
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
                <Text style={styles.submitBtnText}>Ghi nhận {amount}ml nước</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.feedbackRow}>
            <Ionicons name="trending-up" size={16} color={Colors.secondary} />
            <Text style={styles.feedbackText}>
              Giúp bạn đạt <Text style={{ fontWeight: '700', color: Colors.onSurface }}>{projectedPercent}% mục tiêu hôm nay</Text>
            </Text>
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
  headerTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  todayPillText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  cupCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 20,
    marginTop: 14,
    alignItems: 'center',
  },
  cardHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  cupVisualWrap: {
    width: 160,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cupReadout: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  amountDisplayText: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  amountUnitText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  effectivePill: {
    marginTop: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  effectivePillText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 20,
  },
  amountPillText: {
    ...Typography.headlineSmall,
    color: Colors.primary,
    fontWeight: '700',
  },
  presetsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.surfaceContainer,
  },
  vesselBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
  },
  vesselBtnActive: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  vesselLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurface,
    fontWeight: '600',
    marginTop: 4,
  },
  vesselSub: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.margin,
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  sectionSub: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  bevGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.margin,
    gap: 10,
  },
  bevCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  bevCardActive: {
    borderColor: Colors.primary,
  },
  bevIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bevIconWrapActive: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  bevTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  bevName: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    flex: 1,
  },
  rateBadge: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  rateBadgeActive: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  rateBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
  },
  bevSub: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    fontSize: 11,
  },
  detailsCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 18,
    marginTop: 24,
  },
  cardSectionTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
    marginBottom: 12,
  },
  inputLabel: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: 6,
  },
  tempGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  tempBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
  },
  tempBtnActive: {
    backgroundColor: Colors.primary,
  },
  tempBtnText: {
    ...Typography.labelSmall,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  tempBtnTextActive: {
    color: Colors.onPrimary,
  },
  textInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 14,
    color: Colors.onSurface,
    ...Typography.bodyMedium,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainer,
  },
  tagChipText: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  scienceCard: {
    backgroundColor: '#d8f3dc',
    marginHorizontal: Spacing.margin,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  scienceTitle: {
    ...Typography.labelLarge,
    color: Colors.primary,
    fontWeight: '700',
  },
  scienceBody: {
    ...Typography.bodySmall,
    color: '#1b4332',
    lineHeight: 18,
    marginTop: 2,
  },
  submitDeck: {
    paddingHorizontal: Spacing.margin,
    marginTop: 24,
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
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  feedbackText: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
});

