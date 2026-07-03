import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleMoveToBag = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
    });
    removeFromWishlist(product.id);
    showToast(`${product.name} moved to bag!`, "success");
  };

  if (wishlist.length === 0) {
    return (
      <div style={{ padding: '40px', background: 'var(--ss-light-grey)', borderRadius: '12px', textAlign: 'center', border: '1.5px dashed var(--border-color)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <Heart size={72} strokeWidth={1.2} />
          <h2>Your Wishlist is Empty</h2>
          <p>Save pieces you love and move them to your bag when you are ready.</p>
          <Link to="/" className="btn-red state-action">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '950', color: 'var(--text-primary)' }}>WISHLIST ({wishlist.length})</h1>
        <Link to="/" style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
          Continue Shopping <ArrowRight size={16} />
        </Link>
      </div>

      <div className="product-grid">
        {wishlist.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleMoveToBag}
            onRemove={removeFromWishlist}
            actionLabel="MOVE TO BAG"
          />
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
