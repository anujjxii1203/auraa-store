import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function AddressesScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  return (
    <View style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={StyleSheet.flatten([styles.title, { color: theme.text }])}>Saved Addresses</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.center}>
        <Ionicons name="location-outline" size={64} color={isDark ? '#444' : '#ccc'} />
        <Text style={StyleSheet.flatten([styles.emptyTitle, { color: theme.text }])}>No Saved Addresses</Text>
        <Text style={styles.emptySubtitle}>You haven't saved any delivery addresses yet.</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => {}}>
          <Text style={styles.addBtnText}>+ ADD NEW ADDRESS</Text>
        </TouchableOpacity>
      </View>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  addBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: '#e11b23',
  },
  addBtnText: {
    color: '#e11b23',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
});
