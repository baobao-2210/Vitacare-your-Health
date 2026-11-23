import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '../../src/constants/theme';
import { useHealthRecordsList, HealthRecordType, HealthRecord } from '../../src/hooks/useHealthRecords';

const CATEGORY_FILTERS = [
  { id: 'all', label: 'Tất cả', type: undefined, icon: null },
  { id: 'bp', label: 'Huyết áp', type: HealthRecordType.BLOOD_PRESSURE, icon: 'favorite' },
  { id: 'heart', label: 'Nhịp tim', type: HealthRecordType.HEART_RATE, icon: 'show-chart' },
  { id: 'blood', label: 'Đường huyết', type: HealthRecordType.BLOOD_GLUCOSE, icon: 'bloodtype' },
  { id: 'weight', label: 'Cân nặng', type: HealthRecordType.WEIGHT, icon: 'monitor-weight' },
];

export default function HealthRecordsHistoryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilterId, setActiveFilterId] = useState('all');

  const selectedCategory = CATEGORY_FILTERS.find((f) => f.id === activeFilterId);

  const { data: recordsData, isLoading, refetch } = useHealthRecordsList({
    recordType: selectedCategory?.type,
  });

  const records = useMemo(() => {
    const list: HealthRecord[] = Array.isArray(recordsData) ? recordsData : [];
    if (!search.trim()) return list;

    const query = search.toLowerCase();
    return list.filter((r) => {
      const noteMatch = r.note?.toLowerCase().includes(query);
      const valMatch = r.value.toString().includes(query) || (r.secondaryValue && r.secondaryValue.toString().includes(query));
      const typeMatch = r.recordType.toLowerCase().includes(query);
      return noteMatch || valMatch || typeMatch;
    });
  }, [recordsData, search]);

  const getRecordIcon = (type: HealthRecordType) => {
    switch (type) {
      case HealthRecordType.BLOOD_PRESSURE:
        return { name: 'favorite', color: '#DC2626', bg: '#FEE2E2' };
      case HealthRecordType.HEART_RATE:
        return { name: 'show-chart', color: '#EA580C', bg: '#FFEDD5' };
      case HealthRecordType.BLOOD_GLUCOSE:
        return { name: 'bloodtype', color: '#7C3AED', bg: '#EDE9FE' };
      case HealthRecordType.WEIGHT:
        return { name: 'monitor-weight', color: Colors.primary, bg: Colors.primaryFixed };
      default:
        return { name: 'medical-services', color: Colors.secondary, bg: Colors.secondaryFixed };
    }
  };

  const getRecordLabel = (type: HealthRecordType) => {
    switch (type) {
      case HealthRecordType.BLOOD_PRESSURE:
        return 'Huyết áp';
      case HealthRecordType.HEART_RATE:
        return 'Nhịp tim';
      case HealthRecordType.BLOOD_GLUCOSE:
        return 'Đường huyết';
      case HealthRecordType.WEIGHT:
        return 'Cân nặng';
      default:
        return 'Chỉ số khác';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch Sử Đo Sức Khỏe</Text>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => router.push('/health/add')}
          accessibilityLabel="Thêm mới"
        >
          <MaterialIcons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Input Box */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputBox}>
            <MaterialIcons name="search" size={22} color={Colors.primary} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm theo ghi chú, số đo..."
              placeholderTextColor={Colors.textSecondary}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialIcons name="close" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Sync Status Banner */}
        <View style={styles.syncBanner}>
          <View style={styles.syncLeft}>
            <MaterialIcons name="verified-user" size={18} color={Colors.primary} />
            <Text style={styles.syncTitle}>Dữ liệu Y tế Cá nhân</Text>
          </View>
          <View style={styles.syncRight}>
            <View style={styles.syncDot} />
            <Text style={styles.syncCount}>
              {records.length} bản ghi
            </Text>
          </View>
        </View>

        {/* Category Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
          {CATEGORY_FILTERS.map((cat) => {
            const active = activeFilterId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveFilterId(cat.id)}
                activeOpacity={0.7}
              >
                {cat.icon && (
                  <MaterialIcons
                    name={cat.icon as any}
                    size={15}
                    color={active ? '#FFFFFF' : Colors.text}
                  />
                )}
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Records List */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Đang tải lịch sử chỉ số...</Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <MaterialIcons name="favorite-border" size={48} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Chưa có bản ghi nào</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilterId === 'all'
                ? 'Hãy ghi nhận các chỉ số huyết áp, đường huyết, nhịp tim hoặc cân nặng đầu tiên của bạn.'
                : `Chưa có bản ghi nào thuộc loại ${selectedCategory?.label}.`}
            </Text>
            <TouchableOpacity
              style={styles.addFirstBtn}
              onPress={() => router.push('/health/add')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addFirstBtnText}>+ Thêm Chỉ Số Đo Mới</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.recordsList}>
            {records.map((item) => {
              const iconMeta = getRecordIcon(item.recordType);
              const label = getRecordLabel(item.recordType);
              const formattedVal =
                item.recordType === HealthRecordType.BLOOD_PRESSURE
                  ? `${item.value}/${item.secondaryValue || '--'}`
                  : `${item.value}`;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.recordCard}
                  onPress={() => router.push(`/health/${item.id}` as any)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.typeIconBox, { backgroundColor: iconMeta.bg }]}>
                      <MaterialIcons name={iconMeta.name as any} size={22} color={iconMeta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recordTypeLabel}>{label}</Text>
                      <Text style={styles.recordTime}>
                        {dayjs(item.recordedAt).format('DD/MM/YYYY • HH:mm')}
                      </Text>
                    </View>
                    <View style={styles.sourceTag}>
                      <Text style={styles.sourceTagText}>{item.source || 'MANUAL'}</Text>
                    </View>
                  </View>

                  {/* Value Row */}
                  <View style={styles.valueRow}>
                    <Text style={styles.valueText}>{formattedVal}</Text>
                    <Text style={styles.unitText}>{item.unit}</Text>
                  </View>

                  {/* Note preview if any */}
                  {item.note ? (
                    <View style={styles.noteBox}>
                      <MaterialIcons name="notes" size={14} color={Colors.textSecondary} />
                      <Text style={styles.noteText} numberOfLines={2}>
                        {item.note}
                      </Text>
                    </View>
                  ) : null}

                  {/* Footer Tap Guide */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardFooterHint}>Chạm để xem chi tiết / chỉnh sửa</Text>
                    <MaterialIcons name="chevron-right" size={18} color={Colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
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
  headerIconBtn: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.text,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  syncRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  syncCount: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  filterPillsRow: {
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
  recordsList: {
    gap: Spacing.sm,
  },
  recordCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordTypeLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  recordTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  sourceTag: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  sourceTagText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  valueText: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  unitText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  noteText: {
    fontSize: 11,
    color: Colors.text,
    flex: 1,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainer,
  },
  cardFooterHint: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  centerContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
    marginTop: Spacing.md,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },
  addFirstBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
});
