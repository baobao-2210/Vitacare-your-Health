import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Shadows } from '../../src/constants/theme';
import { useMedicationDetail, useDeleteMedication, useMedicationsToday } from '../../src/hooks/useMedication';

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: med, isLoading } = useMedicationDetail(id);
  const deleteMutation = useDeleteMedication();
  const { confirmLog, isConfirming } = useMedicationsToday();

  const handleDelete = () => {
    Alert.alert(
      'Xóa thuốc',
      `Bạn có chắc chắn muốn xóa thuốc "${med?.name}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id);
              router.back();
            } catch {
              Alert.alert('Lỗi', 'Không thể xóa thuốc.');
            }
          },
        },
      ]
    );
  };

  const handleTakeNow = async (scheduleId: string) => {
    try {
      const now = new Date().toISOString();
      await confirmLog({
        scheduleId,
        scheduledAt: now,
        status: 'TAKEN',
        takenAt: now,
      });
      Alert.alert('Thành công', 'Đã ghi nhận uống thuốc thành công!');
    } catch {
      Alert.alert('Lỗi', 'Không thể ghi nhận lúc này.');
    }
  };

  if (isLoading || !med) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const schedules = med.schedules ?? [];

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

        <Text style={styles.headerTitle}>Chi Tiết Thuốc</Text>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Medication Info Card */}
        <View style={[styles.mainCard, Shadows.card]}>
          <View style={styles.cardTop}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="pill" size={32} color={Colors.primary} />
            </View>
            <View style={styles.badgeActive}>
              <Text style={styles.badgeActiveText}>
                {med.isActive ? 'Đang điều trị' : 'Ngưng sử dụng'}
              </Text>
            </View>
          </View>

          <Text style={styles.medName}>{med.name}</Text>
          <Text style={styles.medDosage}>{med.dosageLabel || 'Chưa có thông tin liều'}</Text>

          {med.note && (
            <View style={styles.noteBox}>
              <Ionicons name="information-circle" size={16} color={Colors.primary} />
              <Text style={styles.noteText}>{med.note}</Text>
            </View>
          )}
        </View>

        {/* Schedules */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lịch nhắc uống ({schedules.length})</Text>
        </View>

        {schedules.map((sch) => {
          const time = new Date(sch.reminderTime).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC',
          });

          return (
            <View key={sch.id} style={[styles.schCard, Shadows.card]}>
              <View style={styles.schTop}>
                <View style={styles.schTimeRow}>
                  <Ionicons name="alarm-outline" size={18} color={Colors.primary} />
                  <Text style={styles.schTimeText}>{time}</Text>
                </View>
                <View style={styles.freqBadge}>
                  <Text style={styles.freqBadgeText}>{sch.frequency}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.takeNowBtn}
                onPress={() => handleTakeNow(sch.id)}
                disabled={isConfirming}
              >
                <Ionicons name="checkmark-done" size={18} color={Colors.onPrimary} />
                <Text style={styles.takeNowText}>Uống ngay</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(186, 26, 26, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 24,
    padding: 20,
    marginTop: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeActiveText: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '700',
  },
  medName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
    marginTop: 12,
  },
  medDosage: {
    ...Typography.bodyMedium,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },
  noteText: {
    ...Typography.bodySmall,
    color: Colors.onSurface,
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.margin,
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  schCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.margin,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  schTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  schTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  schTimeText: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  freqBadge: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  freqBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  takeNowBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  takeNowText: {
    ...Typography.labelMedium,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
});

