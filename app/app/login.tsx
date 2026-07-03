import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import api from '@/src/api/client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handleLogin = async () => {
    if (!email || (!showOtp && !password)) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    
    setLoading(true);
    try {
      if (!showOtp) {
        // Step 1: Request OTP
        const res = await api.post('/auth/request-otp', { email, password });
        Alert.alert('OTP Sent', res.data.message || 'Please check your email for the OTP');
        setShowOtp(true);
      } else {
        // Step 2: Verify OTP and Login
        if (!otp) {
          Alert.alert('Error', 'Please enter the OTP');
          setLoading(false);
          return;
        }
        const res = await api.post('/auth/verify-otp', { email, otp });
        await AsyncStorage.setItem('@aura_token', res.data.token);
        await AsyncStorage.setItem('@aura_user', JSON.stringify(res.data.user));
        Alert.alert('Success', 'Logged in successfully!');
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>Login to AURA</Text>
      
      {!showOtp ? (
        <>
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
          
          <View style={[styles.inputContainer, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Password"
              placeholderTextColor="gray"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </>
      ) : (
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
      )}
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'PROCESSING...' : showOtp ? 'VERIFY & LOGIN' : 'REQUEST OTP'}
        </Text>
      </TouchableOpacity>
      
      {!showOtp && (
        <TouchableOpacity onPress={() => router.push('/forgot-password')} style={{ marginTop: 15, alignItems: 'center' }}>
          <Text style={{ color: Colors[colorScheme ?? 'light'].text, fontSize: 14 }}>
            Forgot Password?
          </Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity onPress={() => router.push('/register')} style={styles.linkContainer}>
        <Text style={[styles.linkText, { color: Colors[colorScheme ?? 'light'].text }]}>
          Don't have an account? <Text style={styles.linkBold}>Sign up</Text>
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
    marginBottom: 40,
    textAlign: 'center',
    letterSpacing: 2,
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
  },
  linkBold: {
    fontWeight: 'bold',
    color: '#e11b23',
  },
});
