import { StyleSheet, Text, View, TouchableOpacity, Switch } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkEnabled, setDarkEnabled] = useState(isDark);

  return (
    <View style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={StyleSheet.flatten([styles.title, { color: theme.text }])}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        
        <View style={StyleSheet.flatten([styles.row, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }])}>
          <View style={styles.rowLeft}>
            <Ionicons name="notifications-outline" size={24} color={theme.text} />
            <Text style={StyleSheet.flatten([styles.rowLabel, { color: theme.text }])}>Push Notifications</Text>
          </View>
          <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: '#e11b23' }} />
        </View>

        <View style={StyleSheet.flatten([styles.row, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }])}>
          <View style={styles.rowLeft}>
            <Ionicons name="moon-outline" size={24} color={theme.text} />
            <Text style={StyleSheet.flatten([styles.rowLabel, { color: theme.text }])}>Dark Mode</Text>
          </View>
          <Switch value={darkEnabled} onValueChange={setDarkEnabled} trackColor={{ true: '#e11b23' }} />
        </View>
      </View>
      
      <Text style={styles.info}>Note: App theme requires restart to fully apply.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
  },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: '800' },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
  },
  info: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});
