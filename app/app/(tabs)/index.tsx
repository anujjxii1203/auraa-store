import { StyleSheet, Text, View, FlatList, Image, ActivityIndicator, Pressable, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import api from '@/src/api/client';
import { resolveImageUrl } from '@/src/utils/image';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = ['All', 'Men', 'Women'];

export default function HomeScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const colorScheme = useColorScheme();
  const router = useRouter();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory !== 'All') params.gender = selectedCategory;
      if (search) params.search = search;
      const res = await api.get('/products', { params });
      setProducts(res.data);
    } catch (err) {
      console.log('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchProducts();
  };

  const renderProduct = ({ item }: { item: any }) => (
    <Pressable
      style={StyleSheet.flatten([
        styles.productCard,
        {
          backgroundColor: isDark ? '#1a1a1a' : '#fff',
          shadowColor: isDark ? '#000' : '#aaa',
        },
      ])}
      onPress={() => router.push(`/product/${item.id}` as any)}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: resolveImageUrl(item.image) }} style={styles.productImage} resizeMode="cover" />
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={StyleSheet.flatten([styles.productName, { color: theme.text }])} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={StyleSheet.flatten([styles.productGender, { color: isDark ? '#888' : '#999' }])}>
          {item.gender || 'Unisex'}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>₹{item.price}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
      {/* Search Bar */}
      <View style={StyleSheet.flatten([styles.searchContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }])}>
        <Ionicons name="search" size={20} color={isDark ? '#888' : '#666'} style={styles.searchIcon} />
        <TextInput
          style={StyleSheet.flatten([styles.searchInput, { color: theme.text }])}
          placeholder="Search products..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {/* Category Filters */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={StyleSheet.flatten([
                styles.categoryChip,
                selectedCategory === cat
                  ? styles.categoryChipActive
                  : { backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' },
              ])}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={StyleSheet.flatten([
                  styles.categoryChipText,
                  selectedCategory === cat
                    ? styles.categoryChipTextActive
                    : { color: isDark ? '#ccc' : '#555' },
                ])}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Products Grid */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#e11b23" />
          <Text style={{ color: '#999', marginTop: 12, fontSize: 14 }}>Loading products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={56} color={isDark ? '#444' : '#ccc'} />
          <Text style={{ color: '#999', marginTop: 12, fontSize: 16 }}>No products found</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryChipActive: {
    backgroundColor: '#e11b23',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 12,
    paddingBottom: 80,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
  },
  productGender: {
    fontSize: 11,
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: '900',
    color: '#e11b23',
  },
});
