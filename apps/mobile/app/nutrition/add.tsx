import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/constants/theme';
import { useNutritionToday } from '../../src/hooks/useNutrition';
import { MealType } from '../../src/types';

export default function NutritionAddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    foodId?: string;
    foodName?: string;
    mealType?: string;
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
  }>();

  const baseFoodName = params.foodName || 'Phở Bò Tái Nạm';
  const baseCal = Number(params.calories) || 485;
  const baseProt = Number(params.protein) || 32.5;
  const baseCarbs = Number(params.carbs) || 58.0;
  const baseFat = Number(params.fat) || 13.2;
  const baseGrams = 450;

  const [mealType, setMealType] = useState<MealType>(
    (params.mealType as MealType) || 'BREAKFAST'
  );
  const [multiplier, setMultiplier] = useState(1.0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [note, setNote] = useState('');

  // Add-ons
  const [extraEgg, setExtraEgg] = useState(false); // +75 kcal, +6.2g protein
  const [extraQuay, setExtraQuay] = useState(false); // +120 kcal
  const [lessNoodles, setLessNoodles] = useState(false); // -80 kcal
  const [isFatBroth, setIsFatBroth] = useState(false); // +65 kcal

  const { createMeal, isCreatingMeal } = useNutritionToday();

  // Calculations
  let addonCal = 0;
  let addonProt = 0;
  let addonCarbs = 0;

  if (extraEgg) {
    addonCal += 75;
    addonProt += 6.2;
  }
  if (extraQuay) {
    addonCal += 120;
    addonCarbs += 14.0;
  }
  if (lessNoodles) {
    addonCal -= 80;
    addonCarbs -= 20.0;
  }
  if (isFatBroth) {
    addonCal += 65;
  }

  const totalCalories = Math.max(0, Math.round(baseCal * multiplier + addonCal));
  const totalProtein = Math.max(0, Math.round((baseProt * multiplier + addonProt) * 10) / 10);
  const totalCarbs = Math.max(0, Math.round((baseCarbs * multiplier + addonCarbs) * 10) / 10);
  const totalFat = Math.max(0, Math.round(baseFat * multiplier * 10) / 10);
  const totalGrams = Math.round(baseGrams * multiplier);

  // Donut SVG circumference calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius; // ~402
  const carbPercent = (totalCarbs * 4) / Math.max(1, totalCalories);
  const protPercent = (totalProtein * 4) / Math.max(1, totalCalories);

  const carbDash = Math.min(circumference, circumference * carbPercent);
  const protDash = Math.min(circumference, circumference * protPercent);

  const handleSave = async () => {
    try {
      await createMeal({
        mealType,
        consumedAt: new Date().toISOString(),
        note: note.trim() || undefined,
        items: [
          {
            foodItemId: params.foodId && !params.foodId.startsWith('food-') ? params.foodId : undefined,
            foodName: baseFoodName,
            quantityG: totalGrams,
          },
        ],
      });

      Alert.alert('Thành công', `Đã lưu món "${baseFoodName}" vào nhật ký!`, [
        { text: 'OK', onPress: () => router.navigate('/nutrition') },
      ]);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể lưu món ăn.');
    }
  };

  const getMealLabel = (m: MealType) => {
    switch (m) {
      case 'BREAKFAST':
        return 'Bữa Sáng';
      case 'LUNCH':
        return 'Bữa Trưa';
      case 'DINNER':
        return 'Bữa Tối';
      case 'SNACK':
        return 'Bữa Phụ';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Trở lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Thêm & Chi Tiết Món Ăn
        </Text>
        <TouchableOpacity
          style={styles.favHeaderBtn}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? Colors.error : Colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Verified Badge */}
        <View style={styles.verifiedRow}>
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#00685f" />
            <Text style={styles.verifiedText}>ĐÃ XÁC MINH DINH DƯỠNG</Text>
          </View>
        </View>

        {/* Hero Food Card */}
        <View style={styles.heroFoodCard}>
          <View style={styles.heroFoodTop}>
            <View style={styles.heroFoodIconBox}>
              <Ionicons name="restaurant" size={32} color={Colors.primary} />
              <View style={styles.heroKcalTag}>
                <Ionicons name="flame" size={12} color="#ffffff" />
                <Text style={styles.heroKcalTagText}>{totalCalories} kcal</Text>
              </View>
            </View>
            <View style={styles.heroFoodInfo}>
              <View style={styles.heroTagsRow}>
                <Text style={styles.heroTagCategory}>MÓN VIỆT NAM</Text>
                <Text style={styles.heroTagMeal}>{getMealLabel(mealType)}</Text>
              </View>
              <Text style={styles.heroFoodTitle}>{baseFoodName}</Text>
              <Text style={styles.heroFoodPortion}>Khẩu phần chuẩn: 1 Bát (~450g)</Text>
              <View style={styles.healthScoreRow}>
                <Ionicons name="leaf" size={16} color="#007432" />
                <Text style={styles.healthScoreText}>Chất lượng dinh dưỡng: Hạng A</Text>
              </View>
            </View>
          </View>
          <View style={styles.evaluationBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#007432" />
            <Text style={styles.evaluationText}>
              <Text style={{ fontWeight: '700' }}>Đánh giá VitaCare: </Text>
              Cân bằng năng lượng tốt, dồi dào protein và amino acid tự nhiên từ thịt bò tươi.
            </Text>
          </View>
        </View>

        {/* Big Interactive Macro Visualization Card */}
        <View style={styles.macroCard}>
          <View style={styles.macroHeader}>
            <View>
              <Text style={styles.macroCardTitle}>Cấu trúc Dinh dưỡng</Text>
              <Text style={styles.macroCardSubtitle}>Phân bố calo theo 3 nhóm đa lượng chính</Text>
            </View>
            <Ionicons name="pie-chart-outline" size={22} color={Colors.primary} />
          </View>

          {/* Donut Ring Visualizer */}
          <View style={styles.donutContainer}>
            <Svg width={140} height={140} viewBox="0 0 160 160">
              <Circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#e9edff"
                strokeWidth={14}
                fill="transparent"
              />
              {/* Carbs Arc */}
              <Circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#166534"
                strokeWidth={14}
                strokeDasharray={`${carbDash} ${circumference}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                fill="transparent"
                transform="rotate(-90 80 80)"
              />
              {/* Protein Arc */}
              <Circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#4ae176"
                strokeWidth={14}
                strokeDasharray={`${protDash} ${circumference}`}
                strokeDashoffset={-carbDash}
                strokeLinecap="round"
                fill="transparent"
                transform="rotate(-90 80 80)"
              />
            </Svg>
            <View style={styles.donutCenter}>
              <Text style={styles.donutCenterLabel}>NĂNG LƯỢNG</Text>
              <Text style={styles.donutCenterKcal}>{totalCalories}</Text>
              <Text style={styles.donutCenterUnit}>kcal</Text>
            </View>
          </View>

          {/* Macro 3-Col Stats */}
          <View style={styles.macro3Col}>
            <View style={styles.macroStatBox}>
              <View style={styles.macroStatHead}>
                <View style={[styles.macroDot, { backgroundColor: '#4ae176' }]} />
                <Text style={styles.macroStatName}>Đạm</Text>
              </View>
              <Text style={styles.macroStatVal}>{totalProtein}g</Text>
            </View>
            <View style={styles.macroStatBox}>
              <View style={styles.macroStatHead}>
                <View style={[styles.macroDot, { backgroundColor: '#166534' }]} />
                <Text style={styles.macroStatName}>Tinh bột</Text>
              </View>
              <Text style={styles.macroStatVal}>{totalCarbs}g</Text>
            </View>
            <View style={styles.macroStatBox}>
              <View style={styles.macroStatHead}>
                <View style={[styles.macroDot, { backgroundColor: '#ffd043' }]} />
                <Text style={styles.macroStatName}>Chất béo</Text>
              </View>
              <Text style={styles.macroStatVal}>{totalFat}g</Text>
            </View>
          </View>
        </View>

        {/* Serving Size Stepper & Selector */}
        <View style={styles.servingCard}>
          <View style={styles.servingHeader}>
            <Text style={styles.sectionTitle}>Khẩu phần ghi nhận</Text>
            <Text style={styles.portionWeightBadge}>{totalGrams} gam</Text>
          </View>

          {/* Portion Chips */}
          <View style={styles.portionChipsGrid}>
            {[
              { label: 'Bát vừa', multi: 1.0, sub: '1.0 bát chuẩn' },
              { label: 'Bát lớn', multi: 1.3, sub: '1.3 bát đặc biệt' },
              { label: 'Bát nhỏ', multi: 0.8, sub: '0.8 bát ít ăn' },
            ].map((p) => {
              const isActive = multiplier === p.multi;
              return (
                <TouchableOpacity
                  key={p.label}
                  style={[styles.portionChip, isActive && styles.activePortionChip]}
                  onPress={() => setMultiplier(p.multi)}
                >
                  <Text style={[styles.portionChipTitle, isActive && styles.activePortionChipTitle]}>
                    {p.label}
                  </Text>
                  <Text style={[styles.portionChipSub, isActive && styles.activePortionChipSub]}>
                    {p.sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Stepper Controls */}
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setMultiplier((m) => Math.max(0.3, parseFloat((m - 0.1).toFixed(1))))}
            >
              <Ionicons name="remove" size={22} color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.stepperDisplay}>
              <Text style={styles.stepperNumber}>{multiplier.toFixed(1)}</Text>
              <Text style={styles.stepperUnit}>Bát</Text>
            </View>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setMultiplier((m) => Math.min(3.0, parseFloat((m + 0.1).toFixed(1))))}
            >
              <Ionicons name="add" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Customization / Add-ons Checklist */}
        <View style={styles.addonsCard}>
          <Text style={styles.sectionTitle}>Tùy biến món ăn kèm</Text>
          <View style={styles.addonsList}>
            {/* Option 1: Trứng chần */}
            <TouchableOpacity
              style={[styles.addonItem, extraEgg && styles.addonItemActive]}
              onPress={() => setExtraEgg(!extraEgg)}
            >
              <View style={styles.addonLeft}>
                <Ionicons
                  name={extraEgg ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={extraEgg ? '#166534' : Colors.outline}
                />
                <View>
                  <Text style={styles.addonTitle}>Thêm 1 quả trứng chần</Text>
                  <Text style={styles.addonSub}>Bổ sung đạm và vitamin A</Text>
                </View>
              </View>
              <Text style={styles.addonKcal}>+75 kcal</Text>
            </TouchableOpacity>

            {/* Option 2: Quẩy */}
            <TouchableOpacity
              style={[styles.addonItem, extraQuay && styles.addonItemActive]}
              onPress={() => setExtraQuay(!extraQuay)}
            >
              <View style={styles.addonLeft}>
                <Ionicons
                  name={extraQuay ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={extraQuay ? '#166534' : Colors.outline}
                />
                <View>
                  <Text style={styles.addonTitle}>Bánh quẩy vàng giòn (2 chiếc)</Text>
                  <Text style={styles.addonSub}>Chiên dầu thực vật</Text>
                </View>
              </View>
              <Text style={styles.addonKcal}>+120 kcal</Text>
            </TouchableOpacity>

            {/* Option 3: Ít bánh */}
            <TouchableOpacity
              style={[styles.addonItem, lessNoodles && styles.addonItemActive]}
              onPress={() => setLessNoodles(!lessNoodles)}
            >
              <View style={styles.addonLeft}>
                <Ionicons
                  name={lessNoodles ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={lessNoodles ? '#166534' : Colors.outline}
                />
                <View>
                  <Text style={styles.addonTitle}>Ít bánh phở (Giảm tinh bột)</Text>
                  <Text style={styles.addonSub}>Phù hợp chế độ Low-carb</Text>
                </View>
              </View>
              <Text style={[styles.addonKcal, { color: '#006e2f' }]}>-80 kcal</Text>
            </TouchableOpacity>

            {/* Broth Selector */}
            <View style={styles.brothSelectorRow}>
              <TouchableOpacity
                style={[styles.brothBtn, !isFatBroth && styles.brothBtnActive]}
                onPress={() => setIsFatBroth(false)}
              >
                <Text style={[styles.brothBtnText, !isFatBroth && styles.brothBtnTextActive]}>
                  Nước trong (+0 kcal)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.brothBtn, isFatBroth && styles.brothBtnActive]}
                onPress={() => setIsFatBroth(true)}
              >
                <Text style={[styles.brothBtnText, isFatBroth && styles.brothBtnTextActive]}>
                  Nước béo (+65 kcal)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Meal Type Picker */}
        <View style={styles.mealPickerCard}>
          <Text style={styles.sectionTitle}>Thời gian & Bữa ăn</Text>
          <View style={styles.mealTypeButtonsRow}>
            {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as MealType[]).map((m) => {
              const isSelected = mealType === m;
              const label =
                m === 'BREAKFAST'
                  ? 'Sáng'
                  : m === 'LUNCH'
                  ? 'Trưa'
                  : m === 'DINNER'
                  ? 'Tối'
                  : 'Phụ';

              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.mealTypeBtn, isSelected && styles.activeMealTypeBtn]}
                  onPress={() => setMealType(m)}
                >
                  <Text
                    style={[
                      styles.mealTypeBtnText,
                      isSelected && styles.activeMealTypeBtnText,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Ví dụ: Ăn tại quán Phở Thìn, nước dùng thanh vừa miệng..."
            placeholderTextColor={Colors.outline}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={2}
          />
        </View>
      </ScrollView>

      {/* Fixed Bottom CTA Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <View style={styles.bottomKcalCol}>
            <Text style={styles.bottomKcalLabel}>TỔNG GHI</Text>
            <Text style={styles.bottomKcalNumber}>{totalCalories} kcal</Text>
          </View>
          <TouchableOpacity
            style={styles.saveCtaBtn}
            onPress={handleSave}
            disabled={isCreatingMeal}
          >
            {isCreatingMeal ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#ffffff" />
                <Text style={styles.saveCtaText}>
                  Lưu vào {getMealLabel(mealType)} (+{totalCalories} kcal)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: Spacing.margin,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3ff',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    ...Typography.labelLarge,
    color: Colors.primary,
  },
  headerTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  favHeaderBtn: {
    padding: 4,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.margin,
    paddingBottom: 110,
    gap: Spacing.md,
  },
  verifiedRow: {
    flexDirection: 'row',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e9edff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroFoodCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    gap: Spacing.md,
  },
  heroFoodTop: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  heroFoodIconBox: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#f1f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroKcalTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(22, 101, 52, 0.9)',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 1,
  },
  heroKcalTagText: {
    ...Typography.labelSmall,
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  heroFoodInfo: {
    flex: 1,
    gap: 2,
  },
  heroTagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  heroTagCategory: {
    ...Typography.labelSmall,
    backgroundColor: '#a6f4b5',
    color: '#005226',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    fontWeight: '700',
    fontSize: 10,
  },
  heroTagMeal: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  heroFoodTitle: {
    ...Typography.headlineMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    marginTop: 2,
  },
  heroFoodPortion: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  healthScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  healthScoreText: {
    ...Typography.labelMedium,
    color: '#007432',
    fontWeight: '600',
  },
  evaluationBox: {
    backgroundColor: '#f1f3ff',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    gap: 8,
  },
  evaluationText: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 18,
  },
  macroCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    gap: Spacing.md,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroCardTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  macroCardSubtitle: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutCenterLabel: {
    ...Typography.labelSmall,
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  donutCenterKcal: {
    ...Typography.headlineLarge,
    color: Colors.onSurface,
    fontWeight: '800',
  },
  donutCenterUnit: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  macro3Col: {
    flexDirection: 'row',
    backgroundColor: '#f1f3ff',
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 8,
  },
  macroStatBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  macroStatHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroStatName: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  macroStatVal: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  servingCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    gap: Spacing.md,
  },
  servingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  portionWeightBadge: {
    ...Typography.labelSmall,
    backgroundColor: '#e9edff',
    color: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    fontWeight: '700',
  },
  portionChipsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  portionChip: {
    flex: 1,
    backgroundColor: '#f1f3ff',
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  activePortionChip: {
    backgroundColor: '#166534',
  },
  portionChipTitle: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  activePortionChipTitle: {
    color: '#ffffff',
  },
  portionChipSub: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: 2,
  },
  activePortionChipSub: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f3ff',
    borderRadius: BorderRadius.xl,
    padding: 8,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  stepperDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  stepperNumber: {
    ...Typography.headlineLarge,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  stepperUnit: {
    ...Typography.labelLarge,
    color: Colors.onSurfaceVariant,
  },
  addonsCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    gap: Spacing.md,
  },
  addonsList: {
    gap: 10,
  },
  addonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f3ff',
    padding: 12,
    borderRadius: BorderRadius.lg,
  },
  addonItemActive: {
    backgroundColor: '#e9edff',
  },
  addonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addonTitle: {
    ...Typography.bodyMedium,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  addonSub: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  addonKcal: {
    ...Typography.labelMedium,
    color: '#006591',
    fontWeight: '700',
  },
  brothSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  brothBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#f1f3ff',
    alignItems: 'center',
  },
  brothBtnActive: {
    backgroundColor: '#166534',
  },
  brothBtnText: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
  },
  brothBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  mealPickerCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    gap: Spacing.md,
  },
  mealTypeButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#f1f3ff',
    alignItems: 'center',
  },
  activeMealTypeBtn: {
    backgroundColor: '#166534',
  },
  mealTypeBtnText: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
  },
  activeMealTypeBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  notesCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    gap: Spacing.sm,
  },
  notesInput: {
    backgroundColor: '#f1f3ff',
    borderRadius: BorderRadius.lg,
    padding: 12,
    ...Typography.bodyMedium,
    color: Colors.onSurface,
    minHeight: 60,
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f3ff',
    paddingHorizontal: Spacing.margin,
    paddingVertical: 10,
    ...Shadows.elevated,
  },
  bottomBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomKcalCol: {
    alignItems: 'flex-start',
  },
  bottomKcalLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  bottomKcalNumber: {
    ...Typography.headlineMedium,
    color: Colors.primary,
    fontWeight: '800',
  },
  saveCtaBtn: {
    flex: 1,
    backgroundColor: '#166534',
    height: 50,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveCtaText: {
    ...Typography.labelLarge,
    color: '#ffffff',
    fontWeight: '700',
  },
});

