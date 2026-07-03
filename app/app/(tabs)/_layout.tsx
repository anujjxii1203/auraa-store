import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#e11b23',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#111' : '#fff',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        headerShown: useClientOnlyValue(false, true),
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#fff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          color: theme.text,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIcon : undefined}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={focused ? '#e11b23' : '#999'} />
            </View>
          ),
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <Text style={StyleSheet.flatten([styles.headerLogo, { color: theme.text }])}>AURA</Text>
              <Text style={styles.headerDot}>●</Text>
              <Text style={StyleSheet.flatten([styles.headerLogoSub, { color: theme.text }])}>STORE</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIcon : undefined}>
              <Ionicons name={focused ? 'cart' : 'cart-outline'} size={24} color={focused ? '#e11b23' : '#999'} />
            </View>
          ),
          headerTitle: 'My Cart',
          headerTitleStyle: { fontWeight: '800', fontSize: 20, color: theme.text },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeIcon : undefined}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={focused ? '#e11b23' : '#999'} />
            </View>
          ),
          headerTitle: 'My Profile',
          headerTitleStyle: { fontWeight: '800', fontSize: 20, color: theme.text },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLogo: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
  },
  headerDot: {
    fontSize: 8,
    color: '#e11b23',
    marginTop: -2,
  },
  headerLogoSub: {
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 4,
  },
  activeIcon: {
    borderBottomWidth: 2,
    borderBottomColor: '#e11b23',
    paddingBottom: 2,
  },
});
