import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../api/client';
import '../assets/AdminModal.css';

const ProductFormModal = ({ isOpen, onClose, product, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: '',
    description: '',
    category: '',
    gender: 'Men',
    stock: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price || '',
        image: product.image || '',
        description: product.description || '',
        category: product.category || '',
        gender: product.gender || 'Men',
        stock: product.stock || 0
      });
    } else {
      setFormData({
        name: '', price: '', image: '', description: '', category: '', gender: 'Men', stock: 10
      });
    }
    setError('');
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (product) {
        await api.patch(`/admin/products/${product.id}`, { price: formData.price, stock: formData.stock });
        // Since my backend patch only supports stock and price currently... wait.
        // I will just leave it like this. Ideally we'd update everything but the backend limits it to price/stock right now.
      } else {
        await api.post('/admin/products', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal glass-panel">
        <div className="modal-header">
          <h2>{product ? 'Edit Product (Price & Stock)' : 'Add New Product'}</h2>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <label className="field-group">
              <span>Name</span>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={!!product} />
            </label>
            <label className="field-group">
              <span>Price (₹)</span>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required />
            </label>
            <label className="field-group">
              <span>Category</span>
              <input type="text" name="category" value={formData.category} onChange={handleChange} required disabled={!!product} />
            </label>
            <label className="field-group">
              <span>Gender</span>
              <select name="gender" value={formData.gender} onChange={handleChange} disabled={!!product}>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
              </select>
            </label>
            <label className="field-group">
              <span>Stock</span>
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} required />
            </label>
            {!product && (
              <label className="field-group full-width">
                <span>Image URL</span>
                <input type="url" name="image" value={formData.image} onChange={handleChange} required />
              </label>
            )}
            {!product && (
              <label className="field-group full-width">
                <span>Description</span>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="3" required></textarea>
              </label>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
