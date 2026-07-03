import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('@aura_user');
      if (userData) setUser(JSON.parse(userData));
    } catch (e) {
      console.log('Error loading user', e);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('@aura_token');
    await AsyncStorage.removeItem('@aura_user');
    setUser(null);
  };

  if (!user) {
    return (
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
        <View style={styles.center}>
          <View style={StyleSheet.flatten([styles.avatarPlaceholder, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }])}>
            <Ionicons name="person" size={56} color={isDark ? '#444' : '#ccc'} />
          </View>
          <Text style={StyleSheet.flatten([styles.title, { color: theme.text }])}>Welcome to AURA</Text>
          <Text style={styles.subtitle}>Login to access your orders, wishlist & more</Text>

          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
            <Text style={styles.loginBtnText}>LOGIN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={StyleSheet.flatten([styles.registerBtn, { borderColor: isDark ? '#333' : '#ddd' }])}
            onPress={() => router.push('/register')}
          >
            <Text style={StyleSheet.flatten([styles.registerBtnText, { color: theme.text }])}>CREATE ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
      {/* Profile Header */}
      <View style={StyleSheet.flatten([styles.profileHeader, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }])}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={48} color="#e11b23" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={StyleSheet.flatten([styles.profileName, { color: theme.text }])}>{user.username || user.email}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {[
          { icon: 'cube-outline', label: 'My Orders', subtitle: 'Track your orders', route: '/orders' },
          { icon: 'heart-outline', label: 'Wishlist', subtitle: 'Items you love', route: '/wishlist' },
          { icon: 'location-outline', label: 'Addresses', subtitle: 'Manage delivery addresses', route: '/addresses' },
          { icon: 'ticket-outline', label: 'Coupons', subtitle: 'Your available coupons', route: '/coupons' },
          { icon: 'settings-outline', label: 'Settings', subtitle: 'App preferences', route: '/settings' },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={StyleSheet.flatten([styles.menuItem, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }])}
            onPress={() => router.push(item.route as any)}
          >
            <Ionicons name={item.icon as any} size={24} color={theme.text} />
            <View style={styles.menuItemContent}>
              <Text style={StyleSheet.flatten([styles.menuItemLabel, { color: theme.text }])}>{item.label}</Text>
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>LOGOUT</Text>
      </TouchableOpacity>

      <Text style={styles.version}>AURA STORE v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  loginBtn: {
    backgroundColor: '#e11b23',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 32,
    width: '100%',
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
  },
  registerBtn: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  registerBtnText: {
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(225,27,35,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
  },
  profileEmail: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  menuSection: {
    paddingHorizontal: 16,
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 14,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e11b23',
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#e11b23',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  version: {
    textAlign: 'center',
    color: '#999',
    fontSize: 11,
    marginTop: 20,
    letterSpacing: 1,
  },
});
