import React, { useContext, useState } from 'react';
import './LoginPopup.css';
import { assets } from '../../assets/assets';
import axios from 'axios';
import { StoreData } from '../../context/StoreData';

const LoginPopup = ({ setAdminLogin }) => {
  const { url, setAdminToken } = useContext(StoreData);

  const [currState, setCurrState] = useState('Login');
  const [data, setData] = useState({
    name: '',
    email: '',
    password: '',
    pesId: '', // store only the numeric part user types
  });
  const [loading, setLoading] = useState(false);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setData((d) => ({ ...d, [name]: value }));
  };

  const buildEndpoint = (path) => {
    // avoid double slashes
    const base = url?.endsWith('/') ? url.slice(0, -1) : url || '';
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const onLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = currState === 'Login'
        ? buildEndpoint('/api/admin/login')
        : buildEndpoint('/api/admin/register');

      let payload;
      if (currState === 'Login') {
        // backend expects only email + password
        payload = {
          email: data.email,
          password: data.password,
        };
      } else {
        // For Sign Up, backend expects: name, email, password, pesId (PES + 7 digits)
        const numeric = String(data.pesId || '').replace(/\D/g, '');
        const pesId = `PES${numeric.padStart(10, '0')}`;

        payload = {
          name: data.name,
          email: data.email,
          password: data.password,
          pesId,
        };
      }

      const response = await axios.post(endpoint, payload, {
        // if you’re using cookies/JWT in cookies set withCredentials: true
        // withCredentials: true,
      });

      if (response?.data?.success) {
        const token = response.data.adToken;
        setAdminToken(token);
        localStorage.setItem('adToken', token);
        setAdminLogin(false);
      } else {
        // backend returned success: false
        alert(response?.data?.message || 'Action failed');
      }
    } catch (err) {
      // Axios puts server message at err.response.data.message
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Request failed';
      alert(msg);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-popup">
      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currState}</h2>
          <img onClick={() => setAdminLogin(false)} src={assets.cross_icon} alt="Close" />
        </div>

        <div className="login-popup-input">
          {currState === 'Login' ? null : (
            <>
              <input
                type="text"
                name="name"
                onChange={onChangeHandler}
                value={data.name}
                placeholder="Name"
                required
              />

              {/* Use text instead of number to avoid stripping leading zeros */}
              <label className="predefined-text">
                PES
                <input
                  type="text"
                  name="pesId"
                  onChange={onChangeHandler}
                  value={data.pesId}
                  placeholder="PRN (10 digits)"
                  className="pesu-id"
                  inputMode="numeric"
                  pattern="\d{10}"
                  title="Enter 10 digits"
                  required
                />
              </label>
            </>
          )}

          <input
            type="email"
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            placeholder="Email"
            required
          />
          <input
            type="password"
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            placeholder="Password"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading
            ? 'Please wait...'
            : currState === 'Sign Up'
              ? 'Create account'
              : 'Login'}
        </button>

        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>By continuing, I agree to the terms of use and privacy policy.</p>
        </div>

        {currState === 'Login' ? (
          <p>
            Are you new?{' '}
            <span onClick={() => setCurrState('Sign Up')}>Sign up here</span>
          </p>
        ) : (
          <p>
            I have an account!!{' '}
            <span onClick={() => setCurrState('Login')}>Login here</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;
