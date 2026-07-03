import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import api from '@/src/api/client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/register', { name: username, email, password });
      await AsyncStorage.setItem('@aura_token', res.data.token);
      await AsyncStorage.setItem('@aura_user', JSON.stringify(res.data.user));
      Alert.alert('Success', 'Account created successfully!');
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>Create Account</Text>
      
      <View style={[styles.inputContainer, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
        <TextInput
          style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
          placeholder="Full Name"
          placeholderTextColor="gray"
          value={username}
          onChangeText={setUsername}
        />
      </View>

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
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'CREATING...' : 'SIGN UP'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/login')} style={styles.linkContainer}>
        <Text style={[styles.linkText, { color: Colors[colorScheme ?? 'light'].text }]}>
          Already have an account? <Text style={styles.linkBold}>Login</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
