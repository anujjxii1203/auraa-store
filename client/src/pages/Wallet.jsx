import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import { Wallet, Plus, LoaderCircle, History, TrendingDown, TrendingUp } from 'lucide-react';

const AuraWallet = () => {
  const { user, updateUser } = useUser();
  const { showToast } = useToast();
  const [balance, setBalance] = useState(user?.wallet_balance || 0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addAmount, setAddAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const res = await api.get('/wallet');
      setBalance(res.data.balance);
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load wallet data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();
    const amount = Number(addAmount);
    if (!amount || amount < 100) {
      showToast('Minimum top-up amount is ₹100', 'warning');
      return;
    }

    setIsAdding(true);
    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) throw new Error('Razorpay SDK failed to load');

      const orderRes = await api.post('/wallet/add', { amount });
      const order = orderRes.data;

      if (order.id && order.id.startsWith('order_wallet_mock_')) {
        await verifyPayment({
          razorpay_order_id: order.id,
          amount: amount,
        });
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'AURA STORE WALLET',
        description: 'Add money to wallet',
        order_id: order.id,
        handler: async (response) => {
          await verifyPayment({ ...response, amount });
        },
        prefill: {
          name: user.username,
          email: user.email,
        },
        theme: {
          color: '#00ff88',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        showToast('Payment failed', 'error');
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      showToast('Error initiating payment', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const verifyPayment = async (data) => {
    try {
      const res = await api.post('/wallet/verify', data);
      showToast('Money added to wallet successfully!', 'success');
      setAddAmount('');
      setBalance(res.data.balance);
      fetchWalletData();
      
      const meRes = await api.get('/me');
      updateUser(meRes.data.user);
    } catch (err) {
      console.error(err);
      showToast('Payment verification failed', 'error');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
        <LoaderCircle size={40} className="spinner" color="var(--teal)" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Balance Card */}
      <div style={{ background: '#212121', padding: '30px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '15px', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
          <Wallet size={150} color="#00ff88" />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wallet size={24} color="#00ff88" />
          <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, letterSpacing: '1px', color: '#ccc' }}>AURA WALLET BALANCE</h2>
        </div>
        
        <div style={{ fontSize: '48px', fontWeight: '950', color: '#00ff88', display: 'flex', alignItems: 'baseline', gap: '5px' }}>
          <span style={{ fontSize: '24px' }}>₹</span>{balance.toLocaleString()}
        </div>
      </div>

      {/* Add Money Section */}
      <div style={{ background: 'var(--bg-primary)', padding: '25px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 15px 0' }}>Top Up Wallet</h3>
        <form onSubmit={handleAddMoney} style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: '#666' }}>₹</span>
            <input
              type="number"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Enter amount"
              min="100"
              required
              style={{
                width: '100%',
                padding: '12px 15px 12px 35px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-color)',
                fontSize: '16px',
                fontWeight: '700',
                outline: 'none',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <button 
            type="submit" 
            disabled={isAdding}
            style={{
              padding: '12px 25px',
              background: '#00ff88',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '900',
              fontSize: '15px',
              cursor: isAdding ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '150px',
              justifyContent: 'center',
              opacity: isAdding ? 0.7 : 1
            }}
          >
            {isAdding ? <LoaderCircle size={18} className="spinner" /> : <><Plus size={18} /> ADD MONEY</>}
          </button>
        </form>
      </div>

      {/* Transaction History */}
      <div style={{ background: 'var(--bg-primary)', padding: '25px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <History size={20} />
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Recent Transactions</h3>
        </div>
        
        {transactions.length === 0 ? (
          <p style={{ color: '#888', fontWeight: '600', textAlign: 'center', padding: '20px 0' }}>No transactions found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {transactions.map(tx => (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: tx.type === 'credit' ? '#e6ffe6' : '#ffe6e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {tx.type === 'credit' ? <TrendingUp size={20} color="#00cc66" /> : <TrendingDown size={20} color="#e11b23" />}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '15px', fontWeight: '800' }}>{tx.description}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#888', fontWeight: '600' }}>{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: tx.type === 'credit' ? '#00cc66' : 'var(--text-primary)' }}>
                  {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AuraWallet;
