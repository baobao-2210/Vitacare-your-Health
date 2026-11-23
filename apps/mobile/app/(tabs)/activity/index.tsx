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
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../src/constants/theme';
import { useActivityToday } from '../../../src/hooks/useActivity';
import { useDailyActivity } from '../../../src/hooks/useDailyActivity';
import { ActivityType, ActivityLog } from '../../../src/types';

const { width } = Dimensions.get('window');

const WEEK_DAYS = [
  { day: 'T2', date: '21' },
  { day: 'T3', date: '22' },
  { day: 'T4', date: '23' },
  { day: 'T5', date: '24', isToday: true },
  { day: 'T6', date: '25' },
  { day: 'T7', date: '26' },
  { day: 'CN', date: '27' },
];

export default function ActivityTabScreen() {
  const router = useRouter();
  const { data: activityData, isLoading, deleteActivity, isDeletingActivity } = useActivityToday();
  const dailyActivity = useDailyActivity();

  // Dữ liệu hợp nhất trực tiếp từ Cảm biến thời gian thực và Backend
  const totalSteps = Math.max(dailyActivity.steps, activityData?.summary?.totalSteps || 0);
  const targetSteps = dailyActivity.targetSteps || activityData?.summary?.targetSteps || 6000;
  const stepsProgress = targetSteps > 0 ? Math.min(100, Math.round((totalSteps / targetSteps) * 100)) : 0;

  const totalMinutes = Math.max(dailyActivity.activeMinutes, activityData?.summary?.totalMinutes || 0);
  const targetMinutes = dailyActivity.targetMinutes || activityData?.summary?.targetMinutes || 30;
  const durationProgress = targetMinutes > 0 ? Math.min(100, Math.round((totalMinutes / targetMinutes) * 100)) : 0;

  const totalCalories = Math.max(
    Math.round(dailyActivity.caloriesKcal),
    Math.round(Number(activityData?.summary?.caloriesKcal) || 0),
    Math.round(totalSteps * 0.045 + totalMinutes * 6)
  );
  const targetCalories = 600;
  const calPercent = targetCalories > 0 ? Math.min(100, Math.round((totalCalories / targetCalories) * 100)) : 0;

  const distanceKm = dailyActivity.distanceKm > 0
    ? dailyActivity.distanceKm.toFixed(1)
    : (activityData?.summary?.distanceKm ? Number(activityData.summary.distanceKm).toFixed(1) : (totalSteps * 0.00072).toFixed(1));

  const logs = activityData?.logs || [];

  // Phân bổ bước chân theo các khung giờ thực tế hôm nay (Live Distribution)
  const currentHour = new Date().getHours();
  const sessionLogs = logs.filter((l: any) => l.steps && l.steps > 0);
  
  const morningSteps = sessionLogs
    .filter((l) => { const h = new Date(l.recordedAt).getHours(); return h >= 5 && h < 12; })
    .reduce((sum, l) => sum + (l.steps || 0), 0);
  const noonSteps = sessionLogs
    .filter((l) => { const h = new Date(l.recordedAt).getHours(); return h >= 12 && h < 14; })
    .reduce((sum, l) => sum + (l.steps || 0), 0);
  const afternoonSteps = sessionLogs
    .filter((l) => { const h = new Date(l.recordedAt).getHours(); return h >= 14 && h < 18; })
    .reduce((sum, l) => sum + (l.steps || 0), 0);
  const eveningSteps = sessionLogs
    .filter((l) => { const h = new Date(l.recordedAt).getHours(); return h >= 18 || h < 5; })
    .reduce((sum, l) => sum + (l.steps || 0), 0);

  const allocated = morningSteps + noonSteps + afternoonSteps + eveningSteps;
  const remaining = Math.max(0, totalSteps - allocated);

  const actualMorning = morningSteps + (currentHour >= 5 && currentHour < 12 ? remaining : 0);
  const actualNoon = noonSteps + (currentHour >= 12 && currentHour < 14 ? remaining : 0);
  const actualAfternoon = afternoonSteps + (currentHour >= 14 && currentHour < 18 ? remaining : 0);
  const actualEvening = eveningSteps + (currentHour >= 18 || currentHour < 5 ? remaining : 0);

  const peakVal = Math.max(actualMorning, actualNoon, actualAfternoon, actualEvening, 1);

  const stepSlots = [
    { label: 'Sáng', val: actualMorning.toLocaleString('vi-VN'), h: totalSteps > 0 && actualMorning > 0 ? `${Math.max(15, Math.round((actualMorning / peakVal) * 100))}%` : '8%', isPeak: actualMorning === peakVal && actualMorning > 0 },
    { label: 'Trưa', val: actualNoon.toLocaleString('vi-VN'), h: totalSteps > 0 && actualNoon > 0 ? `${Math.max(15, Math.round((actualNoon / peakVal) * 100))}%` : '8%', isPeak: actualNoon === peakVal && actualNoon > 0 },
    { label: 'Chiều', val: actualAfternoon.toLocaleString('vi-VN'), h: totalSteps > 0 && actualAfternoon > 0 ? `${Math.max(15, Math.round((actualAfternoon / peakVal) * 100))}%` : '8%', isPeak: actualAfternoon === peakVal && actualAfternoon > 0 },
    { label: 'Tối', val: actualEvening.toLocaleString('vi-VN'), h: totalSteps > 0 && actualEvening > 0 ? `${Math.max(15, Math.round((actualEvening / peakVal) * 100))}%` : '8%', isPeak: actualEvening === peakVal && actualEvening > 0 },
  ];

  // Concentric Tri-Rings Math
  // Outer Ring: Calories (r=68, circumference=427.25)
  const r1 = 68;
  const c1 = 2 * Math.PI * r1;
  const dashoffset1 = c1 - (c1 * Math.min(100, calPercent)) / 100;

  // Middle Ring: Minutes (r=50, circumference=314.16)
  const r2 = 50;
  const c2 = 2 * Math.PI * r2;
  const dashoffset2 = c2 - (c2 * Math.min(100, durationProgress)) / 100;

  // Inner Ring: Standing/Movement (r=32, circumference=201.06)
  const r3 = 32;
  const c3 = 2 * Math.PI * r3;
  const dashoffset3 = c3 - (c3 * Math.min(100, stepsProgress)) / 100;

  const handleDeleteLog = (log: ActivityLog) => {
    Alert.alert('Xóa hoạt động', 'Bạn có chắc chắn muốn xóa bản ghi hoạt động này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteActivity(log.id);
          } catch (e: any) {
            Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể xóa hoạt động.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.brandIconBox}>
            <Ionicons name="heart" size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerBrand}>VITACARE</Text>
            <Text style={styles.headerTitle}>Hoạt Động</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/activity/history' as any)}
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
        {/* User Profile Quick Glance & Week Bar */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingTop}>
            <View style={styles.greetingLeft}>
              <View style={styles.avatarBox}>
                <Ionicons name="person" size={24} color={Colors.primary} />
                <View style={styles.onlineDot} />
              </View>
              <View>
                <View style={styles.nameRow}>
                  <Text style={styles.greetingName}>Chào bạn!</Text>
                  <Text style={styles.lightning}>⚡</Text>
                </View>
                <Text style={styles.profileMeta}>68kg • Mục tiêu năng động</Text>
              </View>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color="#005226" />
              <Text style={styles.streakText}>Chuỗi 12 ngày</Text>
            </View>
          </View>

          {/* Calendar Week Strip */}
          <View style={styles.weekStrip}>
            {WEEK_DAYS.map((d) => (
              <View
                key={d.day}
                style={[styles.weekDayItem, d.isToday && styles.activeWeekDayItem]}
              >
                <Text style={[styles.weekDayLabel, d.isToday && styles.activeWeekDayText]}>
                  {d.day}
                </Text>
                <Text style={[styles.weekDayDate, d.isToday && styles.activeWeekDayText]}>
                  {d.date}
                </Text>
                <View style={[styles.weekDayDot, d.isToday ? styles.activeWeekDot : styles.inactiveWeekDot]} />
              </View>
            ))}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Đang tải dữ liệu hoạt động...</Text>
          </View>
        ) : (
          <>
            {/* Pedometer Sensor Status Banner */}
            {!dailyActivity.permissionGranted ? (
              <View style={styles.sensorStatusCard}>
                <View style={styles.sensorStatusLeft}>
                  <View style={[styles.sensorIconCircle, { backgroundColor: '#ccfbf1' }]}>
                    <Ionicons name="footsteps" size={20} color="#0d9488" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sensorStatusTitle}>Tự Động Đếm Bước Chân</Text>
                    <Text style={styles.sensorStatusSub}>
                      Bật cảm biến Pedometer để tự động theo dõi số bước cả ngày.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.sensorActionBtn}
                  onPress={dailyActivity.requestPermissions}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sensorActionBtnText}>Bật ngay</Text>
                </TouchableOpacity>
              </View>
            ) : !dailyActivity.isSensorAvailable ? (
              <View style={styles.sensorStatusCard}>
                <View style={styles.sensorStatusLeft}>
                  <View style={[styles.sensorIconCircle, { backgroundColor: '#e0f2fe' }]}>
                    <Ionicons name="hardware-chip-outline" size={20} color="#0284c7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sensorStatusTitle}>Máy ảo Android Emulator</Text>
                    <Text style={styles.sensorStatusSub}>
                      Môi trường giả lập chưa có cảm biến bước chân thực tế.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.sensorActionBtn, { backgroundColor: Colors.primary }]}
                  onPress={() => dailyActivity.simulateStepIncrement(100)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sensorActionBtnText}>+100 Bước</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Hero Card: 3 Activity Rings (Tri-Rings) */}
            <View style={styles.triRingsCard}>
              <View style={styles.triRingsHead}>
                <View>
                  <Text style={styles.triRingsSub}>MỤC TIÊU THỂ CHẤT</Text>
                  <Text style={styles.triRingsTitle}>Vòng vận động hôm nay</Text>
                </View>
                <View style={styles.todayDateBadge}>
                  <Text style={styles.todayDateText}>Hôm nay</Text>
                </View>
              </View>

              <View style={styles.triRingsBody}>
                {/* SVG Concentric Tri-Rings */}
                <View style={styles.svgRingWrap}>
                  <Svg width={140} height={140} viewBox="0 0 160 160">
                    {/* Background Tracks */}
                    <Circle cx="80" cy="80" r={r1} stroke="#fee2e2" strokeWidth="12" fill="none" />
                    <Circle cx="80" cy="80" r={r2} stroke="#dcfce7" strokeWidth="12" fill="none" />
                    <Circle cx="80" cy="80" r={r3} stroke="#e0f2fe" strokeWidth="12" fill="none" />

                    {/* Outer Ring: Calories (Red/Orange) */}
                    <Circle
                      cx="80"
                      cy="80"
                      r={r1}
                      stroke="#ea580c"
                      strokeWidth="12"
                      strokeDasharray={`${c1}`}
                      strokeDashoffset={dashoffset1}
                      strokeLinecap="round"
                      fill="none"
                      transform="rotate(-90 80 80)"
                    />
                    {/* Middle Ring: Active Workout (Green) */}
                    <Circle
                      cx="80"
                      cy="80"
                      r={r2}
                      stroke="#006e2f"
                      strokeWidth="12"
                      strokeDasharray={`${c2}`}
                      strokeDashoffset={dashoffset2}
                      strokeLinecap="round"
                      fill="none"
                      transform="rotate(-90 80 80)"
                    />
                    {/* Inner Ring: Stand (Blue) */}
                    <Circle
                      cx="80"
                      cy="80"
                      r={r3}
                      stroke="#0284c7"
                      strokeWidth="12"
                      strokeDasharray={`${c3}`}
                      strokeDashoffset={dashoffset3}
                      strokeLinecap="round"
                      fill="none"
                      transform="rotate(-90 80 80)"
                    />
                  </Svg>
                  <View style={styles.ringCenterIcon}>
                    <Ionicons name="pulse" size={22} color={Colors.secondary} />
                  </View>
                </View>

                {/* Ring Metrics Summary */}
                <View style={styles.ringMetricsCol}>
                  {/* Calo */}
                  <View style={styles.metricRowItem}>
                    <View style={styles.metricItemLeft}>
                      <View style={[styles.colorSquare, { backgroundColor: '#ea580c' }]} />
                      <View>
                        <Text style={styles.metricItemLabel}>Calo tiêu thụ</Text>
                        <Text style={styles.metricItemVal}>
                          {totalCalories}
                          <Text style={styles.metricItemSub}>/{targetCalories} kcal</Text>
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.metricPct, { color: '#ea580c' }]}>{calPercent}%</Text>
                  </View>

                  {/* Active Minutes */}
                  <View style={styles.metricRowItem}>
                    <View style={styles.metricItemLeft}>
                      <View style={[styles.colorSquare, { backgroundColor: '#006e2f' }]} />
                      <View>
                        <Text style={styles.metricItemLabel}>Vận động tích cực</Text>
                        <Text style={styles.metricItemVal}>
                          {totalMinutes}
                          <Text style={styles.metricItemSub}>/{targetMinutes} phút</Text>
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.metricPct, { color: '#006e2f' }]}>
                      {durationProgress}%
                    </Text>
                  </View>

                  {/* Steps Ring (Inner Ring) */}
                  <View style={styles.metricRowItem}>
                    <View style={styles.metricItemLeft}>
                      <View style={[styles.colorSquare, { backgroundColor: '#0284c7' }]} />
                      <View>
                        <Text style={styles.metricItemLabel}>Bước chân</Text>
                        <Text style={styles.metricItemVal}>
                          {totalSteps.toLocaleString('vi-VN')}
                          <Text style={styles.metricItemSub}>/{targetSteps.toLocaleString('vi-VN')} bước</Text>
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.metricPct, { color: '#0284c7' }]}>{stepsProgress}%</Text>
                  </View>
                </View>
              </View>

              {/* Motivational Banner */}
              <View style={styles.triRingsEncourage}>
                <Ionicons name="trophy" size={20} color="#007432" />
                <Text style={styles.triRingsEncourageText}>
                  <Text style={{ fontWeight: '700', color: Colors.primary }}>Rất tốt! </Text>
                  Chỉ còn {Math.max(0, targetCalories - totalCalories)} kcal nữa để chạm mốc khép kín cả 3 vòng hôm nay.
                </Text>
              </View>
            </View>

            {/* Today Steps Detailed Highlight */}
            <View style={styles.stepsCard}>
              <View style={styles.stepsHeader}>
                <View style={styles.stepsHeaderLeft}>
                  <View style={styles.stepsIconBox}>
                    <Ionicons name="footsteps" size={20} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Bước chân hôm nay</Text>
                    <Text style={styles.stepsSub}>Cảm biến nhịp bước Pedometer</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TouchableOpacity
                    style={styles.liveTestPill}
                    onPress={() => dailyActivity.simulateStepIncrement(100)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="flash" size={12} color="#166534" />
                    <Text style={styles.liveTestPillText}>+100 Bước Live</Text>
                  </TouchableOpacity>
                  <View style={styles.stepsBadge}>
                    <Text style={styles.stepsBadgeText}>Đạt {stepsProgress}%</Text>
                  </View>
                </View>
              </View>

              <View style={styles.stepsCountRow}>
                <View>
                  <View style={styles.stepNumWrap}>
                    <Text style={styles.bigStepNumber}>
                      {totalSteps.toLocaleString('vi-VN')}
                    </Text>
                    <Text style={styles.subStepNumber}>
                      / {targetSteps.toLocaleString('vi-VN')} bước
                    </Text>
                  </View>
                </View>
                <View style={styles.stepStatsSide}>
                  <View>
                    <Text style={styles.sideStatLabel}>Quãng đường</Text>
                    <Text style={styles.sideStatVal}>
                      {distanceKm} <Text style={{ fontSize: 12, fontWeight: '400' }}>km</Text>
                    </Text>
                  </View>
                  <View style={styles.vDivider} />
                  <View>
                    <Text style={styles.sideStatLabel}>Thời gian</Text>
                    <Text style={styles.sideStatVal}>
                      {totalMinutes}{' '}
                      <Text style={{ fontSize: 12, fontWeight: '400' }}>phút</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.stepsTrack}>
                <View style={[styles.stepsFill, { width: `${stepsProgress}%` }]} />
              </View>

              {/* Step Distribution Slots */}
              <View style={styles.stepSlotsGrid}>
                {stepSlots.map((slot) => (
                  <View
                    key={slot.label}
                    style={[styles.stepSlotBox, slot.isPeak && styles.stepSlotBoxPeak]}
                  >
                    <Text
                      style={[
                        styles.stepSlotLabel,
                        slot.isPeak && { color: Colors.primary, fontWeight: '700' },
                      ]}
                    >
                      {slot.label}
                    </Text>
                    <View style={styles.stepSlotBarContainer}>
                      <View
                        style={[
                          styles.stepSlotBarFill,
                          { height: slot.h as any },
                          slot.isPeak && { backgroundColor: Colors.primary },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.stepSlotVal,
                        slot.isPeak && { color: Colors.primary, fontWeight: '700' },
                      ]}
                    >
                      {slot.val}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Quick Start Workout Launcher */}
            <View style={styles.sportsSection}>
              <View style={styles.sportsHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Bắt đầu tập luyện</Text>
                  <Text style={styles.sportsSubtitle}>Theo dõi phiên tập tự động theo thời gian thực</Text>
                </View>
              </View>

              <View style={styles.workoutCardsRow}>
                {/* Walking Card */}
                <TouchableOpacity
                  style={styles.workoutCard}
                  onPress={() => router.push('/activity/workout?type=WALKING' as any)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.workoutCardBadge, { backgroundColor: '#a6f4b5' }]}>
                    <MaterialCommunityIcons name="walk" size={28} color="#005226" />
                  </View>
                  <Text style={styles.workoutCardTitle}>Đi bộ</Text>
                  <Text style={styles.workoutCardDesc}>Đếm bước & cự ly</Text>
                  <View style={[styles.workoutStartBadge, { backgroundColor: '#e8f5e9' }]}>
                    <Ionicons name="play" size={13} color="#006e2f" />
                    <Text style={styles.workoutStartText}>Bắt đầu</Text>
                  </View>
                </TouchableOpacity>

                {/* Running Card */}
                <TouchableOpacity
                  style={styles.workoutCard}
                  onPress={() => router.push('/activity/workout?type=RUNNING' as any)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.workoutCardBadge, { backgroundColor: '#ffe0b2' }]}>
                    <MaterialCommunityIcons name="run" size={28} color="#c2410c" />
                  </View>
                  <Text style={styles.workoutCardTitle}>Chạy bộ</Text>
                  <Text style={styles.workoutCardDesc}>Tốc độ, pace & calo</Text>
                  <View style={[styles.workoutStartBadge, { backgroundColor: '#fff7ed' }]}>
                    <Ionicons name="play" size={13} color="#ea580c" />
                    <Text style={[styles.workoutStartText, { color: '#ea580c' }]}>Bắt đầu</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Completed Activities Log */}
            <View style={styles.completedSection}>
              <View style={styles.completedHeader}>
                <Text style={styles.sectionTitle}>Hoạt động đã hoàn thành</Text>
                <Text style={styles.completedCount}>{logs.length} bài tập</Text>
              </View>

              {logs.length > 0 ? (
                logs.map((log) => (
                  <View key={log.id} style={styles.completedCard}>
                    <View style={styles.completedTop}>
                      <View style={styles.completedLeft}>
                        <View style={styles.completedIconBox}>
                          <Ionicons
                            name={
                              log.activityType === 'RUNNING'
                                ? 'walk'
                                : log.activityType === 'CYCLING'
                                ? 'bicycle'
                                : 'fitness'
                            }
                            size={22}
                            color="#005226"
                          />
                        </View>
                        <View>
                          <Text style={styles.completedTitle}>
                            {log.activityType === 'RUNNING'
                              ? 'Chạy bộ ngoài trời'
                              : log.activityType === 'WALKING'
                              ? 'Đi bộ thư giãn'
                              : log.activityType === 'CYCLING'
                              ? 'Đạp xe'
                              : log.activityType === 'GYM'
                              ? 'Tập Gym'
                              : 'Bài tập thể lực'}
                          </Text>
                          <Text style={styles.completedTime}>
                            {log.durationMinutes} phút • {new Date(log.recordedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteLog(log)}
                        disabled={isDeletingActivity}
                        style={styles.delLogBtn}
                      >
                        <Ionicons name="trash-outline" size={16} color={Colors.error} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.completedStatsBento}>
                      {log.steps ? (
                        <View style={styles.bentoMiniCol}>
                          <Text style={styles.bentoMiniLabel}>Bước chân</Text>
                          <Text style={styles.bentoMiniVal}>{log.steps}</Text>
                        </View>
                      ) : null}
                      <View style={styles.bentoMiniCol}>
                        <Text style={styles.bentoMiniLabel}>Năng lượng</Text>
                        <Text style={[styles.bentoMiniVal, { color: '#ea580c' }]}>
                          {Math.round((log.durationMinutes || 30) * 7)} kcal
                        </Text>
                      </View>
                      <View style={styles.bentoMiniCol}>
                        <Text style={styles.bentoMiniLabel}>Thời lượng</Text>
                        <Text style={styles.bentoMiniVal}>{log.durationMinutes}p</Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyActivityBox}>
                  <Ionicons name="fitness-outline" size={36} color={Colors.outlineVariant} />
                  <Text style={styles.emptyActivityTitle}>Chưa có bài tập nào hôm nay</Text>
                  <Text style={styles.emptyActivitySub}>
                    Hãy chọn Đi bộ hoặc Chạy bộ ở trên để bắt đầu phiên luyện tập.
                  </Text>
                </View>
              )}
            </View>

            {/* Weekly Challenge Banner */}
            <View style={styles.challengeCard}>
              <View style={styles.challengeTop}>
                <View style={styles.challengeLeft}>
                  <View style={styles.challengeIconBox}>
                    <Ionicons name="medal" size={24} color="#6bff8f" />
                  </View>
                  <View>
                    <Text style={styles.challengeTag}>THỬ THÁCH TUẦN NÀY</Text>
                    <Text style={styles.challengeTitle}>Chiến binh bền bỉ</Text>
                  </View>
                </View>
                <View style={styles.challengeDaysLeft}>
                  <Text style={styles.challengeDaysLeftText}>Còn 3 ngày</Text>
                </View>
              </View>
              <Text style={styles.challengeDesc}>
                Mục tiêu hoàn thành <Text style={{ fontWeight: '700', color: '#ffffff' }}>50.000 bước chân</Text> trước 23:59 Chủ Nhật.
              </Text>
              <View style={styles.challengeProgressRow}>
                <Text style={styles.challengeCountText}>34.200 / 50.000 bước</Text>
                <Text style={styles.challengePctText}>68% hoàn thành</Text>
              </View>
              <View style={styles.challengeBarTrack}>
                <View style={[styles.challengeBarFill, { width: '68%' }]} />
              </View>
            </View>

            {/* Doctor Recovery Tip */}
            <View style={styles.tipCard}>
              <View style={styles.tipIconBox}>
                <Ionicons name="bulb-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.tipContent}>
                <View style={styles.tipTagRow}>
                  <Text style={styles.tipTitle}>Lời khuyên phục hồi thể chất</Text>
                  <View style={styles.scienceBadge}>
                    <Text style={styles.scienceBadgeText}>KHOA HỌC</Text>
                  </View>
                </View>
                <Text style={styles.tipDesc}>
                  "Giãn cơ 10 phút sau chạy bộ giúp hạ nhịp tim dần đều và giảm 40% nguy cơ căng cứng cơ bắp ngày hôm sau."
                </Text>
                <View style={styles.doctorVerifiedRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#007432" />
                  <Text style={styles.doctorVerifiedText}>Bác sĩ chuyên khoa y học thể thao VitaCare</Text>
                </View>
              </View>
            </View>
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
  sensorStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  sensorStatusLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginRight: Spacing.sm,
  },
  sensorIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  sensorStatusSub: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
  sensorActionBtn: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
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
  greetingSection: {
    gap: Spacing.sm,
  },
  greetingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e1e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#006e2f',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greetingName: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  lightning: {
    fontSize: 16,
  },
  profileMeta: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#a6f4b5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  streakText: {
    ...Typography.labelSmall,
    color: '#005226',
    fontWeight: '700',
  },
  weekStrip: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 8,
    justifyContent: 'space-between',
    ...Shadows.soft,
  },
  weekDayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  activeWeekDayItem: {
    backgroundColor: '#166534',
    ...Shadows.soft,
  },
  weekDayLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  weekDayDate: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
    marginTop: 2,
  },
  activeWeekDayText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  weekDayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 4,
  },
  activeWeekDot: {
    backgroundColor: '#6bff8f',
  },
  inactiveWeekDot: {
    backgroundColor: 'transparent',
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
  triRingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    gap: Spacing.md,
  },
  triRingsHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  triRingsSub: {
    ...Typography.labelSmall,
    color: Colors.secondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  triRingsTitle: {
    ...Typography.headlineMedium,
    color: Colors.onSurface,
  },
  todayDateBadge: {
    backgroundColor: '#f1f3ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  todayDateText: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  triRingsBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  svgRingWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringCenterIcon: {
    position: 'absolute',
  },
  ringMetricsCol: {
    flex: 1,
    gap: 10,
  },
  metricRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorSquare: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  metricItemLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  metricItemVal: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  metricItemSub: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontWeight: '400',
  },
  metricPct: {
    ...Typography.labelMedium,
    fontWeight: '700',
  },
  triRingsEncourage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f1f3ff',
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  triRingsEncourageText: {
    ...Typography.bodySmall,
    color: Colors.onSurface,
    flex: 1,
    lineHeight: 18,
  },
  stepsCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    gap: Spacing.md,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#a6f4b5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...Typography.headlineSmall,
    color: Colors.onSurface,
  },
  stepsSub: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  liveTestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  liveTestPillText: {
    ...Typography.labelSmall,
    color: '#166534',
    fontWeight: '700',
    fontSize: 10,
  },
  stepsBadge: {
    backgroundColor: '#6bff8f30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  stepsBadgeText: {
    ...Typography.labelSmall,
    color: '#007432',
    fontWeight: '700',
  },
  stepsCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  stepNumWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  bigStepNumber: {
    ...Typography.displayLarge,
    color: Colors.onSurface,
    fontWeight: '800',
  },
  subStepNumber: {
    ...Typography.bodyMedium,
    color: Colors.onSurfaceVariant,
  },
  stepStatsSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sideStatLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  sideStatVal: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  vDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.outlineVariant,
  },
  stepsTrack: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e9edff',
    overflow: 'hidden',
  },
  stepsFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  stepSlotsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  stepSlotBox: {
    flex: 1,
    backgroundColor: '#f1f3ff',
    borderRadius: BorderRadius.lg,
    padding: 8,
    alignItems: 'center',
    gap: 4,
  },
  stepSlotBoxPeak: {
    backgroundColor: '#e9edff',
  },
  stepSlotLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  stepSlotBarContainer: {
    width: 12,
    height: 36,
    justifyContent: 'flex-end',
  },
  stepSlotBarFill: {
    width: '100%',
    backgroundColor: '#006e2f',
    borderRadius: 3,
  },
  stepSlotVal: {
    ...Typography.labelSmall,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  sportsSection: {
    gap: Spacing.sm,
  },
  sportsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sportsSubtitle: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  workoutCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  workoutCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Shadows.soft,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  workoutCardBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  workoutCardTitle: {
    ...Typography.titleSmall,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  workoutCardDesc: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
  },
  workoutStartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    marginTop: 6,
  },
  workoutStartText: {
    ...Typography.labelSmall,
    color: '#006e2f',
    fontWeight: '700',
  },
  completedSection: {
    gap: Spacing.sm,
  },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedCount: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  completedCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.soft,
    gap: 10,
  },
  completedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  completedIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#a6f4b5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedTitle: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  completedTime: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  delLogBtn: {
    padding: 6,
  },
  completedStatsBento: {
    flexDirection: 'row',
    backgroundColor: '#f1f3ff',
    padding: 8,
    borderRadius: BorderRadius.lg,
    justifyContent: 'space-around',
  },
  bentoMiniCol: {
    alignItems: 'center',
  },
  bentoMiniLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  bentoMiniVal: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  emptyActivityBox: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    ...Shadows.soft,
  },
  emptyActivityTitle: {
    ...Typography.titleSmall,
    color: Colors.onSurface,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyActivitySub: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
  challengeCard: {
    backgroundColor: '#166534',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: 10,
    ...Shadows.card,
  },
  challengeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  challengeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  challengeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeTag: {
    ...Typography.labelSmall,
    color: '#93e0a2',
    fontWeight: '700',
    fontSize: 10,
  },
  challengeTitle: {
    ...Typography.headlineSmall,
    color: '#ffffff',
    fontWeight: '700',
  },
  challengeDaysLeft: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  challengeDaysLeftText: {
    ...Typography.labelSmall,
    color: '#ffffff',
    fontWeight: '600',
  },
  challengeDesc: {
    ...Typography.bodySmall,
    color: '#ffffff',
    lineHeight: 18,
  },
  challengeProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  challengeCountText: {
    ...Typography.labelSmall,
    color: '#ffffff',
  },
  challengePctText: {
    ...Typography.labelSmall,
    color: '#6bff8f',
    fontWeight: '700',
  },
  challengeBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  challengeBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#6bff8f',
  },
  tipCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  tipIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e1e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
    gap: 4,
  },
  tipTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipTitle: {
    ...Typography.labelLarge,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  scienceBadge: {
    backgroundColor: '#a6f4b5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  scienceBadgeText: {
    ...Typography.labelSmall,
    color: '#005226',
    fontWeight: '700',
    fontSize: 9,
  },
  tipDesc: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  doctorVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  doctorVerifiedText: {
    ...Typography.labelSmall,
    color: '#007432',
    fontSize: 11,
  },
  mainCtaButton: {
    backgroundColor: '#166534',
    height: 52,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.elevated,
  },
  mainCtaButtonText: {
    ...Typography.labelLarge,
    color: '#ffffff',
    fontWeight: '700',
  },
});
