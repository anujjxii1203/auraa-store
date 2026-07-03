import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function WishlistScreen() {
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
        <Text style={StyleSheet.flatten([styles.title, { color: theme.text }])}>Wishlist</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.center}>
        <Ionicons name="heart-outline" size={64} color={isDark ? '#444' : '#ccc'} />
        <Text style={StyleSheet.flatten([styles.emptyTitle, { color: theme.text }])}>Your Wishlist is Empty</Text>
        <Text style={styles.emptySubtitle}>Tap the heart icon on a product to save it here.</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.shopBtnText}>BROWSE ITEMS</Text>
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
  shopBtn: {
    backgroundColor: '#e11b23',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
});
