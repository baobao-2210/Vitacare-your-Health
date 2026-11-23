import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';
import { useDashboard } from '../../src/hooks/useDashboard';
import { useDailyActivity } from '../../src/hooks/useDailyActivity';

export default function HomeScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching, logQuickWater, isLoggingWater } = useDashboard();
  const dailyActivity = useDailyActivity();

  const user = data?.user;
  const water = data?.water;
  const sleep = data?.sleep;
  const activityData = data?.activity;
  const meds = data?.medications;

  // Hợp nhất dữ liệu Live từ cảm biến nội bộ và Dashboard backend
  const liveSteps = Math.max(dailyActivity.steps, activityData?.totalSteps || 0);
  const liveTargetSteps = dailyActivity.targetSteps || activityData?.targetSteps || 6000;
  const liveStepsProgress = liveTargetSteps > 0 ? Math.min(100, Math.round((liveSteps / liveTargetSteps) * 100)) : 0;
  const liveMinutes = Math.max(dailyActivity.activeMinutes, activityData?.totalMinutes || 0);
  const liveCalories = Math.max(
    Math.round(dailyActivity.caloriesKcal),
    Math.round(activityData?.caloriesKcal || 0),
    Math.round(liveSteps * 0.045 + liveMinutes * 6)
  );

  // Điểm sức khỏe tính toán từ tiến độ các mục tiêu
  const healthScore = Math.min(
    100,
    Math.round(
      ((water?.progress || 0) * 0.3) +
      ((sleep?.progress || 0) * 0.3) +
      (liveStepsProgress * 0.4)
    )
  ) || 85;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>VC</Text>
          </View>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandTitle}>VitalCare</Text>
              <Text style={styles.brandSubtitle}>• Trang Chủ</Text>
            </View>
            <Text style={styles.greetingSub}>
              Xin chào{user?.fullName ? `, ${user.fullName}` : ''}! Chúc ngày an lành
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.iconEmoji}>🔔</Text>
            <View style={styles.notifBadge} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
      >
        {/* 2. Vital Status Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerContent}>
            <View style={styles.statusPill}>
              <View style={styles.pulseDot} />
              <Text style={styles.statusPillText}>TRẠNG THÁI SỐNG ĐỘNG</Text>
            </View>
            <Text style={styles.bannerTitle}>
              Chào buổi sáng! ✨
            </Text>
            <Text style={styles.bannerDesc}>
              {user?.bmi
                ? `BMI của bạn đạt ${user.bmi} (${user.bmiCategory || 'Bình thường'}). Duy trì nhịp độ nhé!`
                : 'Hôm nay sức khỏe bạn rất tốt, hãy duy trì nhịp độ nhé!'}
            </Text>
          </View>
          <View style={styles.bannerSunIcon}>
            <Text style={{ fontSize: 26 }}>☀️</Text>
          </View>
        </View>

        {/* 3. Overall Health Score Bento Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreLeft}>
            <View style={styles.goldBadge}>
              <View style={styles.goldDot} />
              <Text style={styles.goldBadgeText}>Chỉ số sinh học vàng</Text>
            </View>
            <Text style={styles.scoreLabel}>Điểm sức khỏe tổng thể</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreNum}>{healthScore}</Text>
              <Text style={styles.scoreMax}>/ 100</Text>
              <View style={styles.scoreTag}>
                <Text style={styles.scoreTagText}>Tốt</Text>
              </View>
            </View>
            <Text style={styles.scoreDesc}>
              Duy trì tốt mục tiêu nước và thời lượng vận động để đạt mức tối ưu.
            </Text>
          </View>

          {/* SVG Circular Progress Gauge */}
          <View style={styles.gaugeContainer}>
            <Svg width={96} height={96} viewBox="0 0 100 100">
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke={Colors.surfaceContainer}
                strokeWidth="8"
                fill="transparent"
              />
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke={Colors.primary}
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * healthScore) / 100}
                strokeLinecap="round"
                fill="transparent"
                transform="rotate(-90 50 50)"
              />
            </Svg>
            <View style={styles.gaugeCenter}>
              <Text style={{ fontSize: 20 }}>❤️</Text>
              <Text style={styles.gaugeStatusText}>TỐI ƯU</Text>
            </View>
          </View>
        </View>

        {/* 4. Quick Action Pill Bar */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ghi nhận nhanh</Text>
          <Text style={styles.sectionSub}>Chạm để nhập số liệu</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickBar}
        >
          <TouchableOpacity
            style={styles.quickPill}
            onPress={() => router.push('/(tabs)/health')}
          >
            <View style={[styles.pillIconBox, { backgroundColor: Colors.errorContainer }]}>
              <Text style={{ fontSize: 16 }}>🩺</Text>
            </View>
            <Text style={styles.pillText}>+ Huyết áp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickPill, isLoggingWater && { opacity: 0.6 }]}
            onPress={() => logQuickWater(250)}
            disabled={isLoggingWater}
          >
            <View style={[styles.pillIconBox, { backgroundColor: Colors.secondaryFixed }]}>
              <Text style={{ fontSize: 16 }}>💧</Text>
            </View>
            <Text style={styles.pillText}>+ 250ml Nước</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickPill}
            onPress={() => router.push('/medication')}
          >
            <View style={[styles.pillIconBox, { backgroundColor: Colors.primaryFixed }]}>
              <Text style={{ fontSize: 16 }}>💊</Text>
            </View>
            <Text style={styles.pillText}>+ Uống thuốc</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickPill}
            onPress={() => router.push('/(tabs)/activity')}
          >
            <View style={[styles.pillIconBox, { backgroundColor: Colors.tertiaryFixed }]}>
              <Text style={{ fontSize: 16 }}>🏃</Text>
            </View>
            <Text style={styles.pillText}>+ Vận động</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 5. Today's Vitals Grid (2x2 Bento) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chỉ số hôm nay</Text>
          <Text style={[styles.sectionSub, { color: Colors.primary, fontWeight: '600' }]}>
            Hôm nay
          </Text>
        </View>

        <View style={styles.bentoGrid}>
          {/* Card 1: Bước chân */}
          <TouchableOpacity
            style={styles.bentoCard}
            onPress={() => router.push('/(tabs)/activity')}
            activeOpacity={0.8}
          >
            <View style={styles.bentoTop}>
              <View style={[styles.bentoIcon, { backgroundColor: Colors.primaryFixed }]}>
                <Text style={{ fontSize: 16 }}>👟</Text>
              </View>
              <Text style={[styles.bentoBadge, { color: Colors.primary }]}>
                {liveStepsProgress}%
              </Text>
            </View>
            <View>
              <Text style={styles.bentoLabel}>Bước chân</Text>
              <View style={styles.bentoValRow}>
                <Text style={styles.bentoVal}>
                  {liveSteps.toLocaleString('vi-VN')}
                </Text>
                <Text style={styles.bentoTarget}>
                  / {Math.round(liveTargetSteps / 1000)}k
                </Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${liveStepsProgress}%`, backgroundColor: Colors.primary },
                ]}
              />
            </View>
            <View style={styles.bentoFooter}>
              <Text style={styles.bentoFooterText}>⏱️ {liveMinutes} phút</Text>
              <Text style={styles.bentoFooterText}>
                {liveCalories} kcal
              </Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Nước uống */}
          <TouchableOpacity
            style={styles.bentoCard}
            onPress={() => router.push('/water')}
            activeOpacity={0.8}
          >
            <View style={styles.bentoTop}>
              <View style={[styles.bentoIcon, { backgroundColor: Colors.secondaryFixed }]}>
                <Text style={{ fontSize: 16 }}>💧</Text>
              </View>
              <Text style={[styles.bentoBadge, { color: Colors.secondary }]}>
                {water?.progress || 0}%
              </Text>
            </View>
            <View>
              <Text style={styles.bentoLabel}>Nước uống</Text>
              <View style={styles.bentoValRow}>
                <Text style={styles.bentoVal}>
                  {water?.totalMl ? (water.totalMl / 1000).toFixed(1) : '0.0'}
                </Text>
                <Text style={styles.bentoTarget}>
                  / {water?.targetMl ? (water.targetMl / 1000).toFixed(1) : '2.0'}L
                </Text>
              </View>
            </View>
            <View style={styles.cupsRow}>
              {[1, 2, 3, 4].map((i) => {
                const filled = (water?.totalMl || 0) >= i * 500;
                return (
                  <View
                    key={i}
                    style={[
                      styles.cupSegment,
                      { backgroundColor: filled ? Colors.secondary : Colors.surfaceContainer },
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.bentoFooter}>
              <Text style={styles.bentoFooterText}>
                {water?.remainingMl ? `Còn thiếu ${water.remainingMl}ml` : 'Đã đủ chỉ tiêu! 🎉'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Card 3: Giấc ngủ */}
          <TouchableOpacity
            style={styles.bentoCard}
            onPress={() => router.push('/sleep')}
            activeOpacity={0.8}
          >
            <View style={styles.bentoTop}>
              <View style={[styles.bentoIcon, { backgroundColor: Colors.surfaceVariant }]}>
                <Text style={{ fontSize: 16 }}>🌙</Text>
              </View>
              <Text style={[styles.bentoBadge, { color: Colors.primary }]}>
                {sleep?.quality || '86% Sâu'}
              </Text>
            </View>
            <View>
              <Text style={styles.bentoLabel}>Giấc ngủ đêm qua</Text>
              <View style={styles.bentoValRow}>
                <Text style={styles.bentoVal}>
                  {sleep?.latestDurationHours ? `${sleep.latestDurationHours}h` : '0h'}
                </Text>
                <Text style={styles.bentoTarget}>
                  / {sleep?.targetHours || 8}h
                </Text>
              </View>
            </View>
            <View style={styles.bentoFooter}>
              <Text style={styles.bentoFooterText}>
                {sleep?.isGoalReached ? 'Đạt chuẩn giấc ngủ sâu' : 'Nên ngủ sớm hơn hôm nay'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Card 4: Nhịp tim & Huyết áp */}
          <TouchableOpacity
            style={styles.bentoCard}
            onPress={() => router.push('/(tabs)/health')}
            activeOpacity={0.8}
          >
            <View style={styles.bentoTop}>
              <View style={[styles.bentoIcon, { backgroundColor: Colors.errorContainer }]}>
                <Text style={{ fontSize: 16 }}>❤️</Text>
              </View>
              <Text style={[styles.bentoBadge, { color: Colors.primary }]}>Ổn định</Text>
            </View>
            <View>
              <Text style={styles.bentoLabel}>Nhịp tim gần nhất</Text>
              <View style={styles.bentoValRow}>
                <Text style={styles.bentoVal}>72</Text>
                <Text style={styles.bentoTarget}>bpm</Text>
              </View>
            </View>
            {/* Mini ECG Wave Svg */}
            <View style={{ height: 20, marginTop: 4 }}>
              <Svg width="100%" height="20" viewBox="0 0 100 24">
                <Path
                  d="M0 12 H20 L26 4 L32 20 L38 8 L44 14 L50 12 H100"
                  stroke={Colors.error}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </View>
          </TouchableOpacity>
        </View>

        {/* 6. Medication Reminders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lịch nhắc hôm nay</Text>
          <Text style={[styles.sectionSub, { color: Colors.primary }]}>
            {meds?.totalToday ? `${meds.takenToday}/${meds.totalToday} mục` : 'Không có thuốc'}
          </Text>
        </View>

        <View style={styles.medCard}>
          {meds?.nextReminder ? (
            <View style={styles.medRow}>
              <View style={[styles.medIconBox, { backgroundColor: Colors.tertiaryFixed }]}>
                <Text style={{ fontSize: 18 }}>⏰</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.medName}>{meds.nextReminder.medicationName}</Text>
                <Text style={styles.medSub}>
                  {meds.nextReminder.reminderTime} • {meds.nextReminder.dosageLabel || '1 liều'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.medActionBtn}
                onPress={() => router.push('/medication')}
              >
                <Text style={styles.medActionText}>Uống ngay</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.medEmptyRow}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>💊</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.medName}>Chưa có lịch thuốc cần uống</Text>
                <Text style={styles.medSub}>Thêm đơn thuốc để nhận nhắc nhở đúng giờ</Text>
              </View>
              <TouchableOpacity
                style={styles.medAddBtn}
                onPress={() => router.push('/medication')}
              >
                <Text style={styles.medAddText}>+ Thêm</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 7. Expert Health Advice Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lời khuyên từ chuyên gia</Text>
          <Text style={[styles.sectionSub, { color: Colors.primary }]}>Khám phá</Text>
        </View>

        <View style={styles.articleCard}>
          <View style={styles.articleImagePlaceholder}>
            <View style={styles.articleCategoryBadge}>
              <Text style={styles.articleCategoryText}>Chuyên mục Giấc ngủ</Text>
            </View>
            <Text style={styles.articleImageTitle}>
              5 thói quen giúp cải thiện giấc ngủ sâu tự nhiên
            </Text>
          </View>
          <View style={styles.articleFooter}>
            <View style={styles.authorRow}>
              <View style={styles.authorAvatar}>
                <Text style={{ fontSize: 12 }}>🩺</Text>
              </View>
              <Text style={styles.authorName}>BS. Nguyễn Hoàng Hà • 4 phút đọc</Text>
            </View>
            <Text style={{ fontSize: 18 }}>🔖</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    height: 64,
    paddingHorizontal: Spacing.margin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontWeight: FontWeight.heavy,
    fontSize: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  brandSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  greetingSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconEmoji: {
    fontSize: 20,
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  avatarBtn: {
    padding: 2,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  scroll: {
    padding: Spacing.margin,
    gap: Spacing.md,
  },
  bannerCard: {
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  bannerContent: {
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  statusPillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  bannerDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bannerSunIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  scoreCard: {
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  scoreLeft: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: 6,
  },
  goldDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  goldBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  scoreLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 2,
  },
  scoreNum: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.heavy,
    color: Colors.primary,
  },
  scoreMax: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
  },
  scoreTag: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: 6,
  },
  scoreTagText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  scoreDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 4,
  },
  gaugeContainer: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeStatusText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  sectionSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  quickBar: {
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  pillIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  bentoCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  bentoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bentoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoBadge: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  bentoLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  bentoValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  bentoVal: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  bentoTarget: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  cupsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  cupSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  bentoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  bentoFooterText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  medCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  medIconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  medSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  medActionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  medActionText: {
    color: '#ffffff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  medEmptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medAddBtn: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  medAddText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  articleCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  articleImagePlaceholder: {
    height: 120,
    backgroundColor: Colors.primaryContainer,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  articleCategoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  articleCategoryText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  articleImageTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
  },
  articleFooter: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
