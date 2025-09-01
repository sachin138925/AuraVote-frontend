// client/src/App.js
import React, { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';
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

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Configuration
const API = process.env.REACT_APP_API_URL;
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '';
const RECAPTCHA_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
const RPC_URL = process.env.REACT_APP_RPC_URL_BSC_TESTNET;

// Contract ABI
const VotingABI = [
  "function getElectionBasic(uint256) view returns (uint256,string,string,uint256,uint256,bool,uint256)",
  "function getCandidate(uint256,uint256) view returns (uint256,string,string,uint256)",
  "function vote(uint256,uint256)",
  "event Voted(uint256 indexed electionId,uint256 indexed candidateId,address indexed voter)"
];

// Auth Context
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        setUser(res.data);
      } catch {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/api/auth/login`, { email, password });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (payload) => axios.post(`${API}/api/auth/register`, payload);

  const logout = async () => {
    const tok = localStorage.getItem('token');
    if (tok) {
      try { await axios.post(`${API}/api/auth/logout`, {}, { headers: { Authorization: `Bearer ${tok}` } }); } catch {}
    }
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

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

  return <AuthContext.Provider value={{ user, token, login, register, logout, refreshUser, loading }}>{children}</AuthContext.Provider>;
}

// Wallet helpers
const getSignerContract = async () => {
  if (!window.ethereum) throw new Error('MetaMask is not installed.');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingABI, signer);
  return { contract, signer };
};

// UI Components
const Button = ({ children, variant = 'primary', size = 'md', ...props }) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    outline: 'btn-outline'
  };
  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  };
  
  return (
    <button 
      {...props} 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', header, footer }) => (
  <div className={`card ${className}`}>
    {header && <div className="card-header">{header}</div>}
    <div className="card-body">{children}</div>
    {footer && <div className="card-footer">{footer}</div>}
  </div>
);

// Main Layout
function MainLayout() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <Footer />
    </>
  );
}

// Navbar
function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="text-primary">Hybrid</span>Vote
        </Link>
        <div className="navbar-nav">
          {user ? (
            <>
              <Link to="/" className="nav-link">Vote</Link>
              <Link to="/results" className="nav-link">Results</Link>
              <Link to="/profile" className="nav-link">Profile</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="nav-link text-primary font-semibold">Admin Panel</Link>
              )}
              <Button variant="outline" onClick={handleLogout} size="sm">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// Footer
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} HybridVote. All rights reserved.</p>
        <p>Secure blockchain voting system</p>
      </div>
    </footer>
  );
}

// Login Page
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
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <Card header={<h2 className="text-center">Sign In to Your Account</h2>}>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="d-grid gap-2 mt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? <span className="spinner me-2"></span> : null}
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </div>
            </form>
            <div className="text-center mt-4">
              <p>Don't have an account? <Link to="/register" className="text-primary">Register here</Link></p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Register Page
function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'user', 
    inviteCode: '' 
  });
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({...form, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (RECAPTCHA_KEY && !recaptchaToken) {
      return toast.error('Please complete the reCAPTCHA');
    }
    setLoading(true);
    try {
      await register({ ...form, recaptchaToken });
      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <Card header={<h2 className="text-center">Create an Account</h2>}>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name</label>
                <input
                  id="name"
                  type="text"
                  className="form-control"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Account Type</label>
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input
                      type="radio"
                      id="role-user"
                      name="role"
                      value="user"
                      checked={form.role === 'user'}
                      onChange={handleChange}
                      className="form-check-input"
                    />
                    <label htmlFor="role-user" className="form-check-label">Voter</label>
                  </div>
                  <div className="form-check">
                    <input
                      type="radio"
                      id="role-admin"
                      name="role"
                      value="admin"
                      checked={form.role === 'admin'}
                      onChange={handleChange}
                      className="form-check-input"
                    />
                    <label htmlFor="role-admin" className="form-check-label">Administrator</label>
                  </div>
                </div>
              </div>
              {form.role === 'admin' && (
                <div className="form-group">
                  <label htmlFor="inviteCode" className="form-label">Admin Invite Code</label>
                  <input
                    id="inviteCode"
                    type="text"
                    className="form-control"
                    placeholder="Enter admin invite code"
                    value={form.inviteCode}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
              {RECAPTCHA_KEY && (
                <div className="form-group mt-3">
                  <ReCAPTCHA
                    sitekey={RECAPTCHA_KEY}
                    onChange={setRecaptchaToken}
                  />
                </div>
              )}
              <div className="d-grid gap-2 mt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? <span className="spinner me-2"></span> : null}
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </form>
            <div className="text-center mt-4">
              <p>Already have an account? <Link to="/login" className="text-primary">Sign in here</Link></p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Email Verification Page
function VerifyEmailPage() {
  const [status, setStatus] = useState('Verifying your email...');
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const token = query.get('token');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('Verification token not found.');
        return;
      }
      try {
        await axios.get(`${API}/api/auth/verify-email?token=${token}`);
        setStatus('Email verified successfully! You can now log in.');
      } catch (err) {
        setStatus(err.response?.data?.msg || 'An error occurred during verification.');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <Card>
            <div className="text-center">
              <h2 className="mb-4">{status}</h2>
              <div className="d-grid gap-2">
                <Link to="/login">
                  <Button>Go to Login</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Home (Vote) Page
function HomePage() {
  const { user, refreshUser } = useAuth();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActiveElection = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/elections/active`);
        setElection(res.data);
        
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingABI, provider);
        const basic = await contract.getElectionBasic(res.data.onChainId);
        const count = Number(basic[6]);
        const promises = Array.from({ length: count }, (_, i) => 
          contract.getCandidate(res.data.onChainId, i + 1)
        );
        const results = await Promise.all(promises);
        
        setCandidates(results.map(c => ({
          id: c[0].toString(), 
          name: c[1], 
          party: c[2], 
          votes: Number(c[3]) 
        })));
      } catch (err) {
        setElection(null);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };
    loadActiveElection();
  }, []);

  const handleVote = async (candidate) => {
    const voteToast = toast.loading('Preparing your vote...');
    try {
      if (!user?.walletAddress) {
        return toast.error('Please link your wallet on the Profile page first.', { id: voteToast });
      }
      if (user.hasVotedOn?.[election.onChainId]) {
        return toast.error('You have already voted in this election.', { id: voteToast });
      }
      
      const { contract } = await getSignerContract();
      toast.loading('Please approve the transaction in your wallet...', { id: voteToast });
      const tx = await contract.vote(election.onChainId, candidate.id);
      
      toast.loading('Submitting your vote to the blockchain...', { id: voteToast });
      const receipt = await tx.wait();
      toast.loading('Vote is on-chain! Verifying with server...', { id: voteToast });
      
      await axios.post(`${API}/api/verify/vote`, 
        { 
          txHash: receipt.hash, 
          electionId: election.onChainId, 
          candidateId: candidate.id 
        }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      toast.success('Your vote has been successfully recorded!', { id: voteToast });
      await refreshUser();
    } catch (err) {
      const message = err.reason || err.response?.data?.msg || err.message || 'Voting failed.';
      toast.error(message, { id: voteToast });
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner mx-auto mb-3"></div>
          <h3>Loading Active Election...</h3>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="container py-5">
        <Card>
          <div className="text-center">
            <h3>No Active Election</h3>
            <p className="text-muted mt-2">There is no active election at this time. Please check back later.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="mb-5">
        <h1 className="mb-2">{election.title}</h1>
        <p className="text-muted fs-5">{election.description}</p>
        <div className="mt-4">
          <span className="election-status status-active">Active Election</span>
        </div>
      </div>

      {user.hasVotedOn?.[election.onChainId] && (
        <div className="alert alert-success mb-5">
          <h4 className="alert-heading">Thank you for voting!</h4>
          <p>Your vote has been securely recorded on the blockchain. Results will be available after the election ends.</p>
        </div>
      )}

      <h3 className="mb-4">Candidates</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map(c => (
          <Card key={c.id} className="candidate-card">
            <div className="card-body">
              <h4 className="mb-1">{c.name}</h4>
              <p className="text-muted mb-3">{c.party}</p>
              <div className="d-flex align-items-center">
                <span className="text-muted me-2">Votes:</span>
                <span className="fw-bold">{c.votes}</span>
              </div>
            </div>
            <div className="card-footer">
              <Button 
                onClick={() => handleVote(c)} 
                disabled={!!user.hasVotedOn?.[election.onChainId]}
                className="w-100"
              >
                Vote for {c.name}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Results Page
function ResultsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/elections/results`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner mx-auto mb-3"></div>
          <h3>Loading election results...</h3>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-5">
        <Card>
          <div className="text-center">
            <h3>No Results Available</h3>
            <p className="text-muted mt-2">Election results are not available at this time.</p>
          </div>
        </Card>
      </div>
    );
  }
  
  const sorted = [...(data.results || [])].sort((a,b) => b.votes - a.votes);
  const total = sorted.reduce((s,c) => s + c.votes, 0);
  
  const exportCSV = () => {
    const csv = Papa.unparse(sorted.map(r => ({
      Candidate: r.name, 
      Party: r.party, 
      Votes: r.votes 
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = 'election_results.csv'; 
    a.click();
  };
  
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(data.title, 14, 16);
    doc.autoTable({ 
      startY: 22, 
      head: [['Candidate', 'Party', 'Votes']], 
      body: sorted.map(r => [r.name, r.party, r.votes]) 
    });
    doc.save('election_results.pdf');
  };

  return (
    <div className="container py-5">
      <div className="mb-5">
        <h1 className="mb-2">Election Results</h1>
        <p className="text-muted fs-5">{data.title} - Final Results</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <Card header={<h3>Vote Summary</h3>}>
          <div className="text-center py-3">
            <p className="text-muted">Total Votes Cast</p>
            <p className="display-4 fw-bold text-primary">{total}</p>
          </div>
          <div className="d-flex gap-2 mt-4">
            <Button variant="outline" onClick={exportCSV} className="flex-grow">
              Export CSV
            </Button>
            <Button variant="outline" onClick={exportPDF} className="flex-grow">
              Export PDF
            </Button>
          </div>
        </Card>
        
        <Card header={<h3>Results Chart</h3>}>
          <div className="chart-container">
            <Bar 
              data={{
                labels: sorted.map(s => s.name), 
                datasets:[{
                  label:'Votes', 
                  data: sorted.map(s => s.votes), 
                  backgroundColor: '#4f46e5' 
                }] 
              }} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </div>
        </Card>
      </div>

      <Card header={<h3>Detailed Results</h3>}>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Party</th>
                <th>Votes</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((candidate, index) => {
                const percentage = total > 0 ? ((candidate.votes / total) * 100).toFixed(1) : 0;
                return (
                  <tr key={candidate.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="badge bg-primary me-2">{index + 1}</span>
                        {candidate.name}
                      </div>
                    </td>
                    <td>{candidate.party}</td>
                    <td>{candidate.votes}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="progress me-2 flex-grow" style={{ height: '10px' }}>
                          <div 
                            className="progress-bar bg-primary" 
                            role="progressbar" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span>{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// Profile Page
function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [linking, setLinking] = useState(false);

  const linkWallet = async () => {
    if (!user) return toast.error('Please log in first.');
    if (!window.ethereum) return toast.error('MetaMask is not installed.');
    setLinking(true);
    try {
      const token = localStorage.getItem('token');
      const { data: { message } } = await axios.post(`${API}/api/auth/challenge`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      toast('Please sign the message in MetaMask to link your wallet.', { icon: '✍️' });
      const signature = await signer.signMessage(message);
      await axios.post(`${API}/api/auth/verify-link`, { signature }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      toast.success('Wallet linked successfully!');
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.msg || err.message || 'Failed to link wallet.');
    } finally {
      setLinking(false);
    }
  };
  
  if (!user) return <Navigate to="/login" />;
  
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <Card header={<h2>My Profile</h2>}>
            <div className="mb-4">
              <h4>Account Information</h4>
              <div className="table-responsive">
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <td className="text-muted">Name:</td>
                      <td className="fw-semibold">{user.name}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Email:</td>
                      <td>
                        {user.email || '—'} 
                        {user.emailVerified ? 
                          <span className="badge bg-success ms-2">Verified</span> : 
                          <span className="badge bg-danger ms-2">Not Verified</span>
                        }
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Role:</td>
                      <td className="fw-semibold">{user.role}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Wallet:</td>
                      <td>
                        {user.walletAddress ? 
                          <span className="font-monospace text-break">{user.walletAddress}</span> : 
                          <span className="text-muted">Not linked</span>
                        }
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="d-grid gap-2">
              <Button 
                onClick={linkWallet} 
                disabled={linking}
              >
                {linking ? <span className="spinner me-2"></span> : null}
                {linking ? 'Connecting Wallet...' : 
                  (user.walletAddress ? 'Re-link Wallet' : 'Link Wallet with MetaMask')
                }
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Admin Page
function AdminPage() {
  const [elections, setElections] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    startAt: '', 
    endAt: '', 
    candidates: [{name: '', party: ''}] 
  });
  const [loading, setLoading] = useState(false);

  const loadElections = async () => {
    try {
      const res = await axios.get(`${API}/api/elections`);
      setElections(res.data);
    } catch (err) { 
      toast.error('Failed to load elections'); 
    }
  };

  useEffect(() => { 
    loadElections() 
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    const createToast = toast.loading("Creating election...");
    try {
      const token = localStorage.getItem('token');
      const payload = { 
        title: form.title, 
        description: form.description, 
        startAt: form.startAt || null, 
        endAt: form.endAt || null 
      };
      
      const res = await axios.post(`${API}/api/admin/elections`, payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      toast.success('Election created successfully!', { id: createToast });
      
      if (res.data.onChainId) {
        const candidatesToast = toast.loading("Adding candidates...");
        for (const c of form.candidates.filter(x => x.name.trim())) {
          await axios.post(
            `${API}/api/admin/elections/${res.data.onChainId}/candidates`, 
            { name: c.name, party: c.party }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
        toast.success('All candidates added successfully!', { id: candidatesToast });
      }
      
      setModalOpen(false);
      loadElections();
    } catch (err) { 
      toast.error(err.response?.data?.msg || 'Failed to create election.', { id: createToast }); 
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateChange = (index, field, value) => {
    const newCandidates = [...form.candidates];
    newCandidates[index][field] = value;
    setForm({...form, candidates: newCandidates});
  };

  const addCandidateField = () => 
    setForm({...form, candidates: [...form.candidates, {name: '', party: ''}]});
    
  const removeCandidateField = index => 
    setForm({...form, candidates: form.candidates.filter((_, i) => i !== index)});

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Admin Dashboard</h1>
        <Button onClick={() => setModalOpen(true)}>
          <i className="bi bi-plus-lg me-2"></i> Create Election
        </Button>
      </div>

      <Card>
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Election Title</th>
                <th>Status</th>
                <th>On-Chain ID</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {elections.map(e => (
                <tr key={e._id}>
                  <td>
                    <div className="fw-semibold">{e.title}</div>
                    <div className="text-muted small">{e.description}</div>
                  </td>
                  <td>
                    {e.closed ? 
                      <span className="election-status status-closed">Closed</span> : 
                      <span className="election-status status-active">Active</span>
                    }
                  </td>
                  <td>
                    {e.onChainId ? 
                      <span className="font-monospace">{e.onChainId}</span> : 
                      <span className="text-muted">Off-chain</span>
                    }
                  </td>
                  <td>{new Date(e.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Election</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Election Title</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={form.title} 
                    onChange={e => setForm({...form, title: e.target.value})} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-control" 
                    rows="3"
                    value={form.description} 
                    onChange={e => setForm({...form, description: e.target.value})} 
                    required
                  ></textarea>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Start Date (Optional)</label>
                      <input 
                        type="datetime-local" 
                        className="form-control" 
                        value={form.startAt} 
                        onChange={e => setForm({...form, startAt: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">End Date (Optional)</label>
                      <input 
                        type="datetime-local" 
                        className="form-control" 
                        value={form.endAt} 
                        onChange={e => setForm({...form, endAt: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Candidates</h5>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addCandidateField}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Add Candidate
                    </Button>
                  </div>
                  
                  {form.candidates.map((c, i) => (
                    <div key={i} className="row mb-3">
                      <div className="col-md-5">
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Candidate Name" 
                          value={c.name} 
                          onChange={e => handleCandidateChange(i, 'name', e.target.value)} 
                          required
                        />
                      </div>
                      <div className="col-md-5">
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Party / Affiliation" 
                          value={c.party} 
                          onChange={e => handleCandidateChange(i, 'party', e.target.value)} 
                        />
                      </div>
                      <div className="col-md-2">
                        <Button 
                          variant="danger" 
                          size="sm" 
                          className="w-100"
                          onClick={() => removeCandidateField(i)}
                          disabled={form.candidates.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <Button 
                  variant="outline" 
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={loading}
                >
                  {loading ? <span className="spinner me-2"></span> : null}
                  {loading ? 'Creating...' : 'Create Election'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Route Protection
function PrivateRoute() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="container py-5">
      <div className="text-center">
        <div className="spinner mx-auto mb-3"></div>
        <h3>Authenticating...</h3>
      </div>
    </div>
  );
  return user ? <MainLayout /> : <Navigate to="/login" />;
}

function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="container py-5">
      <div className="text-center">
        <div className="spinner mx-auto mb-3"></div>
        <h3>Authenticating...</h3>
      </div>
    </div>
  );
  return user && user.role === 'admin' ? <MainLayout /> : <Navigate to="/" />;
}

function PublicRoute({children}) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="container py-5">
      <div className="text-center">
        <div className="spinner mx-auto mb-3"></div>
        <h3>Loading...</h3>
      </div>
    </div>
  );
  return !user ? children : <Navigate to="/" />;
}

// App Root
export default function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" toastOptions={{ duration: 5000 }} />
      <Router>
        <Routes>
          {/* Public routes only accessible when logged out */}
          <Route path="/login" element={<PublicRoute><LoginPage/></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage/></PublicRoute>} />
          <Route path="/verify-email" element={<VerifyEmailPage/>} />
          
          {/* Private routes for all logged-in users */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          
          {/* Private routes for admins only */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          
          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}