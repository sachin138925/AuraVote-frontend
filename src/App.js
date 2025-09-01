// client/src/App.js
import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, Outlet } from 'react-router-dom';
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

// Pull values from the .env file
const API = process.env.REACT_APP_API_URL;
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '';
const RECAPTCHA_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
const RPC_URL = process.env.REACT_APP_RPC_URL_BSC_TESTNET;

const VotingABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "electionId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "candidateId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "party",
          "type": "string"
        }
      ],
      "name": "CandidateAdded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "electionId",
          "type": "uint256"
        }
      ],
      "name": "ElectionClosed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "electionId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "startAt",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "endAt",
          "type": "uint256"
        }
      ],
      "name": "ElectionCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "electionId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "candidateId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "voter",
          "type": "address"
        }
      ],
      "name": "Voted",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_electionId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_party",
          "type": "string"
        }
      ],
      "name": "addCandidate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_description",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_startAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_endAt",
          "type": "uint256"
        }
      ],
      "name": "createElection",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "elections",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "startAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "endAt",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "closed",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "nextCandidateId",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_electionId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_candidateId",
          "type": "uint256"
        }
      ],
      "name": "getCandidate",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_electionId",
          "type": "uint256"
        }
      ],
      "name": "getElectionBasic",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextElectionId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_electionId",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "_isClosed",
          "type": "bool"
        }
      ],
      "name": "toggleCloseElection",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_electionId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_candidateId",
          "type": "uint256"
        }
      ],
      "name": "vote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

// --- Theme context for dark/light mode ---
const ThemeContext = createContext();
const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// --- Auth context to manage user state globally ---
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

// --- Wallet helpers ---
const getProvider = () => new ethers.JsonRpcProvider(RPC_URL);
const getSignerContract = async () => {
  if (!window.ethereum) throw new Error('MetaMask is not installed.');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingABI, signer);
  return { contract, signer, provider };
};

// --- UI Components ---
const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  return <button {...props} className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}>{children}</button>;
};

const Card = ({ children, className = '', header, footer }) => (
  <div className={`card ${className}`}>
    {header && <div className="card-header">{header}</div>}
    <div className="card-body">{children}</div>
    {footer && <div className="card-footer">{footer}</div>}
  </div>
);

// --- Main Application Layout ---
function MainLayout() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </>
  );
}

// --- Navbar ---
function Navbar() {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [balance, setBalance] = useState('');

  useEffect(() => {
    const fetchBalance = async () => {
      if (user?.walletAddress && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const balanceWei = await provider.getBalance(user.walletAddress);
          const balanceEther = ethers.formatEther(balanceWei);
          setBalance(parseFloat(balanceEther).toFixed(4));
        } catch (err) {
          console.error("Failed to fetch balance:", err);
          setBalance('');
        }
      } else {
        setBalance('');
      }
    };
    fetchBalance();
  }, [user?.walletAddress]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">AuraVote</Link>
        <div className="navbar-nav">
          {user ? (
            <>
              {balance && <div className="wallet-balance">{balance} tBNB</div>}
              <Link to="/" className="nav-link">Vote</Link>
              <Link to="/results" className="nav-link">Results</Link>
              <Link to="/profile" className="nav-link">Profile</Link>
              {user.role === 'admin' && <Link to="/admin" className="nav-link text-primary font-semibold">Admin Panel</Link>}
              <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="primary" size="sm" onClick={() => navigate('/login')}>Login</Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/register')}>Register</Button>
            </>
          )}
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle dark mode">{darkMode ? '☀️' : '🌙'}</button>
        </div>
      </div>
    </nav>
  );
}

// --- Login & Register Pages (No changes needed) ---

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
    <div className="container">
      <div className="max-w-md mx-auto py-12">
        <Card header={<div className="text-center"><h2 className="card-title">Sign In</h2><p className="text-muted">Access your voting account</p></div>}>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} type="email" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading} className="w-full">{loading ? <span className="spinner"></span> : 'Sign In'}</Button>
            </div>
          </form>
          <div className="mt-6 text-center text-sm">Don't have an account? <Link to="/register" className="text-primary font-semibold ml-1">Register here</Link></div>
        </Card>
      </div>
    </div>
  );
}

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', inviteCode: '' });
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
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
    <div className="container">
      <div className="max-w-md mx-auto py-12">
        <Card header={<div className="text-center"><h2 className="card-title">Create an Account</h2><p className="text-muted">Join the voting platform</p></div>}>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input name="name" className="form-control" placeholder="John Doe" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input name="email" className="form-control" placeholder="your@email.com" type="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input name="password" className="form-control" placeholder="••••••••" type="password" value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center"><input type="radio" name="role" value="user" checked={form.role === 'user'} onChange={handleChange} className="mr-2" />Voter</label>
                <label className="flex items-center"><input type="radio" name="role" value="admin" checked={form.role === 'admin'} onChange={handleChange} className="mr-2" />Administrator</label>
              </div>
            </div>
            {form.role === 'admin' && (
              <div className="form-group">
                <label className="form-label">Admin Invite Code</label>
                <input name="inviteCode" className="form-control" placeholder="Enter invite code" value={form.inviteCode} onChange={handleChange} required />
              </div>
            )}
            {RECAPTCHA_KEY && <div className="flex justify-center pt-2"><ReCAPTCHA sitekey={RECAPTCHA_KEY} onChange={setRecaptchaToken} /></div>}
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading} className="w-full">{loading ? <span className="spinner"></span> : 'Create Account'}</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

// --- Home (Vote) Page ---
function HomePage() {
  const { user, refreshUser } = useAuth();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchElectionData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/elections/active`);
      setElection(res.data);
      const provider = getProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingABI, provider);
      const basic = await contract.getElectionBasic(res.data.onChainId);
      const count = Number(basic[6]);
      const promises = Array.from({ length: count }, (_, i) => contract.getCandidate(res.data.onChainId, i + 1));
      const results = await Promise.all(promises);
      setCandidates(results.map(c => ({ 
        id: c[0].toString(), 
        name: c[1], 
        party: c[2], 
        votes: Number(c[3]),
        estimatedGas: null 
      })));
    } catch (err) {
      setElection(null);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchElectionData();
  }, [fetchElectionData]);

  const estimateVoteGas = async (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate || candidate.estimatedGas) return;

    try {
      const { contract, provider } = await getSignerContract();
      const gasLimit = await contract.vote.estimateGas(election.onChainId, candidateId);
      const feeData = await provider.getFeeData();
      const estimatedFee = gasLimit * (feeData.gasPrice || 0n);
      const feeInEther = ethers.formatEther(estimatedFee);
      
      setCandidates(prev => prev.map(c => 
        c.id === candidateId ? { ...c, estimatedGas: `~${parseFloat(feeInEther).toPrecision(2)} tBNB` } : c
      ));
    } catch (error) {
      console.error("Gas estimation failed:", error);
       setCandidates(prev => prev.map(c => 
        c.id === candidateId ? { ...c, estimatedGas: 'N/A' } : c
      ));
    }
  };

  const handleVote = async (candidate) => {
    const voteToast = toast.loading('Preparing your vote...');
    try {
      if (!user?.walletAddress) return toast.error('Please link your wallet on the Profile page first.', { id: voteToast });
      if (user.hasVotedOn?.[election.onChainId]) return toast.error('You have already voted in this election.', { id: voteToast });
      
      const { contract } = await getSignerContract();
      toast.loading('Please approve the transaction in your wallet...', { id: voteToast });
      const tx = await contract.vote(election.onChainId, candidate.id);
      
      toast.loading('Submitting your vote to the blockchain...', { id: voteToast });
      const receipt = await tx.wait();
      
      toast.loading('Vote is on-chain! Verifying with server...', { id: voteToast });
      await axios.post(`${API}/api/verify/vote`, 
        { txHash: receipt.hash, electionId: election.onChainId, candidateId: candidate.id }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      toast.success('Your vote has been successfully recorded!', { id: voteToast });
      await refreshUser();
      await fetchElectionData();
    } catch (err) {
      const message = err.reason || err.response?.data?.msg || err.message || 'Voting failed.';
      toast.error(message, { id: voteToast });
    }
  };

  if (loading) return <div className="container py-20 text-center"><div className="spinner mx-auto"></div><p className="mt-4 text-lg">Loading Active Election...</p></div>;
  if (!election) return <div className="container py-20 text-center"><h2 className="text-2xl font-bold">No Active Election</h2><p className="mt-2 text-muted">Please check back later.</p></div>;

  return (
    <div className="container">
      <div className="mb-8"><h1 className="page-title">{election.title}</h1><p className="page-description">{election.description}</p></div>
      {user.hasVotedOn?.[election.onChainId] && (<div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded"><h3 className="font-bold">Thank you for voting!</h3><p className="text-sm">Your vote has been securely recorded.</p></div>)}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map(c => (
          <Card key={c.id} className="candidate-card" onMouseEnter={() => estimateVoteGas(c.id)}>
            <div className="card-body">
              <h3 className="text-2xl font-semibold mb-2">{c.name}</h3>
              <p className="text-muted mb-4">{c.party}</p>
              <div className="flex items-center text-sm text-muted">Votes: {c.votes}</div>
            </div>
            <div className="card-footer">
              <div className="flex justify-between items-center">
                <Button onClick={() => handleVote(c)} disabled={!!user.hasVotedOn?.[election.onChainId]} className="flex-grow mr-4">Vote for {c.name}</Button>
                {c.estimatedGas && <span className="gas-estimate">Fee: {c.estimatedGas}</span>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- Results Page (No changes needed) ---
function ResultsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/elections/results`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container py-20 text-center"><div className="spinner mx-auto"></div><p className="mt-4">Loading results...</p></div>;
  if (!data) return <div className="container py-20 text-center"><h2 className="text-2xl font-bold">No Results Available</h2><p className="mt-2 text-muted">No election results are available yet.</p></div>;

  const sorted = [...(data.results || [])].sort((a,b) => b.votes - a.votes);
  const total = sorted.reduce((s,c) => s + c.votes, 0);

  const exportCSV = () => {
    const csv = Papa.unparse(sorted.map(r => ({ Candidate: r.name, Party: r.party, Votes: r.votes })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'election_results.csv'; a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(data.title, 14, 16);
    doc.autoTable({ startY: 22, head: [['Candidate', 'Party', 'Votes']], body: sorted.map(r => [r.name, r.party, r.votes]) });
    doc.save('election_results.pdf');
  };

  return (
    <div className="container">
      <div className="mb-8"><h2 className="text-3xl font-bold mb-2">{data.title} - Final Results</h2><p className="text-muted">Election results are now available</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="card-body">
            <h3 className="card-title mb-4">Vote Summary</h3>
            <div className="results-summary"><div className="vote-count">{total}</div><div className="vote-label">Total Votes Cast</div></div>
            <div className="mt-6 flex gap-3">
              <Button onClick={exportCSV} className="flex-1">Export CSV</Button>
              <Button onClick={exportPDF} className="flex-1">Export PDF</Button>
            </div>
          </div>
        </Card>
        <Card>
          <div className="card-body">
            <h3 className="card-title mb-4">Vote Distribution</h3>
            <div className="chart-container">
              <Bar data={{labels: sorted.map(s => s.name), datasets:[{label:'Votes', data: sorted.map(s => s.votes), backgroundColor: '#4f46e5' }] }} options={{responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }}, scales: { y: { beginAtZero: true, ticks: { precision: 0 }}}}}/>
            </div>
          </div>
        </Card>
      </div>
      <Card className="mt-6">
        <div className="card-body">
          <h3 className="card-title mb-4">Detailed Results</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{sorted.map((candidate, index) => (<tr key={index}><td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{candidate.name}</div></td><td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{candidate.party}</div></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.votes}</td><td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{total > 0 ? ((candidate.votes / total) * 100).toFixed(1) : '0'}%</div></td></tr>))}</tbody></table>
          </div>
        </div>
      </Card>
    </div>
  );
}


// --- Profile Page ---
function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [linking, setLinking] = useState(false);

  const linkWallet = async () => {
    if (!user) return toast.error('Please log in first.');
    if (!window.ethereum) return toast.error('MetaMask is not installed.');
    setLinking(true);
    try {
      const token = localStorage.getItem('token');
      const { data: { message } } = await axios.post(`${API}/api/auth/challenge`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      toast('Please sign the message in MetaMask to link your wallet.', { icon: '✍️' });
      const signature = await signer.signMessage(message);
      await axios.post(`${API}/api/auth/verify-link`, { signature }, { headers: { Authorization: `Bearer ${token}` } });
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
    <div className="container"><div className="max-w-3xl mx-auto py-8"><Card header={<h2 className="card-title">My Profile</h2>}>
      <div className="profile-info">
        <div className="profile-label">Name</div><div className="profile-value">{user.name}</div>
        <div className="profile-label">Email</div><div className="profile-value">{user.email || '—'}</div>
        <div className="profile-label">Role</div><div className="profile-value capitalize">{user.role}</div>
        <div className="profile-label">Wallet Address</div><div className="profile-value font-mono text-sm">{user.walletAddress || 'Not linked'}</div>
      </div>
      <div className="mt-8">
        <Button onClick={linkWallet} disabled={linking} className="w-full md:w-auto">
          {linking ? <span className="spinner"></span> : user.walletAddress ? 'Re-link Wallet' : 'Link Wallet with MetaMask'}
        </Button>
      </div>
    </Card></div></div>
  );
}


// --- NEW COMPONENT: Election Details Modal ---
function ElectionDetailsModal({ election, onClose }) {
  if (!election) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Election Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="details-grid">
            <div className="details-label">Title</div>
            <div className="details-value">{election.title}</div>
            
            <div className="details-label">On-Chain ID</div>
            <div className="details-value">{election.onChainId}</div>
            
            <div className="details-label">Status</div>
            <div className="details-value">{election.closed ? 'Closed' : 'Open'}</div>

            <div className="details-label">Start Date</div>
            <div className="details-value">{election.startAt ? new Date(election.startAt).toLocaleString() : 'Not set'}</div>

            <div className="details-label">End Date</div>
            <div className="details-value">{election.endAt ? new Date(election.endAt).toLocaleString() : 'Not set'}</div>
          </div>

          <h4 className="font-semibold mt-6 mb-3">Candidates</h4>
          {election.candidates?.length > 0 ? (
            <ul className="details-candidate-list">
              {election.candidates.map(c => (
                <li key={c.onChainId}>
                  <span>{c.name} ({c.party})</span>
                  <span>{c.votes} Votes</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No candidates have been added to this election yet.</p>
          )}
        </div>
        <div className="modal-footer">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}

// --- Admin Page ---
function AdminPage() {
  const [elections, setElections] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startAt: '', endAt: '', candidates: [{name: '', party: ''}] });
  const [loading, setLoading] = useState(false);
  const [viewingElection, setViewingElection] = useState(null);

  const loadElections = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/elections`);
      setElections(res.data);
    } catch { toast.error('Failed to load elections'); }
  }, []);

  useEffect(() => { loadElections(); }, [loadElections]);

  const handleCreate = async () => {
    setLoading(true);
    const createToast = toast.loading("Creating election...");
    try {
      const token = localStorage.getItem('token');
      const payload = { title: form.title, description: form.description, startAt: form.startAt || null, endAt: form.endAt || null };
      const res = await axios.post(`${API}/api/admin/elections`, payload, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success(
        (t) => (
          <span>
            Election created successfully!
            <a 
              href={`https://testnet.bscscan.com/tx/${res.data.txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="toast-link"
            >
              View Tx
            </a>
          </span>
        ), { id: createToast, duration: 10000 }
      );

      if (res.data.onChainId) {
        const candidatesToast = toast.loading("Adding candidates...");
        for (const c of form.candidates.filter(x => x.name.trim())) {
          await axios.post(`${API}/api/admin/elections/${res.data.onChainId}/candidates`, { name: c.name, party: c.party }, { headers: { Authorization: `Bearer ${token}` } });
        }
        toast.success('All candidates added successfully!', { id: candidatesToast });
      }
      setForm({ title: '', description: '', startAt: '', endAt: '', candidates: [{name: '', party: ''}] });
      setModalOpen(false);
      loadElections();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to create election.', { id: createToast });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseElection = async (onChainId) => {
    if (!window.confirm("Are you sure you want to close this election? This action is irreversible.")) return;
    
    const toastId = toast.loading("Closing election on the blockchain...");
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/admin/elections/${onChainId}/close`, {}, { headers: { Authorization: `Bearer ${token}` }});
      toast.success("Election closed successfully!", { id: toastId });
      loadElections();
    } catch(err) {
      toast.error(err.response?.data?.msg || 'Failed to close election.', { id: toastId });
    }
  };

  const handleCandidateChange = (index, field, value) => {
    const newCandidates = [...form.candidates];
    newCandidates[index][field] = value;
    setForm({...form, candidates: newCandidates});
  };

  const addCandidateField = () => setForm({...form, candidates: [...form.candidates, {name: '', party: ''}]});
  const removeCandidateField = index => setForm({...form, candidates: form.candidates.filter((_, i) => i !== index)});

  // Helper to format dates or return a placeholder
  const formatDate = (dateString) => {
    if (!dateString) return <span className="text-muted">Not Set</span>;
    return new Date(dateString).toLocaleString();
  }

  // Helper to determine election status
  const getStatus = (election) => {
    const now = new Date();
    if (election.closed) return <span className="election-status status-closed">Closed</span>;
    const start = election.startAt ? new Date(election.startAt) : null;
    const end = election.endAt ? new Date(election.endAt) : null;
    
    if (start && now < start) return <span className="election-status status-scheduled">Scheduled</span>;
    if (end && now > end) return <span className="election-status status-finished">Finished</span>;
    return <span className="election-status status-open">Active</span>;
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-8">
        <h1 className="page-title">Admin Dashboard</h1>
        <Button onClick={() => setModalOpen(true)}>Create Election</Button>
      </div>
      <Card>
        <div className="card-body">
          <h3 className="card-title mb-4">Election History</h3>
          {elections.length === 0 ? (
            <p className="text-muted">No elections found. Create your first one to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>On-Chain ID</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {elections.map(e => (
                    <tr key={e._id}>
                      <td className="election-title-clickable" onClick={() => setViewingElection(e)}>
                        {e.title}
                      </td>
                      <td>{e.onChainId}</td>
                      <td>{formatDate(e.startAt)}</td>
                      <td>{formatDate(e.endAt)}</td>
                      <td>{getStatus(e)}</td>
                      <td className="actions-cell">
                        <a href={`https://testnet.bscscan.com/address/${CONTRACT_ADDRESS}#readContract`} target="_blank" rel="noopener noreferrer" className="bscscan-link" title="View on BscScan">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </a>
                        {!e.closed && (!e.endAt || new Date(e.endAt) > new Date()) && (
                          <Button size="sm" variant="danger" onClick={() => handleCloseElection(e.onChainId)}>Close</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
      
      {viewingElection && <ElectionDetailsModal election={viewingElection} onClose={() => setViewingElection(null)} />}

      {modalOpen && <div className="modal-overlay"><div className="modal-content">
        <div className="modal-header"><h3 className="modal-title">Create New Election</h3><button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Election Title</label><input className="form-control" placeholder="Enter election title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" placeholder="Enter election description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="form-group"><label className="form-label">Start Date (Optional)</label><input type="datetime-local" value={form.startAt} onChange={e => setForm({...form, startAt: e.target.value})} className="form-control" /></div><div className="form-group"><label className="form-label">End Date (Optional)</label><input type="datetime-local" value={form.endAt} onChange={e => setForm({...form, endAt: e.target.value})} className="form-control" /></div></div>
          <div className="mt-6"><h4 className="font-semibold mb-3">Candidates</h4>{form.candidates.map((c, i) => (<div key={i} className="flex gap-3 mb-3 items-center"><input className="form-control flex-1" placeholder="Candidate Name" value={c.name} onChange={e => handleCandidateChange(i, 'name', e.target.value)} /><input className="form-control w-32" placeholder="Party" value={c.party} onChange={e => handleCandidateChange(i, 'party', e.target.value)} /><button onClick={() => removeCandidateField(i)} className="p-2 text-red-500 hover:text-red-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div>))}<Button variant="outline" onClick={addCandidateField} className="mt-2">Add Candidate</Button></div>
        </div>
        <div className="modal-footer"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={loading}>{loading ? <span className="spinner"></span> : 'Create Election'}</Button></div>
      </div></div>}
    </div>
  );
}

// --- Route Protection ---
const LoadingScreen = () => <div className="container py-20 text-center"><div className="spinner mx-auto"></div><p className="mt-4">Loading...</p></div>;

function PrivateRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <MainLayout /> : <Navigate to="/login" />;
}

function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user && user.role === 'admin' ? <MainLayout /> : <Navigate to="/" />;
}

function PublicRoute({children}) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return !user ? children : <Navigate to="/" />;
}

// --- App Root ---
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="bottom-right" toastOptions={{ duration: 10000, style: { background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)'}}} />
        <Router>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage/></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage/></PublicRoute>} />
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}