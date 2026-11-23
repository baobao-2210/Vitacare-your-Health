import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
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

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tính toán độ mạnh mật khẩu (Password Strength)
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, text: 'Chưa nhập', color: Colors.border };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, text: 'Yếu', color: '#DC2626' }; // Red
      case 2:
        return { score: 2, text: 'Trung bình', color: '#F59E0B' }; // Amber
      case 3:
        return { score: 3, text: 'Khá tốt', color: '#10B981' }; // Green
      case 4:
      default:
        return { score: 4, text: 'Rất mạnh', color: '#006C4C' }; // Primary Green
    }
  }, [password]);

  const validateForm = (): boolean => {
    setErrorMessage(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Họ và tên phải có ít nhất 2 ký tự.');
      return false;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ Email.');
      return false;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMessage('Định dạng Email không hợp lệ (Ví dụ: user@example.com).');
      return false;
    }

    if (!password) {
      setErrorMessage('Vui lòng nhập Mật khẩu.');
      return false;
    }

    if (password.length < 8) {
      setErrorMessage('Mật khẩu bảo mật phải có độ dài tối thiểu 8 ký tự.');
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp.');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const res = await api.post('/auth/register', {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        timezone: 'Asia/Ho_Chi_Minh',
      });

      const payload = res.data?.data || res.data;
      if (!payload?.tokens?.accessToken) {
        throw new Error('Dữ liệu phản hồi đăng ký không hợp lệ.');
      }

      // Tự động đăng nhập với token vừa tạo và chuyển sang ứng dụng
      await login(payload.tokens, payload.user, payload.user?.healthProfile);

      Alert.alert(
        'Đăng ký thành công',
        `Chào mừng ${payload.user?.fullName} đến với VitaCare! Hồ sơ sức khỏe của bạn đã sẵn sàng.`,
        [{ text: 'Bắt đầu ngay', onPress: () => router.replace('/(tabs)') }],
      );
    } catch (error: any) {
      if (error?.response) {
        const status = error.response.status;
        const serverMsg = error.response.data?.message;

        if (status === 409) {
          setErrorMessage(serverMsg || 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc chọn email khác.');
        } else if (status === 400) {
          setErrorMessage(serverMsg || 'Dữ liệu đăng ký không hợp lệ.');
        } else if (status >= 500) {
          setErrorMessage('Máy chủ đang bận. Vui lòng thử lại sau.');
        } else {
          setErrorMessage(serverMsg || 'Đăng ký không thành công.');
        }
      } else if (error?.request) {
        setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setErrorMessage(error?.message || 'Đã có lỗi xảy ra.');
      }
    } finally {
      setIsLoading(false);
    }
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
          {/* Header */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.welcomeBox}>
            <Text style={styles.title}>Tạo Tài Khoản Mới</Text>
            <Text style={styles.subtitle}>
              Gia nhập VitaCare để theo dõi và bảo vệ sức khỏe toàn diện của bạn và gia đình
            </Text>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={18} color="#DC2626" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <Text style={styles.inputLabel}>Họ và tên</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="person-outline" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Nguyễn Văn A"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            {/* Email */}
            <Text style={[styles.inputLabel, { marginTop: Spacing.xs }]}>Địa chỉ Email</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="mail-outline" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="user@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Password */}
            <Text style={[styles.inputLabel, { marginTop: Spacing.xs }]}>Mật khẩu</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock-outline" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Tối thiểu 8 ký tự..."
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

            {/* Password Strength Indicator */}
            {password ? (
              <View style={styles.strengthBox}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4].map((step) => (
                    <View
                      key={step}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            step <= passwordStrength.score ? passwordStrength.color : Colors.surfaceContainer,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  Độ mạnh: {passwordStrength.text}
                </Text>
              </View>
            ) : null}

            {/* Confirm Password */}
            <Text style={[styles.inputLabel, { marginTop: Spacing.xs }]}>Xác nhận mật khẩu</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="check-circle-outline" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Nhập lại mật khẩu..."
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Tạo Tài Khoản</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginLink}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
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
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  welcomeBox: {
    marginBottom: Spacing.lg,
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
  strengthBox: {
    marginVertical: 4,
    gap: 4,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
    height: 4,
  },
  strengthBar: {
    flex: 1,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  submitBtn: {
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  loginPrompt: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
});
