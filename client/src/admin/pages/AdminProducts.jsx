import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Search, Plus, Edit, Trash2, Download, Package } from 'lucide-react';
import ProductFormModal from '../components/ProductFormModal';
import '../assets/AdminProducts.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/admin/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} products?`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => api.delete(`/admin/products/${id}`)));
      setSelectedIds(new Set());
      fetchProducts();
    } catch (err) {
      console.error('Failed to bulk delete products', err);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const exportCSV = () => {
    if (products.length === 0) return;
    const headers = ['ID', 'Name', 'Category', 'Price', 'Stock', 'Gender'];
    const csvRows = [headers.join(',')];
    
    products.forEach(p => {
      const row = [p.id, `"${p.name}"`, `"${p.category}"`, p.price, p.stock || 0, p.gender];
      csvRows.push(row.join(','));
    });

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'products_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return <div className="admin-spinner"></div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1>Products</h1>
          <p>Manage your store inventory and catalog</p>
        </div>
        <div className="admin-page-actions">
          <button onClick={exportCSV} className="btn-secondary">
            <Download size={18} /> Export CSV
          </button>
          <button onClick={openAddModal} className="btn-primary">
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div className="admin-table-container glass-panel">
        <div className="table-toolbar">
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {selectedIds.size > 0 && (
            <button onClick={handleBulkDelete} className="btn-danger">
              <Trash2 size={18} /> Delete Selected ({selectedIds.size})
            </button>
          )}
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                  />
                </td>
                <td>
                  <div className="table-product-cell">
                    <img src={product.image} alt={product.name} />
                    <div className="table-product-info">
                      <span className="name">{product.name}</span>
                      <span className="sku">ID: {product.id} • {product.gender}</span>
                    </div>
                  </div>
                </td>
                <td>{product.category}</td>
                <td>₹{product.price}</td>
                <td>
                  <span className={`stock-badge ${product.stock > 10 ? 'in-stock' : product.stock > 0 ? 'low-stock' : 'out-of-stock'}`}>
                    {product.stock || 0} in stock
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="action-btn edit" onClick={() => openEditModal(product)}><Edit size={16} /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(product.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  <Package size={24} className="mx-auto mb-2 opacity-50" />
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        onSuccess={fetchProducts}
      />
    </div>
  );
};

export default AdminProducts;
