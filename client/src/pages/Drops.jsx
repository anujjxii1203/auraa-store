import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Flame, Clock, ArrowRight, Lock, Sparkles, CheckCircle2, Zap } from 'lucide-react';
import PageTitle from '../components/PageTitle';
import { useToast } from '../context/ToastContext';

const Drops = () => {
  const { showToast } = useToast();
  const [notified, setNotified] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  const [dropDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(20, 0, 0, 0); // 8 PM drop
    return d.getTime();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = dropDate - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [dropDate]);

  const handleNotifyMe = () => {
    setNotified(true);
    showToast("⚡ You're on the list! We'll notify you 15 minutes before the drop.", 'success');
  };

  const upcomingTeasers = [
    {
      id: 1,
      title: '"Tokyo Cyber" Oversized Hoodie',
      tag: 'DROP 002',
      date: 'Dropping Friday 8 PM',
      img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80',
      price: '₹3,499',
      pieces: '50 Pieces Only'
    },
    {
      id: 2,
      title: '"Acid Void" Heavyweight Graphic Tee',
      tag: 'DROP 003',
      date: 'Dropping Next Tuesday',
      img: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
      price: '₹1,899',
      pieces: '75 Pieces Only'
    },
    {
      id: 3,
      title: '"Tactical Stealth" Modular Puffer',
      tag: 'DROP 004',
      date: 'Coming Soon',
      img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
      price: '₹5,999',
      pieces: '30 Pieces Only'
    }
  ];

  const pastDrops = [
    {
      id: 101,
      title: '"Phantom Ghost" Reflective Jacket',
      soldTime: 'SOLD OUT IN 4 MINS',
      img: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
      tag: 'SOLD OUT'
    },
    {
      id: 102,
      title: '"Neo Matrix" Distressed Denim Cargo',
      soldTime: 'SOLD OUT IN 8 MINS',
      img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
      tag: 'SOLD OUT'
    },
    {
      id: 103,
      title: '"Raw Concrete" High-Top Sneakers',
      soldTime: 'SOLD OUT IN 12 MINS',
      img: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
      tag: 'SOLD OUT'
    }
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', paddingBottom: '80px' }}>
      <PageTitle title="Upcoming Drops - AURA STORE" />
      
      {/* Header Banner */}
      <div className="container" style={{ padding: '60px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 68, 68, 0.15)', border: '1px solid rgba(255, 68, 68, 0.3)', padding: '6px 16px', borderRadius: '30px', color: '#ff4444', fontSize: '13px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
          <Flame size={16} color="#ff4444" />
          EXTREMELY LIMITED QUANTITIES
        </div>

        <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: '950', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '-1px', lineHeight: 1.1 }}>
          LIMITED DROPS
        </h1>
        <p style={{ color: '#aaa', fontSize: '18px', maxWidth: '650px', marginBottom: '40px', lineHeight: 1.6 }}>
          Exclusive streetwear drops released in ultra-limited batches. No restocks ever. Once sold out, they're gone forever.
        </p>

        {/* Featured Drop Card */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '850px', borderRadius: '20px', overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.9)' }}>
          <img 
            src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=80" 
            alt="Upcoming Drop" 
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1600&q=80'; }}
            style={{ width: '100%', height: '540px', objectFit: 'cover', filter: 'brightness(0.7)' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.95) 15%, rgba(10,10,10,0.4) 60%, transparent)' }} />
          
          <div style={{ position: 'absolute', top: '25px', left: '25px', display: 'flex', gap: '10px' }}>
            <span style={{ background: '#ff4444', color: '#fff', fontSize: '12px', fontWeight: '950', padding: '6px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              NEXT DROP #001
            </span>
          </div>

          <div style={{ position: 'absolute', bottom: '35px', left: 0, right: 0, padding: '0 30px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '950', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
              "Midnight Operations" Cargo Set
            </h2>
            <p style={{ fontSize: '15px', fontWeight: '800', color: '#ff4444', marginBottom: '25px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} /> Dropping Friday at 8:00 PM IST • Only 40 Sets Produced
            </p>

            {/* Timer */}
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px' }}>
              {Object.entries(timeLeft).map(([unit, value]) => (
                <div key={unit} style={{ background: 'rgba(0, 0, 0, 0.65)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', padding: '16px 22px', borderRadius: '14px', minWidth: '90px' }}>
                  <div style={{ fontSize: '38px', fontWeight: '950', lineHeight: 1, fontFamily: 'monospace', color: '#fff' }}>
                    {String(value).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#999', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '1px' }}>
                    {unit}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleNotifyMe}
              disabled={notified}
              style={{
                background: notified ? '#222' : '#ffffff',
                color: notified ? '#008080' : '#000000',
                border: 'none',
                padding: '16px 36px',
                borderRadius: '40px',
                fontSize: '15px',
                fontWeight: '950',
                cursor: notified ? 'default' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s ease',
                boxShadow: notified ? 'none' : '0 10px 30px rgba(255,255,255,0.3)'
              }}
            >
              {notified ? (
                <>
                  <CheckCircle2 size={18} color="#008080" /> NOTIFICATION ACTIVE
                </>
              ) : (
                <>
                  <Bell size={18} /> GET VIP DROP ALERTS
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sneak Peek Teasers Section */}
      <section className="container" style={{ padding: '60px 20px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '35px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <span style={{ color: '#ff4444', fontWeight: '900', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>UPCOMING CATALOG</span>
            <h2 style={{ fontSize: '32px', fontWeight: '950', textTransform: 'uppercase', margin: '5px 0 0 0', letterSpacing: '-0.5px' }}>Sneak Peek Teasers</h2>
          </div>
          <p style={{ color: '#888', fontSize: '14px', maxWidth: '400px', margin: 0 }}>Preview upcoming drops below. Bookmark your favorites to get notified first.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          {upcomingTeasers.map(item => (
            <div key={item.id} style={{ background: '#141414', borderRadius: '16px', overflow: 'hidden', border: '1px solid #262626', transition: 'transform 0.3s ease' }}>
              <div style={{ position: 'relative', height: '320px', overflow: 'hidden' }}>
                <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(0,0,0,0.8)', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '900', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                  {item.tag}
                </div>
                <div style={{ position: 'absolute', bottom: '15px', right: '15px', background: '#ff4444', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '900' }}>
                  {item.pieces}
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', color: '#008080', fontWeight: '800', marginBottom: '6px' }}>{item.date}</div>
                <h3 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 10px 0', color: '#fff' }}>{item.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #222' }}>
                  <span style={{ fontSize: '18px', fontWeight: '950', color: '#fff' }}>{item.price}</span>
                  <button onClick={handleNotifyMe} style={{ background: 'transparent', border: '1px solid #444', color: '#fff', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Bell size={13} /> Remind Me
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Past Sold Out Archive (Urgency Proof) */}
      <section className="container" style={{ padding: '40px 20px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ color: '#888', fontWeight: '900', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>VAULT ARCHIVE</span>
          <h2 style={{ fontSize: '32px', fontWeight: '950', textTransform: 'uppercase', margin: '5px 0 0 0' }}>PAST DROPS (ALL SOLD OUT)</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '25px' }}>
          {pastDrops.map(item => (
            <div key={item.id} style={{ background: '#111', borderRadius: '16px', overflow: 'hidden', border: '1px solid #222', opacity: 0.85 }}>
              <div style={{ position: 'relative', height: '260px' }}>
                <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.7)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ background: '#e11b23', color: '#fff', fontWeight: '950', fontSize: '14px', padding: '8px 20px', borderRadius: '30px', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 5px 15px rgba(225,27,35,0.4)' }}>
                    {item.soldTime}
                  </span>
                </div>
              </div>
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#bbb' }}>{item.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VIP Early Access & Available Collection Bar */}
      <section className="container" style={{ padding: '0 20px' }}>
        <div style={{ background: 'linear-gradient(135deg, #181818 0%, #0d0d0d 100%)', borderRadius: '20px', padding: '50px 30px', border: '1.5px solid #262626', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: '60px', height: '60px', background: 'rgba(0, 128, 128, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <Zap size={28} color="#008080" />
          </div>

          <h3 style={{ fontSize: '28px', fontWeight: '950', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
            CAN'T WAIT FOR THE DROP?
          </h3>
          <p style={{ color: '#aaa', fontSize: '16px', maxWidth: '550px', marginBottom: '30px', lineHeight: 1.6 }}>
            Explore our currently active streetwear collection with instant dispatch and free express delivery across India.
          </p>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/men" className="btn-red" style={{ padding: '14px 30px', borderRadius: '30px', textDecoration: 'none', fontWeight: '900', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              SHOP MEN'S <ArrowRight size={16} />
            </Link>
            <Link to="/women" style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '14px 30px', borderRadius: '30px', textDecoration: 'none', fontWeight: '900', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              SHOP WOMEN'S <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Drops;
