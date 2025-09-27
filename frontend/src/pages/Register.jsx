import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
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
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsRegistered(true);
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => navigate('/login');

  const styles = {
    container: { display: 'flex', flexDirection: 'column', minHeight: '100vh' },
    nav: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#568F87',
      padding: '15px 30px',
      color: '#fff',
      width: '100vw',
      boxSizing: 'border-box',
    },
    navButtons: { display: 'flex', gap: '15px' },
    navButton: { padding: '8px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 },
    navButtonActive: { backgroundColor: '#fff', color: '#568F87', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
    main: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f0f5f5',
      padding: '40px 20px',
    },
    card: { backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', width: '100%', maxWidth: '400px', overflow: 'hidden' },
    cardHeader: { backgroundColor: '#568F87', color: '#fff', padding: '30px 20px', textAlign: 'center' },
    cardTitle: { fontSize: '28px', margin: 0, marginBottom: '8px', fontWeight: 'bold' },
    cardSubtitle: { fontSize: '14px' },
    cardBody: { padding: '30px 20px' },
    inputGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column' },
    label: { marginBottom: '5px', fontWeight: '600', fontSize: '14px', color: '#333' },
    inputWrapper: { position: 'relative' },
    input: { padding: '12px 40px 12px 40px', borderRadius: '12px', border: '1px solid #ccc', outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
    iconLeft: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' },
    togglePassword: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#888', fontWeight: 'bold' },
    button: { width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#568F87', color: '#fff', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease', marginTop: '10px' },
    error: { color: '#ff4d4f', marginBottom: '10px', fontSize: '13px' },
    footer: { backgroundColor: '#568F87', color: '#fff', textAlign: 'center', padding: '15px 0', fontWeight: '500', width: '100vw', boxSizing: 'border-box' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.nav}>
        <span>Data Processing</span>
        <div style={styles.navButtons}>
          <span style={styles.navButton} onClick={goToLogin}>Login</span>
          <span style={{ ...styles.navButton, ...styles.navButtonActive }}>Register</span>
        </div>
      </div>

      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Create Account</h2>
            <p style={styles.cardSubtitle}>Register to access your account</p>
          </div>
          <div style={styles.cardBody}>
            {isRegistered ? (
              <div style={{ textAlign: 'center' }}>
                <p>Registration successful!</p>
                <button style={styles.button} onClick={goToLogin}>Back to Login</button>
              </div>
            ) : (
              <>
                {error && <div style={styles.error}>{error}</div>}

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Full Name</label>
                  <div style={styles.inputWrapper}>
                    <User style={styles.iconLeft} />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} placeholder="Enter your full name" />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email</label>
                  <div style={styles.inputWrapper}>
                    <Mail style={styles.iconLeft} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} placeholder="Enter your email" />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Password</label>
                  <div style={styles.inputWrapper}>
                    <Lock style={styles.iconLeft} />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} placeholder="Enter password" />
                    <span style={styles.togglePassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</span>
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Confirm Password</label>
                  <div style={styles.inputWrapper}>
                    <Lock style={styles.iconLeft} />
                    <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={styles.input} placeholder="Confirm password" />
                    <span style={styles.togglePassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff /> : <Eye />}</span>
                  </div>
                </div>

                <button style={styles.button} onClick={handleRegister}>{loading ? 'Registering...' : 'Register'}</button>
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

export default Register;
