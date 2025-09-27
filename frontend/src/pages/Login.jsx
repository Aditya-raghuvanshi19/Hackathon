import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (email === 'demo@example.com' && password === 'password') {
        setIsLoggedIn(true);
        setError('');
      } else {
        setError('Invalid credentials (demo@example.com / password)');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const styles = {
    container: {
      fontFamily: 'Arial, Helvetica, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      margin: 0,
    },
    nav: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#568F87',
      padding: '15px 30px',
      color: '#fff',
      fontWeight: 600,
      fontSize: '20px',
      width: '100vw',
      boxSizing: 'border-box',
    },
    navButtons: {
      display: 'flex',
      gap: '15px',
    },
    navButton: {
      padding: '8px 20px',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: 600,
      transition: 'all 0.3s ease',
    },
    navButtonActive: {
      backgroundColor: '#fff',
      color: '#568F87',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    },
    main: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f0f5f5',
      padding: '40px 20px',
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      width: '100%',
      maxWidth: '400px',
      overflow: 'hidden',
    },
    cardHeader: {
      backgroundColor: '#568F87',
      color: '#fff',
      padding: '30px 20px',
      textAlign: 'center',
    },
    cardTitle: {
      fontSize: '28px',
      margin: 0,
      marginBottom: '8px',
      fontWeight: 'bold',
    },
    cardSubtitle: {
      fontSize: '14px',
    },
    cardBody: {
      padding: '30px 20px',
    },
    inputGroup: {
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
    },
    label: {
      marginBottom: '5px',
      fontWeight: '600',
      fontSize: '14px',
      color: '#333',
    },
    inputWrapper: {
      position: 'relative',
    },
    input: {
      padding: '12px 40px 12px 40px',
      borderRadius: '12px',
      border: '1px solid #ccc',
      outline: 'none',
      fontSize: '14px',
      width: '100%',
      boxSizing: 'border-box',
    },
    iconLeft: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#888',
    },
    togglePassword: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
      color: '#888',
      fontWeight: 'bold',
    },
    button: {
      width: '100%',
      padding: '12px',
      borderRadius: '12px',
      border: 'none',
      backgroundColor: '#568F87',
      color: '#fff',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginTop: '10px',
    },
    error: {
      color: '#ff4d4f',
      marginBottom: '10px',
      fontSize: '13px',
    },
    footer: {
      backgroundColor: '#568F87',
      color: '#fff',
      textAlign: 'center',
      padding: '15px 0',
      fontWeight: '500',
      width: '100vw',
      boxSizing: 'border-box',
    },
  };

  if (isLoggedIn) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={styles.nav}>
          <span>Data Processing</span>
        </div>
        <main style={{ ...styles.main, flexDirection: 'column' }}>
          <h2>Welcome Back!</h2>
          <p>Logged in as: {email}</p>
          <button style={styles.button} onClick={handleLogout}>
            Logout
          </button>
        </main>
        <footer style={styles.footer}>
          &copy; {new Date().getFullYear()} Data Processing System. All rights reserved.
        </footer>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.nav}>
        <span>Data Processing</span>
        <div style={styles.navButtons}>
          <span
            style={{ ...styles.navButton, ...(activeTab === 'login' ? styles.navButtonActive : {}) }}
            onClick={() => setActiveTab('login')}
          >
            Login
          </span>
          <span
            style={{ ...styles.navButton, ...(activeTab === 'register' ? styles.navButtonActive : {}) }}
            onClick={handleRegister}
          >
            Register
          </span>
        </div>
      </div>
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              {activeTab === 'login' ? 'Welcome Back' : 'Register'}
            </h2>
            <p style={styles.cardSubtitle}>
              {activeTab === 'login' ? 'Login to access your account' : 'Redirecting to registration'}
            </p>
          </div>
          <div style={styles.cardBody}>
            {error && <div style={styles.error}>{error}</div>}
            {activeTab === 'login' && (
              <>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email</label>
                  <div style={styles.inputWrapper}>
                    <Mail style={styles.iconLeft} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={styles.input}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Password</label>
                  <div style={styles.inputWrapper}>
                    <Lock style={styles.iconLeft} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={styles.input}
                      placeholder="Enter your password"
                    />
                    <span
                      style={styles.togglePassword}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </span>
                  </div>
                </div>
                <button style={styles.button} onClick={handleLogin}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </>
            )}
          </div>
        </div>
      </main>
      <footer style={styles.footer}>
        &copy; {new Date().getFullYear()} Data Processing System. All rights reserved.
      </footer>
    </div>
  );
};

export default Login;
