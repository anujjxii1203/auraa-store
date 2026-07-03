import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function CouponsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const coupons = [
    { code: 'WELCOME10', desc: '10% off on your first order', expiry: 'Valid for 7 days' },
    { code: 'FREESHIP', desc: 'Free delivery on orders over ₹999', expiry: 'Valid until 31 Dec' },
  ];

  return (
    <View style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={StyleSheet.flatten([styles.title, { color: theme.text }])}>Available Coupons</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {coupons.map((coupon, index) => (
          <View key={index} style={StyleSheet.flatten([styles.card, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }])}>
            <View style={styles.iconBox}>
              <Ionicons name="ticket-outline" size={32} color="#e11b23" />
            </View>
            <View style={styles.cardContent}>
              <Text style={StyleSheet.flatten([styles.code, { color: theme.text }])}>{coupon.code}</Text>
              <Text style={styles.desc}>{coupon.desc}</Text>
              <Text style={styles.expiry}>{coupon.expiry}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
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
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(225,27,35,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    marginLeft: 16,
    flex: 1,
  },
  code: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  desc: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  expiry: {
    fontSize: 11,
    color: '#e11b23',
    fontWeight: '700',
    marginTop: 8,
  },
});
