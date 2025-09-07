// client/src/App.js
import React, { useEffect, useState, createContext, useContext, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';
import { Toaster, toast } from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './App.css';
import VotingABI from './VotingABI.json';

// --- Configuration and ABI ---
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '';
const RECAPTCHA_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
const RPC_URL = process.env.REACT_APP_RPC_URL_BSC_TESTNET;

// --- Auth Context ---
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const logout = useCallback(async () => { 
    localStorage.removeItem('token'); 
    setUser(null); 
    setToken(null); 
  }, []);
  
  useEffect(() => {
    const loadUser = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await axios.get(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        setUser(res.data);
      } catch { 
        toast.error("Your session has expired. Please log in again."); 
        logout(); 
      } finally { 
        setLoading(false); 
      }
    };
    loadUser();
  }, [token, logout]);
  
  const login = async (email, password) => { 
    const res = await axios.post(`${API}/api/auth/login`, { email, password }); 
    localStorage.setItem('token', res.data.token); 
    setToken(res.data.token); 
    setUser(res.data.user); 
  };
  
  const register = async (payload) => axios.post(`${API}/api/auth/register`, payload);
  const refreshUser = async () => { 
    const tok = localStorage.getItem('token'); 
    if (!tok) return; 
    try { 
      const res = await axios.get(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${tok}` } }); 
      setUser(res.data); 
    } catch { 
      logout(); 
    } 
  };
  
  return ( 
    <AuthContext.Provider value={{ user, setUser, token, login, register, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider> 
  );
}

// --- Wallet Helpers ---
const getProvider = () => new ethers.JsonRpcProvider(RPC_URL);
const getSignerContract = async () => { 
  if (!window.ethereum) throw new Error('MetaMask is not installed.'); 
  const provider = new ethers.BrowserProvider(window.ethereum); 
  const signer = await provider.getSigner(); 
  return { contract: new ethers.Contract(CONTRACT_ADDRESS, VotingABI, signer), signer, provider }; 
};

// --- Layouts and Global Components ---
function MainLayout() { 
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  ); 
}

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = () => { 
    logout(); 
    toast.success('Logged out successfully'); 
    navigate('/login'); 
  };
  
  const getNavLinkClass = (path) => {
    if (path === '/') { 
      return location.pathname === '/' ? 'nav-link active' : 'nav-link'; 
    }
    return location.pathname.startsWith(path) ? 'nav-link active' : 'nav-link';
  };
  
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'D';
  
  return ( 
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">✨</span>
          <span>AuraVote</span>
        </Link>
        
        {/* Desktop Navigation */}
        {user && (
          <>
            <div className="navbar-links">
              <Link to="/" className={getNavLinkClass('/')}>
                <span className="nav-icon">🗳️</span>
                <span>Vote</span>
              </Link>
              <Link to="/results" className={getNavLinkClass('/results')}>
                <span className="nav-icon">📊</span>
                <span>Results</span>
              </Link>
              <Link to="/profile" className={getNavLinkClass('/profile')}>
                <span className="nav-icon">👤</span>
                <span>Profile</span>
              </Link>
              {user?.role === 'admin' && 
                <Link to="/admin" className={getNavLinkClass('/admin')}>
                  <span className="nav-icon">⚙️</span>
                  <span>Admin</span>
                </Link>
              }
            </div>
            
            <div className="navbar-actions">
              <div className="profile-menu-container">
                <button className="profile-avatar" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  {userInitial}
                </button>
                {dropdownOpen && (
                  <div className="profile-dropdown">
                    <div className="dropdown-header">
                      <span className="font-semibold">{user.name}</span>
                      <span className="text-sm text-muted">{user.email}</span>
                    </div>
                    <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <span className="dropdown-icon">👤</span>
                      Profile
                    </Link>
                    {user.role === 'admin' && 
                      <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <span className="dropdown-icon">⚙️</span>
                        Admin Dashboard
                      </Link>
                    }
                    <button className="dropdown-item" onClick={handleLogout}>
                      <span className="dropdown-icon">🚪</span>
                      Log out
                    </button>
                  </div>
                )}
              </div>
              
              {/* Mobile Menu Toggle */}
              <button 
                className="mobile-menu-toggle" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}></span>
                <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}></span>
                <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}></span>
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Mobile Navigation */}
      {user && mobileMenuOpen && (
        <div className="mobile-menu">
          <Link to="/" className={getNavLinkClass('/')} onClick={() => setMobileMenuOpen(false)}>
            <span className="nav-icon">🗳️</span>
            <span>Vote</span>
          </Link>
          <Link to="/results" className={getNavLinkClass('/results')} onClick={() => setMobileMenuOpen(false)}>
            <span className="nav-icon">📊</span>
            <span>Results</span>
          </Link>
          <Link to="/profile" className={getNavLinkClass('/profile')} onClick={() => setMobileMenuOpen(false)}>
            <span className="nav-icon">👤</span>
            <span>Profile</span>
          </Link>
          {user?.role === 'admin' && 
            <Link to="/admin" className={getNavLinkClass('/admin')} onClick={() => setMobileMenuOpen(false)}>
              <span className="nav-icon">⚙️</span>
              <span>Admin</span>
            </Link>
          }
          <button className="mobile-logout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span>Log out</span>
          </button>
        </div>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>AuraVote</h3>
            <p>Revolutionizing democracy through blockchain technology</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/results">Results</Link></li>
              <li><Link to="/profile">Profile</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Support</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Connect</h4>
            <div className="social-links">
              <a href="#" className="social-link">📘</a>
              <a href="#" className="social-link">🐦</a>
              <a href="#" className="social-link">📷</a>
              <a href="#" className="social-link">💼</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} AuraVote. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

const InfoBox = ({ children, title, text, icon }) => ( 
  <div className="info-box">
    {icon && <div className="info-box-icon">{icon}</div>}
    <div className="info-box-content">
      {title && <h3 className="info-box-title">{title}</h3>}
      {text && <p className="info-box-text">{text}</p>}
      {children}
    </div>
  </div>
);

// --- Auth Pages ---
function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Login failed');
    } finally { 
      setLoading(false); 
    }
  };
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">✨</span>
            <span className="auth-logo-text">AuraVote</span>
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your AuraVote account to continue voting</p>
        </div>
        
        <div className="auth-form-container">
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-group">
                <span className="input-icon">✉️</span>
                <input 
                  className="form-control" 
                  placeholder="you@example.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  type="email" 
                  required 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input 
                  className="form-control" 
                  placeholder="Enter your password" 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className="btn btn-primary btn-block btn-lg"
            >
              {loading ? <span className="spinner"></span> : 'Sign In'}
            </button>
          </form>
          
          <div className="auth-divider">
            <span>OR</span>
          </div>
          
          <div className="social-login">
            <button className="btn btn-social">
              <span className="social-icon">G</span>
              Continue with Google
            </button>
            <button className="btn btn-social">
              <span className="social-icon">f</span>
              Continue with Facebook
            </button>
          </div>
        </div>
        
        <p className="auth-link">
          Don't have an account? <Link to="/register">Create one here</Link>
        </p>
      </div>
      
      <div className="auth-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
        <div className="decoration-shape shape-1"></div>
        <div className="decoration-shape shape-2"></div>
      </div>
    </div>
  );
}

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    role: 'user', 
    inviteCode: '' 
  });
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  
  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (RECAPTCHA_KEY && !recaptchaToken) return toast.error('Please complete the reCAPTCHA');
    
    setLoading(true);
    try {
      await register({ ...form, recaptchaToken });
      toast.success('Registration successful! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Registration failed');
    } finally { 
      setLoading(false); 
    }
  };
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">✨</span>
            <span className="auth-logo-text">AuraVote</span>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Set up your AuraVote account to participate in secure elections</p>
        </div>
        
        <div className="auth-form-container">
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-group">
                <span className="input-icon">👤</span>
                <input 
                  name="name" 
                  className="form-control" 
                  placeholder="Enter your full name" 
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-group">
                <span className="input-icon">✉️</span>
                <input 
                  name="email" 
                  className="form-control" 
                  placeholder="you@example.com" 
                  type="email" 
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input 
                  name="password" 
                  className="form-control" 
                  placeholder="Create a strong password" 
                  type="password" 
                  value={form.password} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input 
                  name="confirmPassword" 
                  className="form-control" 
                  placeholder="Confirm your password" 
                  type="password" 
                  value={form.confirmPassword} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <div className="account-type-group">
                <label className={`account-type-label ${form.role === 'user' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    value="user" 
                    checked={form.role === 'user'} 
                    onChange={handleChange} 
                    className="account-type-radio" 
                  />
                  <span className="account-type-icon">🗳️</span>
                  <span>Voter</span>
                </label>
                <label className={`account-type-label ${form.role === 'admin' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    value="admin" 
                    checked={form.role === 'admin'} 
                    onChange={handleChange} 
                    className="account-type-radio" 
                  />
                  <span className="account-type-icon">⚙️</span>
                  <span>Admin</span>
                </label>
              </div>
            </div>
            
            {form.role === 'admin' && 
              <div className="form-group">
                <label className="form-label">Admin Invite Code</label>
                <div className="input-group">
                  <span className="input-icon">🔑</span>
                  <input 
                    name="inviteCode" 
                    className="form-control" 
                    placeholder="Enter invite code" 
                    value={form.inviteCode} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
            }
            
            {RECAPTCHA_KEY && 
              <div className="flex justify-center">
                <ReCAPTCHA sitekey={RECAPTCHA_KEY} onChange={setRecaptchaToken} />
              </div>
            }
            
            <button 
              type="submit" 
              disabled={loading} 
              className="btn btn-primary btn-block btn-lg"
            >
              {loading ? <span className="spinner"></span> : 'Create Account'}
            </button>
          </form>
        </div>
        
        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
      
      <div className="auth-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
        <div className="decoration-shape shape-1"></div>
        <div className="decoration-shape shape-2"></div>
      </div>
    </div>
  );
}

// --- Main App Pages ---
function HomePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [votingFor, setVotingFor] = useState(null);
  
  const fetchElectionData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/elections/active`);
      const activeElection = res.data;
      setElection(activeElection);
    } catch (err) {
      setElection(null);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (user) {
      fetchElectionData();
    }
  }, [user, fetchElectionData]);
  
  const handleVote = async (candidate) => {
    setVotingFor(candidate.onChainId);
    const voteToast = toast.loading(`Casting vote for ${candidate.name}...`);
    
    try {
      if (!user?.walletAddress) throw new Error('Please connect your wallet first.');
      if (user.hasVotedOn?.[election.onChainId]) throw new Error('You have already voted in this election.');
      
      const { contract } = await getSignerContract();
      toast.loading('Please approve the transaction in your wallet...', { id: voteToast });
      
      const tx = await contract.vote(election.onChainId, candidate.onChainId);
      toast.loading('Submitting your vote to the blockchain...', { id: voteToast });
      
      const receipt = await tx.wait();
      if (!receipt.hash) throw new Error("Transaction failed after submission.");
      
      toast.loading('Vote is on-chain! Verifying with server...', { id: voteToast });
      
      await axios.post(
        `${API}/api/verify/vote`,
        { txHash: receipt.hash, electionId: election.onChainId, candidateId: candidate.onChainId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      toast.success('Your vote has been successfully recorded!', { id: voteToast });
      await refreshUser();
      await fetchElectionData();
    } catch (err) {
      let message = err.reason || err.response?.data?.msg || err.message || 'An unknown error occurred.';
      if (err.code === 4001) message = 'Transaction rejected in wallet.';
      toast.error(message, { id: voteToast });
    } finally {
      setVotingFor(null);
    }
  };
  
  const hasVoted = user && election && user.hasVotedOn?.[election.onChainId];
  
  const ConnectWalletPrompt = () => (
    <div className="connect-wallet-section">
      <div className="banner warning">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        Wallet Required: Please connect your wallet to participate in voting.
      </div>
      
      <div className="connect-wallet-card">
        <div className="connect-wallet-icon">🦊</div>
        <h2>Connect Your Wallet</h2>
        <p>Link your MetaMask wallet to participate in secure voting</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/profile/wallet')}>
          Connect MetaMask
        </button>
        <div className="wallet-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-text">Install MetaMask</div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-text">Connect Your Wallet</div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-text">Start Voting</div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderContent = () => {
    if (loading) return <div className="loading-container"><div className="spinner-lg"></div></div>;
    if (!user?.walletAddress) return <ConnectWalletPrompt />;
    if (!election) return (
      <div className="no-election-container">
        <div className="no-election-icon">📅</div>
        <h2>No Active Election</h2>
        <p>There are no elections available for voting at this time.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/results')}>
          View Past Results
        </button>
      </div>
    );
    
    const totalVotes = election.candidates.reduce((sum, c) => sum + c.votes, 0);
    
    return (
      <>
        <div className="election-header">
          <h1 className="page-title">{election.title}</h1>
          {hasVoted && (
            <div className="banner success">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              You have successfully voted in this election. Thank you for your participation!
            </div>
          )}
        </div>
        
        <div className="candidates-grid">
          {election.candidates.map((candidate, index) => {
            const percentage = totalVotes > 0 ? (candidate.votes / totalVotes * 100) : 0;
            const isVoting = votingFor === candidate.onChainId;
            
            return (
              <div key={candidate.onChainId} className={`candidate-card ${isVoting ? 'voting' : ''}`}>
                <div className="candidate-header">
                  <div className="candidate-rank">#{index + 1}</div>
                  <div className="candidate-avatar">
                    {candidate.name.charAt(0)}
                  </div>
                </div>
                
                <div className="candidate-info">
                  <h3 className="candidate-name">{candidate.name}</h3>
                  <p className="candidate-party">{candidate.party || 'Independent'}</p>
                </div>
                
                <div className="candidate-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="progress-stats">
                    <span className="percentage">{percentage.toFixed(1)}%</span>
                    <span className="votes">{candidate.votes} votes</span>
                  </div>
                </div>
                
                <div className="candidate-actions">
                  <button
                    className={`btn ${hasVoted ? 'btn-secondary' : 'btn-primary'} btn-block`}
                    onClick={() => handleVote(candidate)}
                    disabled={hasVoted || isVoting}
                  >
                    {isVoting ? (
                      <span className="spinner"></span>
                    ) : hasVoted ? (
                      <span>Voted</span>
                    ) : (
                      <span>Vote Now</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="election-info-section">
          <div className="info-card">
            <div className="info-card-icon">ℹ️</div>
            <h3>About This Election</h3>
            <p>{election.description || 'No additional information available for this election.'}</p>
            <div className="election-meta">
              <div className="meta-item">
                <span className="meta-label">Start Date</span>
                <span className="meta-value">
                  {election.startAt ? new Date(election.startAt).toLocaleDateString() : 'Ongoing'}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">End Date</span>
                <span className="meta-value">
                  {election.endAt ? new Date(election.endAt).toLocaleDateString() : 'Until Closed'}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Total Votes</span>
                <span className="meta-value">{totalVotes}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };
  
  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Secure Voting Powered by Blockchain</h1>
          <p>Participate in transparent, tamper-proof elections with AuraVote</p>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-value">100%</div>
              <div className="stat-label">Transparent</div>
            </div>
            <div className="stat">
              <div className="stat-value">🔒</div>
              <div className="stat-label">Secure</div>
            </div>
            <div className="stat">
              <div className="stat-value">⚡</div>
              <div className="stat-label">Fast</div>
            </div>
          </div>
        </div>
        <div className="hero-decoration">
          <div className="floating-card card-1">
            <div className="card-icon">🗳️</div>
            <div className="card-title">Vote</div>
          </div>
          <div className="floating-card card-2">
            <div className="card-icon">🔍</div>
            <div className="card-title">Verify</div>
          </div>
          <div className="floating-card card-3">
            <div className="card-icon">📊</div>
            <div className="card-title">Results</div>
          </div>
        </div>
      </div>
      
      <div className="container">
        {renderContent()}
        
        <div className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            <Link to="/results" className="quick-action-card">
              <div className="quick-action-icon">📊</div>
              <h3>View Live Results</h3>
              <p>See real-time election results and statistics</p>
              <div className="quick-action-arrow">→</div>
            </Link>
            
            <Link to="/profile" className="quick-action-card">
              <div className="quick-action-icon">👤</div>
              <h3>Manage Profile</h3>
              <p>Update your account information and wallet</p>
              <div className="quick-action-arrow">→</div>
            </Link>
            
            <a 
              href={`https://testnet.bscscan.com/address/${CONTRACT_ADDRESS}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="quick-action-card"
            >
              <div className="quick-action-icon">🔗</div>
              <h3>View on Blockchain</h3>
              <p>Verify transactions on the blockchain explorer</p>
              <div className="quick-action-arrow">→</div>
            </a>
          </div>
        </div>
        
        <div className="features-section">
          <h2 className="section-title">Why Choose AuraVote?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Immutable</h3>
              <p>Every vote is recorded on the blockchain, making it tamper-proof and permanently verifiable.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">👁️</div>
              <h3>Transparent</h3>
              <p>Anyone can verify the election results, ensuring complete transparency in the voting process.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast & Efficient</h3>
              <p>Blockchain technology enables near-instant vote counting and result publication.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Accessible</h3>
              <p>Vote from anywhere in the world with just an internet connection and a digital wallet.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsPage() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const location = useLocation();
  
  const fetchResults = useCallback(async (electionId) => {
    setLoading(true);
    const url = electionId ? `${API}/api/elections/results?id=${electionId}` : `${API}/api/elections/results`;
    
    try {
      const res = await axios.get(url);
      setData(res.data);
    } catch { 
      setData(null); 
      if (!electionId) toast.error("No live election results to show.");
    } finally { 
      setLoading(false); 
    }
  }, []);
  
  useEffect(() => {
    axios.get(`${API}/api/elections/history`).then(res => setHistory(res.data)).catch(() => {});
    
    const queryParams = new URLSearchParams(location.search);
    const specificId = queryParams.get('id');
    setSelectedElectionId(specificId || '');
    fetchResults(specificId);
  }, [location.search, fetchResults]);
  
  const handleSelectionChange = (e) => {
    const newId = e.target.value;
    setSelectedElectionId(newId);
    fetchResults(newId);
  };
  
  const exportCSV = (sortedCandidates) => {
    if (!data) return;
    const csvData = Papa.unparse(sortedCandidates.map(r => ({ 
      Candidate: r.name, 
      Party: r.party, 
      Votes: r.votes 
    })));
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${data.title.replace(/\s+/g, '_')}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const exportPDF = (sortedCandidates) => {
    if (!data) return;
    const doc = new jsPDF();
    doc.text(data.title, 14, 16);
    doc.autoTable({ 
      startY: 22, 
      head: [['Rank', 'Candidate', 'Party', 'Votes']], 
      body: sortedCandidates.map((r, i) => [i+1, r.name, r.party, r.votes]) 
    });
    doc.save(`${data.title.replace(/\s+/g, '_')}_results.pdf`);
  };
  
  if (loading) return <div className="loading-container"><div className="spinner-lg"></div></div>;
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false, }, 
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { color: '#DDDDDD', }, 
        grid: { color: 'rgba(255, 255, 255, 0.1)', }, 
      },
      x: { 
        ticks: { color: '#DDDDDD', }, 
        grid: { display: false, }, 
      },
    },
  };
  
  if (!data) return (
    <div className="results-page">
      <div className="container">
        <div className="results-header">
          <div className="results-title-container">
            <h1>Election Results</h1>
          </div>
          <div className="results-header-actions">
            <select className="results-dropdown" value={selectedElectionId} onChange={handleSelectionChange}>
              <option value="">View Live Election</option>
              <optgroup label="Past Elections">
                {history.map(h => <option key={h.onChainId} value={h.onChainId}>{h.title}</option>)}
              </optgroup>
            </select>
          </div>
        </div>
        
        <div className="no-results-container">
          <div className="no-results-icon">📊</div>
          <h2>No Election Data</h2>
          <p>There is no live election currently. Select a past election from the dropdown to view its results.</p>
          <button className="btn btn-primary" onClick={() => setSelectedElectionId(history[0]?.onChainId)}>
            View Latest Results
          </button>
        </div>
      </div>
    </div>
  );
  
  const sortedCandidates = [...(data.results || [])].sort((a, b) => b.votes - a.votes);
  const totalVotes = sortedCandidates.reduce((sum, c) => sum + c.votes, 0);
  
  const chartData = {
    labels: sortedCandidates.map(s => s.name),
    datasets:[{ 
      label: 'Votes', 
      data: sortedCandidates.map(s => s.votes), 
      backgroundColor: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'], 
      borderRadius: 4, 
    }]
  };
  
  return (
    <div className="results-page">
      <div className="container">
        <div className="results-header">
          <div className="results-title-container">
            <h1>{data.title}</h1>
            <div className={`status-tag ${data.status === 'Live' ? 'active' : 'closed'}`}>
              {data.status}
            </div>
          </div>
          <div className="results-header-actions">
            <select className="results-dropdown" value={selectedElectionId} onChange={handleSelectionChange}>
              <option value="">View Live Election</option>
              <optgroup label="Past Elections">
                {history.map(h => <option key={h.onChainId} value={h.onChainId}>{h.title}</option>)}
              </optgroup>
            </select>
            <button onClick={() => fetchResults(selectedElectionId)} className="btn btn-secondary">
              <span className="btn-icon">🔄</span>
              Refresh
            </button>
          </div>
        </div>
        
        <div className="results-summary">
          <div className="summary-card">
            <div className="summary-icon">🗳️</div>
            <div className="summary-content">
              <div className="summary-value">{totalVotes}</div>
              <div className="summary-label">Total Votes</div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon">👥</div>
            <div className="summary-content">
              <div className="summary-value">{sortedCandidates.length}</div>
              <div className="summary-label">Candidates</div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon">📅</div>
            <div className="summary-content">
              <div className="summary-value">{new Date(data.createdAt).toLocaleDateString()}</div>
              <div className="summary-label">Election Date</div>
            </div>
          </div>
        </div>
        
        <div className="results-content">
          <div className="chart-container">
            <div className="card">
              <h3 className="card-title">Vote Distribution</h3>
              <div className="chart-wrapper">
                <Bar data={chartData} options={chartOptions}/>
              </div>
            </div>
          </div>
          
          <div className="export-container">
            <div className="card">
              <h3 className="card-title">Export Results</h3>
              <div className="export-buttons">
                <button onClick={() => exportCSV(sortedCandidates)} className="btn btn-secondary">
                  <span className="btn-icon">📄</span>
                  Export as CSV
                </button>
                <button onClick={() => exportPDF(sortedCandidates)} className="btn btn-secondary">
                  <span className="btn-icon">📑</span>
                  Export as PDF
                </button>
                <a 
                  href={`https://testnet.bscscan.com/address/${CONTRACT_ADDRESS}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary"
                >
                  <span className="btn-icon">🔗</span>
                  View on Blockchain
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="detailed-results">
          <div className="card">
            <h3 className="card-title">Detailed Results</h3>
            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Candidate</th>
                    <th>Party</th>
                    <th>Votes</th>
                    <th>Percentage</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCandidates.map((c, index) => { 
                    const percentage = totalVotes > 0 ? (c.votes / totalVotes * 100) : 0; 
                    return (
                      <tr key={c.onChainId}>
                        <td><div className="rank-badge">#{index + 1}</div></td>
                        <td>
                          <div className="candidate-info">
                            <div className="candidate-avatar">{c.name.charAt(0)}</div>
                            <span>{c.name}</span>
                          </div>
                        </td>
                        <td>{c.party || 'Independent'}</td>
                        <td>{c.votes}</td>
                        <td>{percentage.toFixed(2)}%</td>
                        <td>
                          <div className="table-progress">
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) 
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Profile Components ---
function ProfilePage() {
  const { user } = useAuth();
  const location = useLocation();
  
  if (!user) return <Navigate to="/login" />;
  
  const activeTab = location.pathname.split('/')[2] || 'overview';
  const getTabClass = (tabName) => `profile-tab-link ${activeTab === tabName ? 'active' : ''}`;
  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'D';
  
  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <div className="profile-avatar-large">{userInitial}</div>
          <div className="profile-info">
            <h2>{user.name}</h2>
            <div className="profile-meta">
              <div className="role-tag">{user.role}</div>
              <div className="profile-email">{user.email}</div>
            </div>
          </div>
        </div>
        
        <div className="profile-tabs">
          <Link to="/profile" className={getTabClass('overview')}>
            <span className="tab-icon">📊</span>
            <span>Overview</span>
          </Link>
          <Link to="/profile/wallet" className={getTabClass('wallet')}>
            <span className="tab-icon">🦊</span>
            <span>Wallet</span>
          </Link>
          <Link to="/profile/history" className={getTabClass('history')}>
            <span className="tab-icon">🕒</span>
            <span>Voting History</span>
          </Link>
          <Link to="/profile/settings" className={getTabClass('settings')}>
            <span className="tab-icon">⚙️</span>
            <span>Settings</span>
          </Link>
        </div>
        
        <div className="profile-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function ProfileOverview() {
  const { user } = useAuth();
  
  return (
    <div className="profile-overview">
      <div className="profile-cards">
        <div className="card profile-card">
          <h3 className="card-title">Account Information</h3>
          <div className="profile-info-grid">
            <div className="info-item">
              <span className="info-label">Full Name</span>
              <span className="info-value">{user.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Role</span>
              <span className="info-value">{user.role}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Member Since</span>
              <span className="info-value">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="profile-stats">
          <div className="card">
            <h3 className="card-title">Voting Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🗳️</div>
                <div className="stat-content">
                  <div className="stat-value">{user.hasVotedOn ? Object.keys(user.hasVotedOn).length : 0}</div>
                  <div className="stat-label">Elections Participated</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🦊</div>
                <div className="stat-content">
                  <div className="stat-value">{user.walletAddress ? 'Connected' : 'Not Connected'}</div>
                  <div className="stat-label">Wallet Status</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="card-title">Quick Actions</h3>
            <div className="quick-actions-list">
              <Link to="/" className="quick-action">
                <span className="quick-action-icon">🗳️</span>
                <span>Vote in Elections</span>
              </Link>
              <Link to="/results" className="quick-action">
                <span className="quick-action-icon">📊</span>
                <span>View Results</span>
              </Link>
              {user.role === 'admin' && 
                <Link to="/admin" className="quick-action">
                  <span className="quick-action-icon">⚙️</span>
                  <span>Admin Dashboard</span>
                </Link>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileWallet() {
  const { user, refreshUser } = useAuth();
  const [linking, setLinking] = useState(false);
  const [balance, setBalance] = useState(null);
  
  useEffect(() => {
    const fetchBalance = async () => {
      if (user?.walletAddress) {
        try {
          const provider = getProvider();
          const balanceWei = await provider.getBalance(user.walletAddress);
          setBalance(parseFloat(ethers.formatEther(balanceWei)).toFixed(5));
        } catch (err) { 
          console.error("Failed to fetch balance:", err); 
          setBalance('N/A'); 
        }
      } else { 
        setBalance(null); 
      }
    };
    
    fetchBalance();
  }, [user?.walletAddress]);
  
  const linkWallet = async () => {
    if (!window.ethereum) { 
      return toast.error('MetaMask is not installed.'); 
    }
    
    setLinking(true);
    const toastId = toast.loading('Initializing wallet connection...');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication error.');
      
      const { data: { message } } = await axios.post(
        `${API}/api/auth/challenge`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      toast.loading('Please sign the message in MetaMask...', { id: toastId, icon: '✍️' });
      const signature = await signer.signMessage(message);
      
      await axios.post(
        `${API}/api/auth/verify-link`, 
        { signature }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await refreshUser();
      toast.success('Wallet linked successfully!', { id: toastId });
    } catch (err) {
      let errorMessage = err.reason || err.response?.data?.msg || err.message || 'An unexpected error occurred.';
      if (err.code === 4001) errorMessage = 'You rejected the request in your wallet.';
      toast.error(errorMessage, { id: toastId });
    } finally { 
      setLinking(false); 
    }
  };
  
  const disconnectWallet = async () => {
    if (!window.confirm("Are you sure you want to disconnect your wallet?")) return;
    
    const toastId = toast.loading("Disconnecting wallet...");
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/api/auth/disconnect-wallet`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await refreshUser();
      toast.success("Wallet disconnected.", { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to disconnect.", { id: toastId });
    }
  };
  
  return (
    <div className="profile-wallet">
      <div className="wallet-container">
        <div className="wallet-header">
          <div className="wallet-icon">🦊</div>
          <h3>{user.walletAddress ? "Wallet Connected" : "Connect Wallet"}</h3>
          <p className="text-muted">
            {user.walletAddress ? "Your wallet is linked and ready for voting." : "Link your MetaMask wallet to participate in voting."}
          </p>
        </div>
        
        {user.walletAddress ? (
          <div className="wallet-info">
            <div className="wallet-card">
              <div className="wallet-balance">
                <div className="balance-label">Balance</div>
                <div className="balance-value">{balance === null ? 'Loading...' : `${balance} tBNB`}</div>
              </div>
              <div className="wallet-address-container">
                <div className="address-label">Your Address</div>
                <div className="address-value">{user.walletAddress}</div>
              </div>
              <button onClick={disconnectWallet} className="btn btn-danger btn-block">
                Disconnect Wallet
              </button>
            </div>
            
            <div className="wallet-info-cards">
              <div className="info-card">
                <div className="info-icon">✅</div>
                <div className="info-content">
                  <h4>Verified</h4>
                  <p>Your wallet has been successfully verified and linked to your account.</p>
                </div>
              </div>
              
              <div className="info-card">
                <div className="info-icon">🔒</div>
                <div className="info-content">
                  <h4>Secure</h4>
                  <p>Your private keys never leave your device, ensuring maximum security.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="connect-wallet-steps">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Install MetaMask</h4>
                <p>Download and install the MetaMask browser extension</p>
              </div>
            </div>
            
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Create or Import Wallet</h4>
                <p>Set up a new wallet or import an existing one</p>
              </div>
            </div>
            
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Connect to AuraVote</h4>
                <p>Click the button below to link your wallet</p>
              </div>
            </div>
            
            <button onClick={linkWallet} disabled={linking} className="btn btn-primary btn-lg">
              {linking ? <span className="spinner"></span> : 'Connect MetaMask'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileVotingHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API}/api/elections`);
        setElections(res.data);
      } catch { 
        toast.error("Could not load election history."); 
      } finally { 
        setLoading(false); 
      }
    };
    
    fetchHistory();
  }, []);
  
  if (loading) return <div className="loading-container"><div className="spinner-lg"></div></div>;
  
  const votedElections = elections.filter(e => user.hasVotedOn?.[e.onChainId]);
  
  if (votedElections.length === 0) {
    return (
      <div className="profile-history">
        <div className="empty-history">
          <div className="empty-icon">🕒</div>
          <h3>No Voting History</h3>
          <p>You haven't participated in any elections yet.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Vote Now
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="profile-history">
      <h3 className="section-title">Your Voting History</h3>
      <div className="history-list">
        {votedElections.map(e => (
          <div key={e.onChainId} className="history-item">
            <div className="history-info">
              <div className="history-title">{e.title}</div>
              <div className="history-date">
                <span className="date-icon">📅</span>
                <span>Voted on: {new Date(e.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate(`/results?id=${e.onChainId}`)}>
              View Results
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileSettings() {
  const { user, setUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: user.name, email: user.email });
  const navigate = useNavigate();
  
  const handleSave = (e) => {
    e.preventDefault();
    // In a real app, you'd make an API call to update the user info.
    // For this demo, we'll just update the local state.
    setUser({...user, ...form});
    toast.success("Profile updated!");
    setIsEditing(false);
  };
  
  return (
    <div className="profile-settings">
      <div className="settings-container">
        <div className="settings-card">
          <h3 className="card-title">Account Settings</h3>
          <p>Update your personal information and preferences.</p>
          
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                className="form-control" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                disabled={!isEditing} 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                className="form-control" 
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
                disabled={!isEditing} 
              />
            </div>
            
            {isEditing ? (
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Save Changes</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            )}
          </form>
        </div>
        
        <div className="danger-zone">
          <h3 className="danger-zone-title">Danger Zone</h3>
          <p>Irreversible actions that affect your account.</p>
          
          <div className="danger-actions">
            <div className="danger-action">
              <div className="danger-info">
                <h4>Log Out of Account</h4>
                <p>Logging out will require you to sign in again.</p>
              </div>
              <button className="btn btn-danger" onClick={() => { logout(); navigate('/login'); }}>
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Admin Components ---
function AdminPage() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModal, setDetailsModal] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  
  const loadElections = useCallback(async () => {
    setLoading(true);
    try { 
      const res = await axios.get(`${API}/api/elections`); 
      setElections(res.data); 
    } catch { 
      toast.error('Failed to load elections'); 
    } finally { 
      setLoading(false); 
    }
  }, []);
  
  useEffect(() => { loadElections(); }, [loadElections]);
  
  const now = new Date();
  const activeElections = elections.filter(e => 
    !e.closed && (!e.endAt || new Date(e.endAt) > now) && (!e.startAt || new Date(e.startAt) <= now)
  );
  const upcomingElections = elections.filter(e => 
    !e.closed && e.startAt && new Date(e.startAt) > now
  );
  const historyElections = elections.filter(e => 
    e.closed || (e.endAt && new Date(e.endAt) <= now)
  );
  
  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <button className="btn btn-primary btn-lg" onClick={() => setModalOpen(true)}>
            <span className="btn-icon">+</span>
            Create Election
          </button>
        </div>
        
        <div className="admin-summary">
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <div className="summary-value">{elections.length}</div>
              <div className="summary-label">Total Elections</div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon">🟢</div>
            <div className="summary-content">
              <div className="summary-value">{activeElections.length}</div>
              <div className="summary-label">Active Elections</div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon">🟡</div>
            <div className="summary-content">
              <div className="summary-value">{upcomingElections.length}</div>
              <div className="summary-label">Upcoming</div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon">🔚</div>
            <div className="summary-content">
              <div className="summary-value">{historyElections.length}</div>
              <div className="summary-label">Finished</div>
            </div>
          </div>
        </div>
        
        <div className="admin-tabs">
          <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>
            <span className="tab-icon">🟢</span>
            Active ({activeElections.length})
          </button>
          <button className={activeTab === 'upcoming' ? 'active' : ''} onClick={() => setActiveTab('upcoming')}>
            <span className="tab-icon">🟡</span>
            Upcoming ({upcomingElections.length})
          </button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
            <span className="tab-icon">🔚</span>
            History ({historyElections.length})
          </button>
        </div>
        
        <div className="admin-content">
          {loading ? <div className="loading-container"><div className="spinner-lg"></div></div> : (
            <>
              {activeTab === 'active' && 
                <ElectionList elections={activeElections} onViewDetails={setDetailsModal} onAction={loadElections} />}
              {activeTab === 'upcoming' && 
                <ElectionList elections={upcomingElections} onViewDetails={setDetailsModal} onAction={loadElections} />}
              {activeTab === 'history' && 
                <ElectionList elections={historyElections} isHistory onViewDetails={setDetailsModal} onAction={loadElections} />}
            </>
          )}
        </div>
      </div>
      
      {modalOpen && <CreateElectionModal onClose={() => setModalOpen(false)} onCreated={loadElections} />}
      {detailsModal && <ElectionDetailsModal election={detailsModal} onClose={() => setDetailsModal(null)} />}
    </div>
  );
}

function ElectionList({ elections, onViewDetails, isHistory, onAction }) {
  if (elections.length === 0) return (
    <div className="empty-elections">
      <div className="empty-icon">📋</div>
      <h3>No Elections</h3>
      <p>There are no elections in this category.</p>
    </div>
  );
  
  const handleClose = async (election) => {
    if (!window.confirm(`Are you sure you want to close the election "${election.title}"? This cannot be undone.`)) return;
    
    const toastId = toast.loading("Closing election...");
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/api/admin/elections/${election.onChainId}/close`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Election closed.", { id: toastId });
      onAction();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to close election.", { id: toastId });
    }
  };
  
  const handleDelete = async (election) => {
    if (!window.confirm(`DELETE "${election.title}"? This only removes it from the database, not the blockchain.`)) return;
    
    const toastId = toast.loading("Deleting election...");
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API}/api/admin/elections/${election._id}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Election deleted from DB.", { id: toastId });
      onAction();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to delete.", { id: toastId });
    }
  };
  
  return (
    <div className="election-list">
      {elections.map(e => {
        const now = new Date();
        let status = "SCHEDULED";
        let statusClass = "scheduled";
        
        if (e.closed) { 
          status = "CLOSED"; 
          statusClass = "closed"; 
        } else if (e.endAt && new Date(e.endAt) < now) { 
          status = "FINISHED"; 
          statusClass = "closed"; 
        } else if (!e.startAt || new Date(e.startAt) <= now) { 
          status = "ACTIVE"; 
          statusClass = "active"; 
        }
        
        return (
          <div className="election-card" key={e._id}>
            <div className="election-card-header">
              <h3>{e.title}</h3>
              <div className={`status-tag ${statusClass}`}>{status}</div>
            </div>
            
            <div className="election-meta">
              <div className="meta-item">
                <span className="meta-label">On-chain ID</span>
                <span className="meta-value">{e.onChainId}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Candidates</span>
                <span className="meta-value">{e.candidates?.length || 0}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Votes</span>
                <span className="meta-value">{e.votesTotal || 0}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Created</span>
                <span className="meta-value">{new Date(e.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="election-actions">
              <button onClick={() => onViewDetails(e)} className="btn btn-secondary">
                <span className="btn-icon">👁️</span>
                Details
              </button>
              <a 
                href={`https://testnet.bscscan.com/address/${CONTRACT_ADDRESS}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-secondary"
              >
                <span className="btn-icon">🔗</span>
                Blockchain
              </a>
              {status === 'ACTIVE' && 
                <button onClick={() => handleClose(e)} className="btn btn-warning">
                  <span className="btn-icon">🔒</span>
                  Close
                </button>
              }
              <button onClick={() => handleDelete(e)} className="btn btn-danger">
                <span className="btn-icon">🗑️</span>
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ElectionDetailsModal({ election, onClose }){
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{election.title}</h3>
          <button type="button" onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <p className={!election.description ? 'text-muted' : ''}>
            {election.description || "No description was provided for this election."}
          </p>
          
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">On-Chain ID</span>
              <span className="detail-value">{election.onChainId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-value">{election.closed ? 'Closed' : 'Active'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Created</span>
              <span className="detail-value">{new Date(election.createdAt).toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Votes</span>
              <span className="detail-value">{election.votesTotal || 0}</span>
            </div>
          </div>
          
          <h4 className="candidates-title">Candidates</h4>
          <div className="candidates-list">
            {election.candidates?.length > 0 ? (
              <ul>
                {election.candidates.map(c => (
                  <li key={c.onChainId}>
                    <div className="candidate-info">
                      <div className="candidate-avatar">{c.name.charAt(0)}</div>
                      <div>
                        <div className="candidate-name">{c.name}</div>
                        <div className="candidate-party">{c.party || 'Independent'}</div>
                      </div>
                    </div>
                    <div className="candidate-votes">{c.votes} votes</div>
                  </li>
                ))}
              </ul>
            ) : ( 
              <div className="modal-empty-state">
                <p>No candidates were found for this election.</p>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateElectionModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    startAt: '', 
    endAt: '', 
    candidates: [{ name: '', party: '' }] 
  });
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);
  
  const handleCandidateChange = (index, field, value) => { 
    const newCandidates = [...form.candidates]; 
    newCandidates[index][field] = value; 
    setForm({ ...form, candidates: newCandidates }); 
  };
  
  const addCandidateField = () => setForm({ 
    ...form, 
    candidates: [...form.candidates, { name: '', party: '' }] 
  });
  
  const removeCandidateField = (index) => { 
    const newCandidates = form.candidates.filter((_, i) => i !== index); 
    setForm({ ...form, candidates: newCandidates }); 
  };
  
  const isFormValid = () => form.title.trim() && form.candidates.some(c => c.name.trim());
  
  const handleCreate = async () => {
    if (!isFormValid()) { 
      toast.error("Please provide an election title and at least one candidate name."); 
      return; 
    }
    
    setLoading(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    const createToast = toast.loading("Creating election on the blockchain...");
    
    try {
      const token = localStorage.getItem('token');
      const validCandidates = form.candidates.filter(c => c.name.trim());
      const payload = { 
        title: form.title, 
        description: form.description, 
        startAt: form.startAt || null, 
        endAt: form.endAt || null, 
        candidates: validCandidates 
      };
      
      const res = await axios.post(
        `${API}/api/admin/elections`, 
        payload, 
        { headers: { Authorization: `Bearer ${token}` }, signal }
      );
      
      if (res.data.onChainId) {
        toast.loading(`Adding ${validCandidates.length} candidate(s)...`, { id: createToast });
        for (const candidate of validCandidates) {
          await axios.post(
            `${API}/api/admin/elections/${res.data.onChainId}/candidates`, 
            { name: candidate.name, party: candidate.party }, 
            { headers: { Authorization: `Bearer ${token}` }, signal }
          );
        }
      }
      
      toast.success('Election created successfully!', { id: createToast });
      onCreated();
      onClose();
    } catch (err) {
      if (axios.isCancel(err)) {
        toast.error('Election creation cancelled.', { id: createToast });
        onClose();
      } else {
        toast.error(err.response?.data?.msg || 'Failed to create election.', { id: createToast });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };
  
  const handleCancelCreation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <h3>Create New Election</h3>
          <button 
            type="button" 
            onClick={loading ? handleCancelCreation : onClose} 
            className="modal-close-btn"
          >
            &times;
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Election Title *</label>
            <input 
              className="form-control" 
              placeholder="e.g., Student Council Election 2025" 
              value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })} 
              disabled={loading} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="form-control" 
              placeholder="Brief description of the election..." 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })} 
              disabled={loading}
              rows={3}
            ></textarea>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date (Optional)</label>
              <input 
                type="datetime-local" 
                className="form-control" 
                value={form.startAt} 
                onChange={e => setForm({ ...form, startAt: e.target.value })} 
                disabled={loading} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date (Optional)</label>
              <input 
                type="datetime-local" 
                className="form-control" 
                value={form.endAt} 
                onChange={e => setForm({ ...form, endAt: e.target.value })} 
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Candidates *</label>
            <div className="candidates-list">
              {form.candidates.map((c, i) => (
                <div key={i} className="candidate-input">
                  <div className="input-group">
                    <span className="input-icon">👤</span>
                    <input 
                      className="form-control" 
                      placeholder="Candidate Name *" 
                      value={c.name} 
                      onChange={e => handleCandidateChange(i, 'name', e.target.value)} 
                      disabled={loading} 
                    />
                  </div>
                  <div className="input-group">
                    <span className="input-icon">🏷️</span>
                    <input 
                      className="form-control" 
                      placeholder="Party (Optional)" 
                      value={c.party} 
                      onChange={e => handleCandidateChange(i, 'party', e.target.value)} 
                      disabled={loading} 
                    />
                  </div>
                  {!loading && form.candidates.length > 1 && 
                    <button 
                      type="button" 
                      onClick={() => removeCandidateField(i)} 
                      className="btn-remove-candidate"
                    >
                      &times;
                    </button>
                  }
                </div>
              ))}
            </div>
            <button 
              type="button" 
              onClick={addCandidateField} 
              className="btn btn-secondary btn-outline"
              disabled={loading}
            >
              <span className="btn-icon">+</span>
              Add Candidate
            </button>
          </div>
        </div>
        
        <div className="modal-footer">
          {loading ? (
            <button type="button" className="btn btn-danger" onClick={handleCancelCreation}>
              Cancel Creation
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleCreate} 
                disabled={!isFormValid()}
              >
                Create Election
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Routing ---
export default function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" toastOptions={{ className: 'toast' }} />
      <Router>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/results" element={<ResultsPage />} />
            
            <Route path="/profile" element={<ProfilePage />}>
              <Route index element={<ProfileOverview />} />
              <Route path="wallet" element={<ProfileWallet />} />
              <Route path="history" element={<ProfileVotingHistory />} />
              <Route path="settings" element={<ProfileSettings />} />
            </Route>
            
            <Route path="/admin" element={<AdminRoute />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

const LoadingScreen = () => <div className="loading-container"><div className="spinner-lg"></div></div>;

function PublicRoute({ children }) { 
  const { user, loading } = useAuth(); 
  if (loading) return <LoadingScreen />; 
  return !user ? children : <Navigate to="/" />; 
}

function PrivateRoute() { 
  const { user, loading } = useAuth(); 
  if (loading) return <LoadingScreen />; 
  return user ? <MainLayout /> : <Navigate to="/login" />; 
}

function AdminRoute() { 
  const { user } = useAuth(); 
  return user.role === 'admin' ? <AdminPage /> : <Navigate to="/" />; 
}