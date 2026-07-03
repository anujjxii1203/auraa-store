import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, Pressable } from 'react-native';
import { useCart } from '@/src/context/CartContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { resolveImageUrl } from '@/src/utils/image';

export default function CartScreen() {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={StyleSheet.flatten([styles.cartItem, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }])}>
      <Image source={{ uri: resolveImageUrl(item.image) }} style={styles.image} resizeMode="cover" />
      <View style={styles.itemDetails}>
        <Text style={StyleSheet.flatten([styles.name, { color: theme.text }])} numberOfLines={2}>{item.name}</Text>
        <View style={styles.sizeTag}>
          <Text style={styles.sizeTagText}>Size: {item.size}</Text>
        </View>
        <Text style={styles.price}>₹{item.price}</Text>

        <View style={styles.quantityContainer}>
          <Pressable
            onPress={() => updateQuantity(item.id, -1)}
            style={StyleSheet.flatten([styles.qtyBtn, { borderColor: isDark ? '#444' : '#ddd' }])}
          >
            <Text style={StyleSheet.flatten([styles.qtyBtnText, { color: theme.text }])}>−</Text>
          </Pressable>
          <Text style={StyleSheet.flatten([styles.qtyText, { color: theme.text }])}>{item.quantity}</Text>
          <Pressable
            onPress={() => updateQuantity(item.id, 1)}
            style={StyleSheet.flatten([styles.qtyBtn, { borderColor: isDark ? '#444' : '#ddd' }])}
          >
            <Text style={StyleSheet.flatten([styles.qtyBtnText, { color: theme.text }])}>+</Text>
          </Pressable>
        </View>
      </View>

      <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
        <Text style={styles.removeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  if (cart.length === 0) {
    return (
      <View style={StyleSheet.flatten([styles.center, { backgroundColor: theme.background }])}>
        <Ionicons name="cart-outline" size={64} color={isDark ? '#444' : '#ccc'} />
        <Text style={StyleSheet.flatten([styles.emptyTitle, { color: theme.text }])}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add some items to get started!</Text>
        <TouchableOpacity style={styles.shopNowBtn} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.shopNowBtnText}>SHOP NOW</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={StyleSheet.flatten([styles.footer, { backgroundColor: isDark ? '#111' : '#fff' }])}>
        <View style={styles.summaryRow}>
          <Text style={{ color: '#999', fontSize: 14 }}>Subtotal ({cart.length} items)</Text>
          <Text style={StyleSheet.flatten([styles.subtotalValue, { color: theme.text }])}>₹{getCartTotal()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={{ color: '#999', fontSize: 14 }}>Delivery</Text>
          <Text style={styles.freeText}>FREE</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={StyleSheet.flatten([styles.totalLabel, { color: theme.text }])}>Total</Text>
          <Text style={styles.totalValue}>₹{getCartTotal()}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
          <Text style={styles.checkoutText}>PROCEED TO CHECKOUT →</Text>
        </TouchableOpacity>
      </View>
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
    padding: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  shopNowBtn: {
    backgroundColor: '#e11b23',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  shopNowBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 280,
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: 90,
    height: 110,
    borderRadius: 12,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
  },
  sizeTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(225,27,35,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  sizeTagText: {
    color: '#e11b23',
    fontSize: 11,
    fontWeight: '700',
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    color: '#e11b23',
    marginTop: 6,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderWidth: 1.5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  qtyText: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: '800',
  },
  removeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(225,27,35,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#e11b23',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subtotalValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  freeText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150,150,150,0.15)',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#e11b23',
  },
  checkoutBtn: {
    backgroundColor: '#e11b23',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
