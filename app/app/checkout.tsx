import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useCart } from '@/src/context/CartContext';
import api from '@/src/api/client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CheckoutScreen() {
  const { cart, getCartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [upiId, setUpiId] = useState('');
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    if (!address.trim() || !city.trim() || !postalCode.trim()) {
      Alert.alert('Delivery Address Required', 'Please enter your complete address, city, and postal code.');
      return;
    }

    if (paymentMethod === 'upi') {
      if (!upiId.trim() || !/^[a-z0-9.\-_]{2,}@[a-z]{2,}$/i.test(upiId)) {
        Alert.alert('Invalid UPI ID', 'Please enter a valid UPI ID (e.g. name@bank)');
        return;
      }
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('@aura_token');
      if (!token) {
        Alert.alert('Authentication Required', 'Please login to place an order');
        router.push('/login');
        return;
      }

      const payload = {
        amount: getCartTotal(),
        method: paymentMethod,
        ...(paymentMethod === 'upi' ? { upiId } : {}),
        metadata: { 
          items: cart,
          shipping: { address, city, postalCode }
        }
      };

      const res = await api.post('/payments', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert(
        '🎉 Order Placed Successfully!', 
        `Your order of ₹${getCartTotal()} has been placed via ${paymentMethod === 'upi' ? 'UPI' : 'Cash on Delivery'}.`
      );
      clearCart();
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>Checkout</Text>
      
      <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Order Summary</Text>
        {cart.map((item: any) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={[styles.itemName, { color: Colors[colorScheme ?? 'light'].text }]} numberOfLines={1}>
              {item.quantity}x {item.name}
            </Text>
            <Text style={[styles.itemPrice, { color: Colors[colorScheme ?? 'light'].text }]}>
              ₹{item.price * item.quantity}
            </Text>
          </View>
        ))}
        <View style={styles.separator} />
        <View style={styles.itemRow}>
          <Text style={[styles.totalText, { color: Colors[colorScheme ?? 'light'].text }]}>Total Amount</Text>
          <Text style={styles.totalAmount}>₹{getCartTotal()}</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Delivery Address</Text>
        
        <TextInput
          style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
          placeholder="Street Address"
          placeholderTextColor="gray"
          value={address}
          onChangeText={setAddress}
        />
        <TextInput
          style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
          placeholder="City"
          placeholderTextColor="gray"
          value={city}
          onChangeText={setCity}
        />
        <TextInput
          style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
          placeholder="Postal Code"
          placeholderTextColor="gray"
          value={postalCode}
          onChangeText={setPostalCode}
          keyboardType="number-pad"
        />
      </View>

      <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Payment Method</Text>
        
        <View style={styles.paymentRow}>
          <TouchableOpacity 
            style={[styles.paymentMethodBtn, paymentMethod === 'cod' && styles.paymentMethodActive]} 
            onPress={() => setPaymentMethod('cod')}
          >
            <Text style={[styles.paymentText, paymentMethod === 'cod' && styles.paymentTextActive]}>COD</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.paymentMethodBtn, paymentMethod === 'upi' && styles.paymentMethodActive]} 
            onPress={() => setPaymentMethod('upi')}
          >
            <Text style={[styles.paymentText, paymentMethod === 'upi' && styles.paymentTextActive]}>UPI</Text>
          </TouchableOpacity>
        </View>
        
        {paymentMethod === 'upi' && (
          <View style={{ marginTop: 15 }}>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Enter UPI ID (e.g. name@bank)"
              placeholderTextColor="gray"
              value={upiId}
              onChangeText={setUpiId}
              autoCapitalize="none"
            />
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handlePlaceOrder}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'PLACING ORDER...' : 'PLACE ORDER'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: 1,
  },
  card: {
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 15,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(150,150,150,0.2)',
    marginVertical: 15,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#e11b23',
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentMethodBtn: {
    flex: 1,
    padding: 15,
    borderWidth: 2,
    borderColor: 'rgba(150,150,150,0.2)',
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentMethodActive: {
    borderColor: '#e11b23',
    backgroundColor: 'rgba(225,27,35,0.05)',
  },
  paymentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'gray',
  },
  paymentTextActive: {
    color: '#e11b23',
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
});
