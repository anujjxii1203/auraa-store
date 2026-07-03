import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/api/client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('@aura_token');
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await api.get('/orders/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data || []);
    } catch (err) {
      console.log('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderOrder = ({ item }: { item: any }) => {
    const itemsText = item.metadata?.items 
      ? item.metadata.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')
      : 'Items unavailable';

    return (
      <View style={StyleSheet.flatten([styles.orderCard, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }])}>
        <View style={styles.orderHeader}>
          <Text style={StyleSheet.flatten([styles.orderId, { color: theme.text }])}>Order #{item.id}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status?.toUpperCase() || 'PLACED'}</Text>
          </View>
        </View>
        
        <Text style={StyleSheet.flatten([styles.itemsList, { color: isDark ? '#aaa' : '#666' }])} numberOfLines={2}>
          {itemsText}
        </Text>
        
        <View style={styles.orderFooter}>
          <Text style={StyleSheet.flatten([styles.orderDate, { color: isDark ? '#888' : '#999' }])}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.orderAmount}>₹{item.amount}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={StyleSheet.flatten([styles.title, { color: theme.text }])}>My Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#e11b23" />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={64} color={isDark ? '#444' : '#ccc'} />
          <Text style={StyleSheet.flatten([styles.emptyTitle, { color: theme.text }])}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>When you place an order, it will appear here.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.shopBtnText}>START SHOPPING</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
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
  listContainer: {
    padding: 16,
  },
  orderCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: 'rgba(225,27,35,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#e11b23',
    fontSize: 10,
    fontWeight: '800',
  },
  itemsList: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 20,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
    paddingTop: 12,
  },
  orderDate: {
    fontSize: 12,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#e11b23',
  },
});
