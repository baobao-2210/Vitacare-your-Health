import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_PREF_KEY = 'vitacare_biometric_enabled';

export interface BiometricStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricTypes: LocalAuthentication.AuthenticationType[];
  isEnabledByUser: boolean;
}

export const biometricService = {
  /**
   * Kiểm tra khả năng hỗ trợ sinh trắc học của thiết bị
   */
  async getStatus(): Promise<BiometricStatus> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
      const biometricTypes = hasHardware
        ? await LocalAuthentication.supportedAuthenticationTypesAsync()
        : [];
      const savedPref = await SecureStore.getItemAsync(BIOMETRIC_PREF_KEY);
      const isEnabledByUser = savedPref === 'true';

      return {
        hasHardware,
        isEnrolled,
        biometricTypes,
        isEnabledByUser,
      };
    } catch {
      return {
        hasHardware: false,
        isEnrolled: false,
        biometricTypes: [],
        isEnabledByUser: false,
      };
    }
  },

  /**
   * Bật hoặc tắt cấu hình sinh trắc học
   */
  async setEnabled(enabled: boolean): Promise<boolean> {
    if (enabled) {
      // Xác thực thử trước khi kích hoạt
      const result = await this.authenticate(
        'Xác thực vân tay / Face ID để kích hoạt bảo mật ứng dụng',
      );
      if (!result.success) {
        return false;
      }
      await SecureStore.setItemAsync(BIOMETRIC_PREF_KEY, 'true');
      return true;
    } else {
      await SecureStore.setItemAsync(BIOMETRIC_PREF_KEY, 'false');
      return true;
    }
  },

  /**
   * Thực hiện phiên xác thực sinh trắc học cục bộ
   */
  async authenticate(promptMessage: string = 'Xác thực bảo mật VitaCare'): Promise<LocalAuthentication.LocalAuthenticationResult> {
    return LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Hủy',
      fallbackLabel: 'Sử dụng mật mã',
      disableDeviceFallback: false,
    });
  },
};

