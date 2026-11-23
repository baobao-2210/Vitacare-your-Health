import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/auth.store';
import { api } from '../../src/lib/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const { login, enterDemoMode } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateForm = (): boolean => {
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ Email.');
      return false;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMessage('Định dạng Email không hợp lệ (Ví dụ: user@example.com).');
      return false;
    }

    if (!password.trim()) {
      setErrorMessage('Vui lòng nhập Mật khẩu.');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const res = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        deviceInfo: `${Platform.OS} ${Platform.Version}`,
      });

      const payload = res.data?.data || res.data;
      if (!payload?.tokens?.accessToken) {
        throw new Error('Dữ liệu xác thực không hợp lệ từ máy chủ.');
      }

      await login(payload.tokens, payload.user, payload.user?.healthProfile);
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error?.response) {
        const status = error.response.status;
        const serverMsg = error.response.data?.message;

        if (status === 401) {
          setErrorMessage(serverMsg || 'Email hoặc mật khẩu không chính xác.');
        } else if (status === 400) {
          setErrorMessage(serverMsg || 'Dữ liệu đăng nhập không hợp lệ.');
        } else if (status >= 500) {
          setErrorMessage('Máy chủ đang bận hoặc gặp sự cố. Vui lòng thử lại sau.');
        } else {
          setErrorMessage(serverMsg || 'Đăng nhập không thành công.');
        }
      } else if (error?.request) {
        setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.');
      } else {
        setErrorMessage(error?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    console.log('[Login] handleDemoMode clicked');
    enterDemoMode();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Brand Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <MaterialIcons name="eco" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.brandTitle}>VitaCare</Text>
            <Text style={styles.brandSubtitle}>Your Health, Your Life</Text>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeBox}>
            <Text style={styles.title}>Đăng Nhập</Text>
            <Text style={styles.subtitle}>
              Theo dõi sức khỏe, chỉ số sinh học và lịch trình của bạn mỗi ngày
            </Text>
          </View>

          {/* Server / Validation Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={18} color="#DC2626" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Email Field */}
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="mail-outline" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="your.email@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Password Field */}
            <Text style={[styles.inputLabel, { marginTop: Spacing.sm }]}>Mật khẩu</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock-outline" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Nhập mật khẩu..."
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password Link */}
            <View style={styles.forgotRow}>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Quên mật khẩu',
                    'Vui lòng liên hệ với bộ phận hỗ trợ VitaCare qua email support@vitacare.vn để được cấp lại mật khẩu.',
                  )
                }
              >
                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <Pressable
              style={({ pressed }) => [styles.submitBtn, (isLoading || pressed) && styles.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Đăng Nhập</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </Pressable>

            {/* Demo Mode Button */}
            <Pressable
              style={({ pressed }) => [styles.demoBtn, pressed && { opacity: 0.7 }]}
              onPress={handleDemoMode}
              disabled={isLoading}
            >
              <MaterialIcons name="smart-toy" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.demoBtnText}>Trải Nghiệm Bản Dùng Thử (Demo)</Text>
            </Pressable>

            {/* Register Link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerPrompt}>Chưa có tài khoản? </Text>
              <Pressable onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </Pressable>
            </View>
          </View>

          {/* Security Footnote */}
          <View style={styles.securityFootnote}>
            <MaterialIcons name="verified-user" size={14} color={Colors.primary} />
            <Text style={styles.securityFootnoteText}>
              Bảo mật mã hóa đầu cuối chuẩn y tế HL7 & HIPAA
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  brandTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  brandSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  welcomeBox: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: FontSize.xs,
    fontWeight: '500',
    flex: 1,
  },
  form: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  inputWrapper: {
    height: 50,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  forgotText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  submitBtn: {
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    ...Shadows.card,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  demoBtn: {
    height: 46,
    backgroundColor: Colors.primaryFixed,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  demoBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  registerPrompt: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  securityFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.xl,
  },
  securityFootnoteText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
