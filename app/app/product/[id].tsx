import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import api from '@/src/api/client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useCart } from '@/src/context/CartContext';
import { resolveImageUrl } from '@/src/utils/image';
import { Ionicons } from '@expo/vector-icons';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('M');
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch (err) {
      console.log('Error fetching product details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, selectedSize, 1);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e11b23" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={56} color={isDark ? '#444' : '#ccc'} />
        <Text style={{ color: theme.text, marginTop: 12, fontSize: 16 }}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: resolveImageUrl(product.image) }} style={styles.image} resizeMode="cover" />
          <View style={styles.imageOverlay} />
          {product.gender && (
            <View style={styles.genderTag}>
              <Text style={styles.genderTagText}>{product.gender}</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={StyleSheet.flatten([styles.infoCard, { backgroundColor: isDark ? '#111' : '#fff' }])}>
          {product.category && (
            <Text style={styles.categoryLabel}>{product.category.toUpperCase()}</Text>
          )}
          <Text style={StyleSheet.flatten([styles.name, { color: theme.text }])}>{product.name}</Text>
          <Text style={styles.price}>₹{product.price}</Text>

          {/* Size Selector */}
          <Text style={StyleSheet.flatten([styles.sectionTitle, { color: theme.text }])}>Select Size</Text>
          <View style={styles.sizeRow}>
            {SIZES.map((size) => (
              <Pressable
                key={size}
                style={StyleSheet.flatten([
                  styles.sizeBtn,
                  selectedSize === size
                    ? styles.sizeBtnActive
                    : { borderColor: isDark ? '#333' : '#ddd' },
                ])}
                onPress={() => setSelectedSize(size)}
              >
                <Text
                  style={StyleSheet.flatten([
                    styles.sizeBtnText,
                    selectedSize === size
                      ? styles.sizeBtnTextActive
                      : { color: isDark ? '#aaa' : '#555' },
                  ])}
                >
                  {size}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Description */}
          <Text style={StyleSheet.flatten([styles.sectionTitle, { color: theme.text }])}>Description</Text>
          <Text style={styles.description}>
            {product.description || 'Premium quality streetwear crafted with attention to detail. Made from high-quality fabrics for ultimate comfort and style.'}
          </Text>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Ionicons name="bus-outline" size={24} color={isDark ? '#aaa' : '#666'} />
              <Text style={StyleSheet.flatten([styles.featureText, { color: isDark ? '#aaa' : '#666' }])}>Free Delivery</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="sync-outline" size={24} color={isDark ? '#aaa' : '#666'} />
              <Text style={StyleSheet.flatten([styles.featureText, { color: isDark ? '#aaa' : '#666' }])}>Easy Returns</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={24} color={isDark ? '#aaa' : '#666'} />
              <Text style={StyleSheet.flatten([styles.featureText, { color: isDark ? '#aaa' : '#666' }])}>Genuine</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={StyleSheet.flatten([styles.bottomBar, { backgroundColor: isDark ? '#111' : '#fff' }])}>
        <View style={styles.bottomPrice}>
          <Text style={{ color: '#999', fontSize: 12 }}>Total Price</Text>
          <Text style={styles.bottomPriceValue}>₹{product.price}</Text>
        </View>
        <TouchableOpacity
          style={StyleSheet.flatten([
            styles.addToCartButton,
            addedToCart ? { backgroundColor: '#22c55e' } : {},
          ])}
          onPress={handleAddToCart}
        >
          {addedToCart ? (
             <Text style={styles.addToCartText}>✓ ADDED!</Text>
          ) : (
             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <Ionicons name="cart-outline" size={18} color="white" style={{ marginRight: 6 }} />
               <Text style={styles.addToCartText}>ADD TO CART</Text>
             </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 420,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    // gradient effect via backgroundColor
  },
  genderTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(225,27,35,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  genderTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  infoCard: {
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    minHeight: 400,
  },
  categoryLabel: {
    color: '#e11b23',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 32,
  },
  price: {
    fontSize: 28,
    fontWeight: '900',
    color: '#e11b23',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  sizeBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeBtnActive: {
    borderColor: '#e11b23',
    backgroundColor: 'rgba(225,27,35,0.08)',
  },
  sizeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sizeBtnTextActive: {
    color: '#e11b23',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#888',
    marginBottom: 24,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.15)',
  },
  featureItem: {
    alignItems: 'center',
    gap: 6,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  bottomPrice: {
    flex: 1,
  },
  bottomPriceValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#e11b23',
  },
  addToCartButton: {
    backgroundColor: '#e11b23',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
  },
  addToCartText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
