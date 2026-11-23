import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/constants/theme';
import { useFoodSearch, useNutritionToday } from '../../src/hooks/useNutrition';
import { FoodItem, MealType } from '../../src/types';

const CATEGORIES = [
  'Tất cả',
  'Món Việt truyền thống',
  'Giàu đạm',
  'Healthy & Eat Clean',
  'Món nước',
  'Món chay',
  'Đồ uống & Tráng miệng',
];

const RECENT_SEARCHES = ['Phở bò', 'Bánh mì trứng', 'Cơm tấm sườn', 'Ức gà luộc'];

// Seed / Popular Vietnamese foods database fallback for rich browsing
const POPULAR_VIETNAMESE_FOODS = [
  {
    id: 'food-pho-bo',
    name: 'Phở bò tái chín',
    portion: '1 tô vừa (350g)',
    calories: 450,
    protein: 28,
    carbs: 62,
    fat: 12,
    icon: 'restaurant',
  },
  {
    id: 'food-com-ga',
    name: 'Cơm gà luộc xé phay',
    portion: '1 đĩa (300g)',
    calories: 520,
    protein: 36,
    carbs: 65,
    fat: 11,
    icon: 'fast-food',
  },
  {
    id: 'food-banh-mi',
    name: 'Bánh mì pate trứng',
    portion: '1 ổ giòn rụm (180g)',
    calories: 380,
    protein: 16,
    carbs: 48,
    fat: 14,
    icon: 'nutrition',
  },
  {
    id: 'food-bun-bo',
    name: 'Bún bò Huế',
    portion: '1 tô truyền thống (400g)',
    calories: 560,
    protein: 32,
    carbs: 70,
    fat: 18,
    icon: 'restaurant',
  },
  {
    id: 'food-trung-luoc',
    name: 'Trứng gà luộc',
    portion: '1 quả (50g)',
    calories: 78,
    protein: 6.3,
    carbs: 0.6,
    fat: 5.3,
    icon: 'egg',
  },
  {
    id: 'food-canh-chua',
    name: 'Canh chua cá lóc',
    portion: '1 tô thanh đạm (250g)',
    calories: 165,
    protein: 18,
    carbs: 12,
    fat: 5,
    icon: 'leaf',
  },
  {
    id: 'food-com-lut',
    name: 'Cơm lứt thịt băm rau luộc',
    portion: '1 phần Eat Clean (300g)',
    calories: 420,
    protein: 26,
    carbs: 58,
    fat: 9,
    icon: 'fitness',
  },
];

export default function NutritionSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType?: string }>();
  const initialMeal = (params.mealType as MealType) || 'BREAKFAST';

  const [selectedMeal, setSelectedMeal] = useState<MealType>(initialMeal);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedFoods, setSelectedFoods] = useState<Record<string, any>>({});

  const { data: apiFoods, isLoading: isSearching } = useFoodSearch(searchTerm);
  const { createMeal, isCreatingMeal } = useNutritionToday();

  // Combine API results with popular foods
  const displayedFoods = React.useMemo(() => {
    if (searchTerm.trim()) {
      if (apiFoods && apiFoods.length > 0) {
        return apiFoods.map((f) => ({
          id: f.id,
          name: f.name,
          portion: '100g tiêu chuẩn',
          calories: f.caloriesPer100g || 150,
          protein: f.proteinPer100g || 10,
          carbs: f.carbsPer100g || 15,
          fat: f.fatPer100g || 5,
          icon: 'fast-food',
        }));
      }
      return POPULAR_VIETNAMESE_FOODS.filter((f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return POPULAR_VIETNAMESE_FOODS;
  }, [searchTerm, apiFoods]);

  const toggleSelectFood = (food: any) => {
    setSelectedFoods((prev) => {
      const copy = { ...prev };
      if (copy[food.id]) {
        delete copy[food.id];
      } else {
        copy[food.id] = food;
      }
      return copy;
    });
  };

  const selectedCount = Object.keys(selectedFoods).length;
  const totalSelectedKcal = Object.values(selectedFoods).reduce(
    (sum: number, f: any) => sum + (f.calories || 0),
    0
  );

  const handleOpenAddDetails = (food: any) => {
    router.push({
      pathname: '/nutrition/add',
      params: {
        foodId: food.id,
        foodName: food.name,
        mealType: selectedMeal,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      },
    });
  };

  const handleLogSelectedDirectly = async () => {
    if (selectedCount === 0) return;

    try {
      const items = Object.values(selectedFoods).map((f: any) => ({
        foodItemId: f.id.startsWith('food-') ? undefined : f.id,
        foodName: f.name,
        quantityG: 150, // standard default portion
      }));

      await createMeal({
        mealType: selectedMeal,
        consumedAt: new Date().toISOString(),
        note: 'Ghi nhanh từ tìm kiếm',
        items,
      });

      Alert.alert('Thành công', `Đã ghi nhận ${selectedCount} món vào nhật ký!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể lưu bữa ăn.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Trở lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Tìm Kiếm Món Ăn
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Meal Selector Tabs */}
        <View style={styles.mealTabsContainer}>
          {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as MealType[]).map((m) => {
            const label =
              m === 'BREAKFAST'
                ? 'Bữa Sáng'
                : m === 'LUNCH'
                ? 'Bữa Trưa'
                : m === 'DINNER'
                ? 'Bữa Tối'
                : 'Bữa Phụ';
            const isSelected = selectedMeal === m;

            return (
              <TouchableOpacity
                key={m}
                style={[styles.mealTab, isSelected && styles.activeMealTab]}
                onPress={() => setSelectedMeal(m)}
              >
                <Text style={[styles.mealTabText, isSelected && styles.activeMealTabText]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Input Bar & Scanner */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.outline} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm món ăn, nguyên liệu, quét..."
              placeholderTextColor={Colors.outline}
              value={searchTerm}
              onChangeText={setSearchTerm}
              returnKeyType="search"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Ionicons name="close-circle" size={18} color={Colors.outline} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.scannerBtn}
            onPress={() => Alert.alert('Quét món ăn', 'Tính năng quét mã vạch và nhận diện camera AI đang được khởi tạo.')}
          >
            <Ionicons name="camera-outline" size={24} color="#004c22" />
          </TouchableOpacity>
        </View>

        {/* Quick Filter Horizontal Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isSelected && styles.activeCategoryChip]}
                onPress={() => setSelectedCategory(cat)}
              >
                {isSelected && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                <Text style={[styles.categoryText, isSelected && styles.activeCategoryText]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Recent Searches Chips */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <View style={styles.recentTitleRow}>
              <Ionicons name="time-outline" size={16} color={Colors.onSurfaceVariant} />
              <Text style={styles.recentTitle}>Tìm kiếm gần đây</Text>
            </View>
          </View>
          <View style={styles.recentChipsWrap}>
            {RECENT_SEARCHES.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.recentChip}
                onPress={() => setSearchTerm(item)}
              >
                <Text style={styles.recentChipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Results Section Title */}
        <View style={styles.resultsTitleRow}>
          <Text style={styles.resultsTitle}>
            {searchTerm.trim() ? `Kết quả tìm kiếm ("${searchTerm}")` : 'Món ăn Việt phổ biến'}
          </Text>
          <Text style={styles.resultsSubtitle}>{displayedFoods.length} món gợi ý</Text>
        </View>

        {isSearching ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Đang tra cứu cơ sở dữ liệu dinh dưỡng...</Text>
          </View>
        ) : (
          <View style={styles.foodList}>
            {displayedFoods.map((item: any) => {
              const isSelected = !!selectedFoods[item.id];

              return (
                <View key={item.id} style={styles.foodCard}>
                  {/* Click card to open custom portion detail */}
                  <TouchableOpacity
                    style={styles.foodCardContent}
                    onPress={() => handleOpenAddDetails(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.foodCardIconBox}>
                      <Ionicons name="restaurant-outline" size={24} color={Colors.primary} />
                      {isSelected && (
                        <View style={styles.selectedFoodCheckBadge}>
                          <Ionicons name="checkmark" size={10} color="#ffffff" />
                        </View>
                      )}
                    </View>
                    <View style={styles.foodCardInfo}>
                      <View style={styles.foodCardNameRow}>
                        <Text style={styles.foodCardName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={styles.kcalBadge}>
                          <Text style={styles.kcalBadgeText}>{item.calories} kcal</Text>
                        </View>
                      </View>
                      <Text style={styles.foodCardPortion}>{item.portion}</Text>
                      <View style={styles.foodCardMacros}>
                        <Text style={styles.macroTag}>
                          <Text style={styles.macroTagBold}>{item.protein}g</Text> Đạm
                        </Text>
                        <Text style={styles.macroDot}>•</Text>
                        <Text style={styles.macroTag}>
                          <Text style={styles.macroTagBold}>{item.carbs}g</Text> Carb
                        </Text>
                        <Text style={styles.macroDot}>•</Text>
                        <Text style={styles.macroTag}>
                          <Text style={styles.macroTagBold}>{item.fat}g</Text> Béo
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Quick Select Toggle Button */}
                  <TouchableOpacity
                    style={[styles.quickSelectBtn, isSelected && styles.quickSelectBtnActive]}
                    onPress={() => toggleSelectFood(item)}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark' : 'add'}
                      size={20}
                      color={isSelected ? '#ffffff' : Colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Bar (Appears when >= 1 item selected) */}
      {selectedCount > 0 && (
        <View style={styles.floatingBottomBar}>
          <View style={styles.floatingInner}>
            <View style={styles.floatingLeft}>
              <View style={styles.floatingIcon}>
                <Ionicons name="restaurant" size={18} color="#004c22" />
              </View>
              <View>
                <Text style={styles.floatingSelectedText}>
                  Đã chọn <Text style={{ fontWeight: '700' }}>{selectedCount} món</Text>
                </Text>
                <Text style={styles.floatingKcalText}>Tổng: {totalSelectedKcal} kcal</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.floatingCtaBtn}
              onPress={handleLogSelectedDirectly}
              disabled={isCreatingMeal}
            >
              {isCreatingMeal ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.floatingCtaText}>Ghi nhận ngay</Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  headerRightSpacer: {
    width: 60,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.margin,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  mealTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f3ff',
    padding: 4,
    borderRadius: BorderRadius.full,
  },
  mealTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  activeMealTab: {
    backgroundColor: Colors.primary,
    ...Shadows.soft,
  },
  mealTabText: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
  },
  activeMealTabText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: 50,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    gap: 10,
    ...Shadows.soft,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.onSurface,
  },
  scannerBtn: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#a6f4b5',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  categoriesScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f3ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  activeCategoryChip: {
    backgroundColor: '#166534',
  },
  categoryText: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  recentSection: {
    gap: 8,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentTitle: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
  },
  recentChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    ...Shadows.soft,
  },
  recentChipText: {
    ...Typography.bodySmall,
    color: Colors.onSurface,
  },
  resultsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  resultsTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  resultsSubtitle: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  foodList: {
    gap: 10,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 12,
    gap: 10,
    ...Shadows.soft,
  },
  foodCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  foodCardIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#f1f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedFoodCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodCardInfo: {
    flex: 1,
    gap: 2,
  },
  foodCardNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  foodCardName: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
    flex: 1,
  },
  kcalBadge: {
    backgroundColor: '#a6f4b5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  kcalBadgeText: {
    ...Typography.labelSmall,
    color: '#005226',
    fontWeight: '700',
  },
  foodCardPortion: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  foodCardMacros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  macroTag: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  macroTagBold: {
    color: Colors.onSurface,
    fontWeight: '600',
  },
  macroDot: {
    ...Typography.labelSmall,
    color: Colors.outlineVariant,
  },
  quickSelectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e1e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSelectBtnActive: {
    backgroundColor: '#166534',
  },
  floatingBottomBar: {
    position: 'absolute',
    bottom: 20,
    left: Spacing.margin,
    right: Spacing.margin,
  },
  floatingInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 16,
    ...Shadows.elevated,
  },
  floatingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#a6f4b5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingSelectedText: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
  },
  floatingKcalText: {
    ...Typography.labelSmall,
    color: Colors.secondary,
    fontWeight: '700',
  },
  floatingCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#166534',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  floatingCtaText: {
    ...Typography.labelMedium,
    color: '#ffffff',
    fontWeight: '700',
  },
});

