import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import api from '@/src/api/client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handleRequestOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      Alert.alert('OTP Sent', res.data.message || 'Check your email for the OTP');
      setStep(2);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      Alert.alert('Error', 'Please enter OTP and new password');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { email, otp, newPassword });
      Alert.alert('Success', res.data.message || 'Password reset successfully');
      router.replace('/login');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>Reset Password</Text>

      {step === 1 ? (
        <>
          <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Enter your email to receive an OTP to reset your password.
          </Text>
          <View style={[styles.inputContainer, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Email"
              placeholderTextColor="gray"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleRequestOtp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'SENDING...' : 'SEND OTP'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Enter the OTP sent to {email} and your new password.
          </Text>
          <View style={[styles.inputContainer, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Enter OTP"
              placeholderTextColor="gray"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.inputContainer, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="New Password"
              placeholderTextColor="gray"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
          </View>
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'RESETTING...' : 'RESET PASSWORD'}</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => router.push('/login')} style={styles.linkContainer}>
        <Text style={[styles.linkText, { color: Colors[colorScheme ?? 'light'].text }]}>
          Back to Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.8,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  input: {
    padding: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#e11b23',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
