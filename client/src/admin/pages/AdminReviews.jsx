import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Search, MessageSquare, Trash2, Star } from 'lucide-react';
import '../assets/AdminProducts.css';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchReviews = async () => {
    try {
      const res = await api.get('/admin/reviews');
      setReviews(res.data);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      fetchReviews();
    } catch (err) {
      console.error('Failed to delete review', err);
    }
  };

  const filteredReviews = reviews.filter(r => 
    (r.product_name || '').toLowerCase().includes(search.toLowerCase()) || 
    r.username.toLowerCase().includes(search.toLowerCase()) ||
    r.comment.toLowerCase().includes(search.toLowerCase())
  );

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={14} fill={i < rating ? "#f59e0b" : "transparent"} color={i < rating ? "#f59e0b" : "#475569"} />
    ));
  };

  if (loading) return <div className="admin-spinner"></div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1>Reviews Moderation</h1>
          <p>Monitor and manage customer product reviews</p>
        </div>
      </div>

      <div className="admin-table-container glass-panel">
        <div className="table-toolbar">
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by product, user or comment..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Reviewer</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.map(review => (
              <tr key={review.id}>
                <td>{review.product_name || 'Unknown Product'}</td>
                <td>{review.username}</td>
                <td>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {renderStars(review.rating)}
                  </div>
                </td>
                <td style={{ maxWidth: '300px', whiteSpace: 'normal', lineHeight: '1.4' }}>
                  {review.comment}
                </td>
                <td>{new Date(review.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="table-actions">
                    <button className="action-btn delete" onClick={() => handleDelete(review.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredReviews.length === 0 && (
              <tr>
                <td colSpan="6" className="empty-state">
                  <MessageSquare size={24} />
                  <p>No reviews found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReviews;
