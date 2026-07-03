import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({ value, onChange, placeholder = "Enter password", autoComplete, name = "password" }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="input-with-icon" style={{ position: 'relative' }}>
      <Lock size={18} />
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          boxShadow: 'none'
        }}
      />
      <button 
        type="button" 
        onClick={() => setShowPassword(!showPassword)} 
        style={{ 
          position: 'absolute', 
          right: '12px', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          color: '#888',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0
        }}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export default PasswordInput;
