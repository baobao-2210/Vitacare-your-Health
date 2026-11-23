import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/constants/theme';
import { useNutritionToday, TodayMealFormatted } from '../../src/hooks/useNutrition';
import { MealType } from '../../src/types';

const { width } = Dimensions.get('window');

const MEAL_CONFIGS: {
  type: MealType;
  title: string;
  timeHint: string;
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  {
    type: 'BREAKFAST',
    title: 'Bữa Sáng',
    timeHint: '07:30',
    iconName: 'sunny-outline',
    color: '#00685f',
  },
  {
    type: 'LUNCH',
    title: 'Bữa Trưa',
    timeHint: '12:15',
    iconName: 'restaurant-outline',
    color: '#006e2f',
  },
  {
    type: 'SNACK',
    title: 'Bữa Phụ',
    timeHint: '16:00',
    iconName: 'leaf-outline',
    color: '#166534',
  },
  {
    type: 'DINNER',
    title: 'Bữa Tối',
    timeHint: '19:00',
    iconName: 'moon-outline',
    color: '#006591',
  },
];

export default function NutritionDashboardScreen() {
  const router = useRouter();
  const { data: todayData, isLoading, refetch, deleteMeal, isDeletingMeal } = useNutritionToday();
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);

  const summary = todayData?.summary || {
    totalCalories: 0,
    targetCalories: 2200,
    percentage: 0,
    progress: 0,
    remainingCalories: 2200,
    macros: { proteinG: 0, carbsG: 0, fatG: 0 },
  };

  const mealsByType = todayData?.mealsByType || {
    BREAKFAST: [],
    LUNCH: [],
    DINNER: [],
    SNACK: [],
  };

  const totalCalories = summary.totalCalories;
  const targetCalories = summary.targetCalories || 2200;
  const percentage = Math.min(Math.round((totalCalories / targetCalories) * 100), 100);

  // SVG circular gauge calculation
  const radius = 40;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  // Target macros (estimated based on standard 2200kcal)
  const targetProtein = 110;
  const targetCarbs = 250;
  const targetFat = 65;

  const proteinPct = Math.min(Math.round((summary.macros.proteinG / targetProtein) * 100), 100);
  const carbsPct = Math.min(Math.round((summary.macros.carbsG / targetCarbs) * 100), 100);
  const fatPct = Math.min(Math.round((summary.macros.fatG / targetFat) * 100), 100);

  const handleDeleteMeal = (meal: TodayMealFormatted) => {
    Alert.alert('Xóa bữa ăn', 'Bạn có chắc chắn muốn xóa bữa ăn này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMeal(meal.id);
          } catch (e: any) {
            Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể xóa bữa ăn.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.brandIconBox}>
            <Ionicons name="nutrition" size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerBrand}>VITACARE</Text>
            <Text style={styles.headerTitle}>Dashboard Dinh Dưỡng</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/nutrition/stats' as any)}
          >
            <Ionicons name="bar-chart-outline" size={22} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Selector Micro-strip */}
        <View style={styles.dateSelector}>
          <TouchableOpacity
            style={styles.dateNavBtn}
            onPress={() => setSelectedDayOffset((prev) => prev - 1)}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          <View style={styles.dateCenter}>
            <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
            <Text style={styles.dateText}>
              {selectedDayOffset === 0
                ? 'Hôm nay'
                : selectedDayOffset === -1
                ? 'Hôm qua'
                : `${Math.abs(selectedDayOffset)} ngày trước`}
            </Text>
            {selectedDayOffset === 0 && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Hiện tại</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.dateNavBtn, selectedDayOffset >= 0 && styles.disabledNavBtn]}
            disabled={selectedDayOffset >= 0}
            onPress={() => setSelectedDayOffset((prev) => prev + 1)}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={selectedDayOffset >= 0 ? Colors.outlineVariant : Colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Đang tải dữ liệu dinh dưỡng...</Text>
          </View>
        ) : (
          <>
            {/* Calorie Intake Hero Summary Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.heroLabel}>NĂNG LƯỢNG HÔM NAY</Text>
                  <View style={styles.heroValueRow}>
                    <Text style={styles.heroMainValue}>
                      {totalCalories.toLocaleString('vi-VN')}
                    </Text>
                    <Text style={styles.heroSubValue}>
                      / {targetCalories.toLocaleString('vi-VN')} kcal
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.remainingBadge,
                    summary.remainingCalories <= 0 && styles.exceededBadge,
                  ]}
                >
                  <View
                    style={[
                      styles.remainingDot,
                      summary.remainingCalories <= 0 && styles.exceededDot,
                    ]}
                  />
                  <Text
                    style={[
                      styles.remainingText,
                      summary.remainingCalories <= 0 && styles.exceededText,
                    ]}
                  >
                    {summary.remainingCalories > 0
                      ? `Còn ${summary.remainingCalories} kcal`
                      : 'Đạt chỉ tiêu!'}
                  </Text>
                </View>
              </View>

              {/* Visual Calorie Ring & Breakdown */}
              <View style={styles.ringSection}>
                <View style={styles.ringContainer}>
                  <Svg width={100} height={100} viewBox="0 0 100 100">
                    <Circle
                      cx="50"
                      cy="50"
                      r={radius}
                      stroke="#f1f3ff"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />
                    <Circle
                      cx="50"
                      cy="50"
                      r={radius}
                      stroke="#006e2f"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      transform="rotate(-90 50 50)"
                    />
                  </Svg>
                  <View style={styles.ringCenterText}>
                    <Text style={styles.ringPercent}>{percentage}%</Text>
                    <Text style={styles.ringSubtext}>mục tiêu</Text>
                  </View>
                </View>

                <View style={styles.breakdownCol}>
                  <View style={styles.breakdownRow}>
                    <View style={styles.breakdownItemLeft}>
                      <Ionicons name="flame" size={18} color={Colors.error} />
                      <Text style={styles.breakdownLabel}>Tiêu hao</Text>
                    </View>
                    <Text style={styles.breakdownValue}>-485 kcal</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <View style={styles.breakdownItemLeft}>
                      <Ionicons name="pulse" size={18} color={Colors.primary} />
                      <Text style={styles.breakdownLabel}>Tịnh nạp</Text>
                    </View>
                    <Text style={[styles.breakdownValue, { color: Colors.primary, fontWeight: '700' }]}>
                      {Math.max(0, totalCalories - 485)} kcal
                    </Text>
                  </View>
                </View>
              </View>

              {/* User Meta Banner */}
              <View style={styles.userMetaBanner}>
                <Text style={styles.userMetaText}>Người dùng • 68kg</Text>
                <Text style={styles.userGoalText}>Tăng cơ nạc</Text>
              </View>
            </View>

            {/* Macronutrients Multi-Progress Card */}
            <View style={styles.macroCard}>
              <View style={styles.macroHeader}>
                <Text style={styles.sectionTitle}>Tỷ lệ Đa lượng (Macros)</Text>
                <Text style={styles.timestampText}>Cập nhật hôm nay</Text>
              </View>
              <View style={styles.macroGrid}>
                {/* Protein */}
                <View style={styles.macroCol}>
                  <View style={styles.macroLabelRow}>
                    <Text style={[styles.macroName, { color: '#00685f' }]}>Đạm</Text>
                    <Text style={styles.macroPct}>{proteinPct}%</Text>
                  </View>
                  <Text style={styles.macroValue}>
                    {summary.macros.proteinG}
                    <Text style={styles.macroUnit}>/{targetProtein}g</Text>
                  </Text>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${proteinPct}%`, backgroundColor: '#00685f' }]} />
                  </View>
                </View>

                {/* Carbs */}
                <View style={styles.macroCol}>
                  <View style={styles.macroLabelRow}>
                    <Text style={[styles.macroName, { color: '#006e2f' }]}>Carbs</Text>
                    <Text style={styles.macroPct}>{carbsPct}%</Text>
                  </View>
                  <Text style={styles.macroValue}>
                    {summary.macros.carbsG}
                    <Text style={styles.macroUnit}>/{targetCarbs}g</Text>
                  </Text>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${carbsPct}%`, backgroundColor: '#006e2f' }]} />
                  </View>
                </View>

                {/* Fat */}
                <View style={styles.macroCol}>
                  <View style={styles.macroLabelRow}>
                    <Text style={[styles.macroName, { color: '#825100' }]}>Béo</Text>
                    <Text style={styles.macroPct}>{fatPct}%</Text>
                  </View>
                  <Text style={styles.macroValue}>
                    {summary.macros.fatG}
                    <Text style={styles.macroUnit}>/{targetFat}g</Text>
                  </Text>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${fatPct}%`, backgroundColor: '#825100' }]} />
                  </View>
                </View>
              </View>
            </View>

            {/* AI Nutritionist Recommendation Pill */}
            <View style={styles.aiInsightCard}>
              <View style={styles.aiIconBox}>
                <Ionicons name="sparkles" size={18} color="#007432" />
              </View>
              <View style={styles.aiContent}>
                <View style={styles.aiHeaderRow}>
                  <Text style={styles.aiTag}>AI VITACARE INSIGHT</Text>
                  <Text style={styles.aiSub}>Đề xuất bữa tiếp</Text>
                </View>
                <Text style={styles.aiText}>
                  {summary.macros.proteinG < targetProtein * 0.7
                    ? `Bạn nên bổ sung thêm Protein cho bữa kế tiếp để duy trì năng lượng và phục hồi cơ bắp.`
                    : `Chế độ ăn của bạn hôm nay đang rất cân đối! Hãy duy trì lượng nước đều đặn.`}
                </Text>
                <View style={styles.aiFoodPills}>
                  <View style={styles.aiPill}>
                    <Text style={styles.aiPillText}>Ức gà nướng</Text>
                  </View>
                  <View style={styles.aiPill}>
                    <Text style={styles.aiPillText}>Cá hồi áp chảo</Text>
                  </View>
                  <View style={styles.aiPill}>
                    <Text style={styles.aiPillText}>Trứng gà luộc</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Action Strip */}
            <View style={styles.actionStrip}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/nutrition/search')}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#a6f4b5' }]}>
                  <Ionicons name="add" size={24} color="#004c22" />
                </View>
                <Text style={styles.actionLabel}>Ghi món nhanh</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/nutrition/search')}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#e1e8ff' }]}>
                  <Ionicons name="barcode-outline" size={22} color={Colors.onSurface} />
                </View>
                <Text style={styles.actionLabel}>Quét mã vạch</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/nutrition/stats' as any)}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#6bff8f' }]}>
                  <Ionicons name="trending-up" size={22} color="#007432" />
                </View>
                <Text style={styles.actionLabel}>Phân tích</Text>
              </TouchableOpacity>
            </View>

            {/* Meal Timeline Section */}
            <View style={styles.timelineSection}>
              <View style={styles.timelineHeader}>
                <Text style={styles.sectionTitle}>Nhật ký 4 bữa ăn</Text>
                <Text style={styles.totalMealsBadge}>
                  Hôm nay: {todayData?.totalMeals || 0} bữa
                </Text>
              </View>

              {MEAL_CONFIGS.map((mealCfg) => {
                const logs = mealsByType[mealCfg.type] || [];
                const isLogged = logs.length > 0;
                const mealCalories = logs.reduce((sum, l) => sum + (l.totalCalories || 0), 0);

                return (
                  <View key={mealCfg.type} style={styles.mealCard}>
                    <View style={styles.mealTopRow}>
                      <View style={styles.mealTitleRow}>
                        <View style={[styles.mealIconBox, { backgroundColor: `${mealCfg.color}15` }]}>
                          <Ionicons name={mealCfg.iconName} size={18} color={mealCfg.color} />
                        </View>
                        <View>
                          <Text style={styles.mealTitleText}>{mealCfg.title}</Text>
                          <Text style={styles.mealTimeHint}>{mealCfg.timeHint}</Text>
                        </View>
                      </View>
                      <View style={styles.mealStatusRow}>
                        {isLogged ? (
                          <>
                            <Text style={styles.mealKcalText}>{mealCalories} kcal</Text>
                            <View style={styles.doneBadge}>
                              <Ionicons name="checkmark-circle" size={14} color="#007432" />
                              <Text style={styles.doneBadgeText}>Đã ghi</Text>
                            </View>
                          </>
                        ) : (
                          <TouchableOpacity
                            style={styles.addMealButtonSmall}
                            onPress={() => router.push(`/nutrition/search?mealType=${mealCfg.type}` as any)}
                          >
                            <Ionicons name="add" size={16} color={Colors.primary} />
                            <Text style={styles.addMealButtonSmallText}>Thêm</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {isLogged ? (
                      <View style={styles.mealItemsList}>
                        {logs.map((log) => (
                          <View key={log.id} style={styles.singleLogContainer}>
                            {log.mealItems.map((item) => (
                              <View key={item.id} style={styles.foodItemRow}>
                                <View style={styles.foodItemLeft}>
                                  <View style={styles.foodIconCircle}>
                                    <Ionicons name="fast-food-outline" size={16} color={mealCfg.color} />
                                  </View>
                                  <View style={styles.foodItemInfo}>
                                    <Text style={styles.foodItemName}>{item.foodNameSnapshot}</Text>
                                    <Text style={styles.foodItemGrams}>{item.quantityG} gam</Text>
                                  </View>
                                </View>
                                <View style={styles.foodItemRight}>
                                  <Text style={styles.foodItemKcal}>
                                    {item.caloriesSnapshot || 0} kcal
                                  </Text>
                                </View>
                              </View>
                            ))}
                            <View style={styles.logFooterRow}>
                              {log.note && <Text style={styles.logNote}>"{log.note}"</Text>}
                              <TouchableOpacity
                                style={styles.deleteLogBtn}
                                onPress={() => handleDeleteMeal(log)}
                                disabled={isDeletingMeal}
                              >
                                <Ionicons name="trash-outline" size={15} color={Colors.error} />
                                <Text style={styles.deleteLogBtnText}>Xóa</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.emptyMealBox}>
                        <Ionicons name="add-circle-outline" size={28} color={Colors.outlineVariant} />
                        <Text style={styles.emptyMealTitle}>Chưa ghi nhận {mealCfg.title.toLowerCase()}</Text>
                        <TouchableOpacity
                          style={styles.addMealCtaBtn}
                          onPress={() => router.push(`/nutrition/search?mealType=${mealCfg.type}` as any)}
                        >
                          <Ionicons name="add" size={18} color="#ffffff" />
                          <Text style={styles.addMealCtaBtnText}>Thêm món {mealCfg.title.toLowerCase()}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Quick Sync Water Tracker Card */}
            <TouchableOpacity
              style={styles.waterQuickCard}
              onPress={() => router.push('/water')}
              activeOpacity={0.8}
            >
              <View style={styles.waterLeft}>
                <View style={styles.waterIconBox}>
                  <Ionicons name="water" size={22} color={Colors.secondary} />
                </View>
                <View>
                  <Text style={styles.waterTitle}>Uống nước hôm nay</Text>
                  <Text style={styles.waterSubtitle}>Theo dõi cùng nhịp sinh học</Text>
                </View>
              </View>
              <View style={styles.waterRight}>
                <Ionicons name="chevron-forward" size={20} color={Colors.onSurfaceVariant} />
              </View>
            </TouchableOpacity>
          </>
        )}
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
    paddingHorizontal: Spacing.margin,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3ff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backButton: {
    padding: 4,
    marginRight: 2,
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#a6f4b5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrand: {
    ...Typography.labelSmall,
    color: Colors.primary,
    letterSpacing: 1,
  },
  headerTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.margin,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    ...Shadows.soft,
  },
  dateNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledNavBtn: {
    opacity: 0.3,
  },
  dateCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  todayBadge: {
    backgroundColor: '#6bff8f',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  todayBadgeText: {
    ...Typography.labelSmall,
    color: '#007432',
    fontWeight: '700',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.onSurfaceVariant,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    gap: Spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  heroMainValue: {
    ...Typography.displayLarge,
    color: Colors.primary,
  },
  heroSubValue: {
    ...Typography.bodyMedium,
    color: Colors.onSurfaceVariant,
  },
  remainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f3ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  remainingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  remainingText: {
    ...Typography.labelMedium,
    color: Colors.primary,
    fontWeight: '600',
  },
  exceededBadge: {
    backgroundColor: '#ffdad6',
  },
  exceededDot: {
    backgroundColor: Colors.error,
  },
  exceededText: {
    color: Colors.error,
  },
  ringSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  ringContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringCenterText: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringPercent: {
    ...Typography.headlineMedium,
    color: Colors.onSurface,
  },
  ringSubtext: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  breakdownCol: {
    flex: 1,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f3ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  breakdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownLabel: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  breakdownValue: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
  },
  userMetaBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e9edff',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  userMetaText: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  userGoalText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '700',
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
  sectionTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  timestampText: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  macroCol: {
    flex: 1,
    backgroundColor: '#f1f3ff',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  macroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroName: {
    ...Typography.labelSmall,
    fontWeight: '700',
  },
  macroPct: {
    ...Typography.labelSmall,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  macroValue: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    marginTop: 4,
  },
  macroUnit: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontWeight: '400',
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#d9e2fc',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  aiInsightCard: {
    backgroundColor: '#166534',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    ...Shadows.card,
  },
  aiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6bff8f',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiContent: {
    flex: 1,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiTag: {
    ...Typography.labelSmall,
    color: '#93e0a2',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  aiSub: {
    ...Typography.labelSmall,
    color: '#93e0a2',
  },
  aiText: {
    ...Typography.bodySmall,
    color: '#ffffff',
    marginTop: 4,
    lineHeight: 18,
  },
  aiFoodPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  aiPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  aiPillText: {
    ...Typography.labelSmall,
    color: '#ffffff',
  },
  actionStrip: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  timelineSection: {
    gap: Spacing.sm,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalMealsBadge: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  mealCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.soft,
    gap: Spacing.sm,
  },
  mealTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTitleText: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  mealTimeHint: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  mealStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealKcalText: {
    ...Typography.labelLarge,
    color: Colors.primary,
    fontWeight: '700',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6bff8f30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  doneBadgeText: {
    ...Typography.labelSmall,
    color: '#007432',
    fontWeight: '600',
  },
  addMealButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f3ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  addMealButtonSmallText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  mealItemsList: {
    gap: 6,
    paddingTop: 4,
  },
  singleLogContainer: {
    gap: 6,
  },
  foodItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f3ff',
    padding: 8,
    borderRadius: BorderRadius.lg,
  },
  foodItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  foodIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    ...Typography.bodySmall,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  foodItemGrams: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  foodItemRight: {
    alignItems: 'flex-end',
  },
  foodItemKcal: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
  },
  logFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  logNote: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
    flex: 1,
  },
  deleteLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  deleteLogBtnText: {
    ...Typography.labelSmall,
    color: Colors.error,
  },
  emptyMealBox: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#f9f9ff',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#e9edff',
    borderStyle: 'dashed',
    gap: 6,
  },
  emptyMealTitle: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  addMealCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  addMealCtaBtnText: {
    ...Typography.labelMedium,
    color: '#ffffff',
    fontWeight: '600',
  },
  waterQuickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    ...Shadows.soft,
  },
  waterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waterIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e1e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  waterSubtitle: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  waterRight: {
    padding: 4,
  },
});

