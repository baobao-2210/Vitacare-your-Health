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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../src/constants/theme';
import { useActivityToday } from '../../src/hooks/useActivity';
import { ActivityType } from '../../src/types';

const ACTIVITIES: {
  type: ActivityType;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}[] = [
  { type: 'WALKING', label: 'Đi bộ', icon: 'walk', color: '#004c22' },
  { type: 'RUNNING', label: 'Chạy bộ', icon: 'run', color: '#005226' },
  { type: 'CYCLING', label: 'Đạp xe', icon: 'bike', color: '#006591' },
  { type: 'GYM', label: 'Tập Gym', icon: 'dumbbell', color: '#825100' },
  { type: 'OTHER', label: 'Bơi lội', icon: 'swim', color: '#0284c7' },
  { type: 'OTHER', label: 'Yoga', icon: 'yoga', color: '#854d0e' },
  { type: 'OTHER', label: 'Cầu lông', icon: 'badminton', color: '#9d174d' },
  { type: 'OTHER', label: 'Bóng đá', icon: 'soccer', color: '#166534' },
  { type: 'OTHER', label: 'Nhảy dây', icon: 'jump-rope', color: '#6bff8f' },
];

const FEELINGS = [
  { emoji: '😫', label: 'Rất mệt' },
  { emoji: '🥱', label: 'Mỏi cơ' },
  { emoji: '😊', label: 'Khỏe khoắn' },
  { emoji: '🔥', label: 'Rất sung' },
  { emoji: '🏆', label: 'Kỷ lục mới' },
];

export default function ActivityAddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const initialType = (params.type as ActivityType) || 'RUNNING';

  const [selectedActivity, setSelectedActivity] = useState<ActivityType>(initialType);
  const [duration, setDuration] = useState(45);
  const [distanceKm, setDistanceKm] = useState('5.2');
  const [caloriesBurned, setCaloriesBurned] = useState('380');
  const [heartRate, setHeartRate] = useState('142');
  const [intensity, setIntensity] = useState(2); // 1, 2, 3, 4
  const [isOutdoor, setIsOutdoor] = useState(true);
  const [locationName, setLocationName] = useState('Công viên Gia Định, TP.HCM');
  const [selectedFeeling, setSelectedFeeling] = useState('😊');
  const [note, setNote] = useState('');

  const { createActivity, isCreatingActivity } = useActivityToday();

  const handleSave = async () => {
    try {
      // Calculate steps if walking or running
      const calculatedSteps =
        selectedActivity === 'RUNNING'
          ? Math.round(Number(distanceKm) * 1250)
          : selectedActivity === 'WALKING'
          ? Math.round(Number(distanceKm) * 1400)
          : undefined;

      await createActivity({
        activityType: selectedActivity,
        durationMinutes: duration,
        steps: calculatedSteps,
        recordedAt: new Date().toISOString(),
      });

      Alert.alert('Thành công', 'Đã lưu buổi tập vào nhật ký!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể lưu hoạt động.');
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
          Thêm Hoạt Động
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Encouragement Banner */}
        <View style={styles.encouragementBanner}>
          <View style={styles.encourageLeft}>
            <View style={styles.encourageIconBox}>
              <Ionicons name="pulse" size={22} color="#005226" />
            </View>
            <View>
              <Text style={styles.encourageTitle}>Ghi chép buổi tập</Text>
              <Text style={styles.encourageSub}>Duy trì thói quen sống tích cực hôm nay!</Text>
            </View>
          </View>
          <View style={styles.todayPill}>
            <Text style={styles.todayPillText}>Hôm nay</Text>
          </View>
        </View>

        {/* Activity Type Selector */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Bộ môn vận động</Text>
            <Text style={styles.sectionSubtitle}>9 môn tập</Text>
          </View>
          <View style={styles.activitiesGrid}>
            {ACTIVITIES.map((act, i) => {
              const isSelected = selectedActivity === act.type && (i === 1 || act.type !== 'RUNNING');
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.activityTile, isSelected && styles.activeActivityTile]}
                  onPress={() => setSelectedActivity(act.type)}
                >
                  <View
                    style={[
                      styles.activityIconWrap,
                      isSelected && styles.activeActivityIconWrap,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={act.icon}
                      size={24}
                      color={isSelected ? '#6bff8f' : Colors.onSurfaceVariant}
                    />
                  </View>
                  <Text
                    style={[
                      styles.activityTileLabel,
                      isSelected && styles.activeActivityTileLabel,
                    ]}
                  >
                    {act.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Core Metrics Section */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Thông số bài tập</Text>

          {/* Duration Stepper Card */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardTop}>
              <View style={styles.metricCardLabelCol}>
                <Text style={styles.metricCardLabel}>Thời lượng tập</Text>
                <Text style={styles.metricCardSub}>Đã bao gồm khởi động</Text>
              </View>
              <View style={styles.stepperWrap}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setDuration((d) => Math.max(5, d - 5))}
                >
                  <Ionicons name="remove" size={18} color={Colors.onSurface} />
                </TouchableOpacity>
                <View style={styles.stepperValueBox}>
                  <Text style={styles.stepperNumberText}>{duration}</Text>
                  <Text style={styles.stepperUnitText}>phút</Text>
                </View>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setDuration((d) => Math.min(300, d + 5))}
                >
                  <Ionicons name="add" size={18} color={Colors.onSurface} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Duration Pills */}
            <View style={styles.quickPillsRow}>
              {[15, 30, 45, 60, 90].map((min) => {
                const isActive = duration === min;
                return (
                  <TouchableOpacity
                    key={min}
                    style={[styles.quickMinPill, isActive && styles.activeQuickMinPill]}
                    onPress={() => setDuration(min)}
                  >
                    <Text
                      style={[
                        styles.quickMinText,
                        isActive && styles.activeQuickMinText,
                      ]}
                    >
                      {min}p
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Distance & Calories Bento */}
          <View style={styles.bentoRow}>
            {/* Distance */}
            <View style={styles.bentoBox}>
              <View style={styles.bentoHead}>
                <Text style={styles.bentoHeadLabel}>Quãng đường</Text>
                <Ionicons name="map-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.bentoInputRow}>
                <TextInput
                  style={styles.bentoInput}
                  keyboardType="decimal-pad"
                  value={distanceKm}
                  onChangeText={setDistanceKm}
                />
                <Text style={styles.bentoInputUnit}>km</Text>
              </View>
              <Text style={styles.bentoSubText}>Pace ~8'39"/km</Text>
            </View>

            {/* Calories */}
            <View style={styles.bentoBox}>
              <View style={styles.bentoHead}>
                <Text style={styles.bentoHeadLabel}>Năng lượng</Text>
                <Ionicons name="flame-outline" size={18} color="#ea580c" />
              </View>
              <View style={styles.bentoInputRow}>
                <TextInput
                  style={[styles.bentoInput, { color: Colors.primary }]}
                  keyboardType="number-pad"
                  value={caloriesBurned}
                  onChangeText={setCaloriesBurned}
                />
                <Text style={styles.bentoInputUnit}>kcal</Text>
              </View>
              <Text style={styles.bentoSubText}>Chuẩn theo 68kg</Text>
            </View>
          </View>

          {/* Heart Rate Optional */}
          <View style={styles.heartRateCard}>
            <View style={styles.heartRateLeft}>
              <View style={styles.heartIconCircle}>
                <Ionicons name="heart" size={20} color={Colors.error} />
              </View>
              <View>
                <Text style={styles.heartTitle}>Nhịp tim trung bình</Text>
                <Text style={styles.heartSub}>Không bắt buộc</Text>
              </View>
            </View>
            <View style={styles.heartRateInputBox}>
              <TextInput
                style={styles.heartRateInput}
                keyboardType="number-pad"
                value={heartRate}
                onChangeText={setHeartRate}
              />
              <Text style={styles.bpmText}>bpm</Text>
            </View>
          </View>
        </View>

        {/* Workout Intensity */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Cường độ luyện tập</Text>
            <Text style={styles.sectionSubtitle}>Thang RPE</Text>
          </View>
          <View style={styles.intensityList}>
            {[
              { level: 1, title: 'Nhẹ nhàng', desc: 'Thư giãn, phục hồi (RPE 1-3)' },
              { level: 2, title: 'Vừa phải', desc: 'Thở hơi gấp, vẫn trò chuyện được (RPE 4-6)' },
              { level: 3, title: 'Cường độ cao', desc: 'Thở dốc, đổ mồ hôi nhiều (RPE 7-8)' },
              { level: 4, title: 'Cực đại', desc: 'HIIT / Nước rút hết sức (RPE 9-10)' },
            ].map((item) => {
              const isSelected = intensity === item.level;
              return (
                <TouchableOpacity
                  key={item.level}
                  style={[styles.intensityCard, isSelected && styles.activeIntensityCard]}
                  onPress={() => setIntensity(item.level)}
                >
                  <View style={styles.intensityLeft}>
                    <View
                      style={[
                        styles.intensityLevelCircle,
                        isSelected && styles.activeIntensityLevelCircle,
                      ]}
                    >
                      <Text
                        style={[
                          styles.intensityLevelText,
                          isSelected && styles.activeIntensityLevelText,
                        ]}
                      >
                        {item.level}
                      </Text>
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.intensityTitle,
                          isSelected && styles.activeIntensityTitle,
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.intensityDesc}>{item.desc}</Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Location & Environment */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Địa điểm & Môi trường</Text>
          <View style={styles.locationCard}>
            <View style={styles.envToggleRow}>
              <TouchableOpacity
                style={[styles.envToggleBtn, isOutdoor && styles.activeEnvToggleBtn]}
                onPress={() => setIsOutdoor(true)}
              >
                <Ionicons name="leaf-outline" size={16} color={isOutdoor ? Colors.primary : Colors.onSurfaceVariant} />
                <Text style={[styles.envToggleText, isOutdoor && styles.activeEnvToggleText]}>
                  Ngoài trời (GPS)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.envToggleBtn, !isOutdoor && styles.activeEnvToggleBtn]}
                onPress={() => setIsOutdoor(false)}
              >
                <Ionicons name="fitness-outline" size={16} color={!isOutdoor ? Colors.primary : Colors.onSurfaceVariant} />
                <Text style={[styles.envToggleText, !isOutdoor && styles.activeEnvToggleText]}>
                  Trong nhà / Máy
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.locationInputBox}>
              <Ionicons name="location-outline" size={20} color={Colors.primary} />
              <TextInput
                style={styles.locationInput}
                placeholder="Nhập tên tuyến đường hoặc phòng tập..."
                placeholderTextColor={Colors.outline}
                value={locationName}
                onChangeText={setLocationName}
              />
            </View>
          </View>
        </View>

        {/* Post-workout Feeling */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Cảm nhận sau buổi tập</Text>
          <View style={styles.feelingsGrid}>
            {FEELINGS.map((f) => {
              const isSelected = selectedFeeling === f.emoji;
              return (
                <TouchableOpacity
                  key={f.label}
                  style={[styles.feelingBtn, isSelected && styles.activeFeelingBtn]}
                  onPress={() => setSelectedFeeling(f.emoji)}
                >
                  <Text style={styles.feelingEmoji}>{f.emoji}</Text>
                  <Text
                    style={[
                      styles.feelingLabel,
                      isSelected && styles.activeFeelingLabel,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Personal Notes */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Ghi chú cá nhân</Text>
          <TextInput
            style={styles.notesArea}
            placeholder="Ghi lại cảm giác chân, nhịp thở hoặc bạn đồng hành..."
            placeholderTextColor={Colors.outline}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Hydration Reward Banner */}
        <View style={styles.hydrationBanner}>
          <Ionicons name="water" size={22} color={Colors.secondary} />
          <Text style={styles.hydrationBannerText}>
            Hoạt động sẽ được tính vào <Text style={{ fontWeight: '700', color: Colors.primary }}>Vòng vận động</Text> và lượng nước bù khuyến nghị: <Text style={{ fontWeight: '700', color: Colors.secondary }}>+450ml</Text>.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSave}
          disabled={isCreatingActivity}
        >
          {isCreatingActivity ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.submitBtnText}>Lưu hoạt động vào nhật ký</Text>
            </>
          )}
        </TouchableOpacity>
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
    paddingBottom: 40,
    gap: Spacing.lg,
  },
  encouragementBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    ...Shadows.soft,
  },
  encourageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  encourageIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6bff8f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  encourageTitle: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  encourageSub: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  todayPill: {
    backgroundColor: '#a6f4b5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  todayPillText: {
    ...Typography.labelSmall,
    color: '#005226',
    fontWeight: '700',
  },
  sectionWrap: {
    gap: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  sectionSubtitle: {
    ...Typography.labelSmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityTile: {
    width: '31%',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
    gap: 6,
  },
  activeActivityTile: {
    backgroundColor: '#166534',
  },
  activityIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeActivityIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  activityTileLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  activeActivityTileLabel: {
    color: '#ffffff',
    fontWeight: '700',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.soft,
  },
  metricCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricCardLabelCol: {
    gap: 2,
  },
  metricCardLabel: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  metricCardSub: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3ff',
    borderRadius: BorderRadius.full,
    padding: 3,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  stepperValueBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 12,
    gap: 4,
  },
  stepperNumberText: {
    ...Typography.headlineMedium,
    color: Colors.primary,
    fontWeight: '800',
  },
  stepperUnitText: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  quickPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickMinPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: '#f1f3ff',
    alignItems: 'center',
  },
  activeQuickMinPill: {
    backgroundColor: '#166534',
  },
  quickMinText: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  activeQuickMinText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bentoBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 6,
    ...Shadows.soft,
  },
  bentoHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoHeadLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  bentoInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  bentoInput: {
    ...Typography.displayLarge,
    color: Colors.onSurface,
    fontWeight: '800',
    padding: 0,
    minWidth: 50,
  },
  bentoInputUnit: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
  },
  bentoSubText: {
    ...Typography.labelSmall,
    color: Colors.secondary,
    fontSize: 11,
  },
  heartRateCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  heartRateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heartIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffdad6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartTitle: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  heartSub: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  heartRateInputBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#f1f3ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  heartRateInput: {
    ...Typography.headlineMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    padding: 0,
    textAlign: 'right',
  },
  bpmText: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  intensityList: {
    gap: 8,
  },
  intensityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 12,
    ...Shadows.soft,
  },
  activeIntensityCard: {
    backgroundColor: '#e9edff',
  },
  intensityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  intensityLevelCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIntensityLevelCircle: {
    backgroundColor: Colors.primary,
  },
  intensityLevelText: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  activeIntensityLevelText: {
    color: '#ffffff',
  },
  intensityTitle: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  activeIntensityTitle: {
    color: Colors.primary,
  },
  intensityDesc: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  locationCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 12,
    ...Shadows.soft,
  },
  envToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f3ff',
    padding: 3,
    borderRadius: BorderRadius.lg,
  },
  envToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  activeEnvToggleBtn: {
    backgroundColor: '#ffffff',
    ...Shadows.soft,
  },
  envToggleText: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  activeEnvToggleText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  locationInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    gap: 8,
  },
  locationInput: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.onSurface,
  },
  feelingsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  feelingBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
    ...Shadows.soft,
  },
  activeFeelingBtn: {
    backgroundColor: '#6bff8f',
  },
  feelingEmoji: {
    fontSize: 22,
  },
  feelingLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  activeFeelingLabel: {
    color: '#005226',
    fontWeight: '700',
  },
  notesArea: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 12,
    ...Typography.bodyMedium,
    color: Colors.onSurface,
    minHeight: 70,
    ...Shadows.soft,
  },
  hydrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#e1e8ff',
    padding: 12,
    borderRadius: BorderRadius.xl,
  },
  hydrationBannerText: {
    ...Typography.bodySmall,
    color: Colors.onSurface,
    flex: 1,
    lineHeight: 18,
  },
  submitBtn: {
    backgroundColor: '#166534',
    height: 52,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.elevated,
  },
  submitBtnText: {
    ...Typography.labelLarge,
    color: '#ffffff',
    fontWeight: '700',
  },
});

