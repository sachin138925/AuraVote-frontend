// client/src/App.js
import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
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
  const logout = useCallback(async () => { localStorage.removeItem('token'); setUser(null); setToken(null); }, []);
  useEffect(() => {
    const loadUser = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await axios.get(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        setUser(res.data);
      } catch { toast.error("Your session has expired. Please log in again."); logout(); } 
      finally { setLoading(false); }
    };
    loadUser();
  }, [token, logout]);
  const login = async (email, password) => { const res = await axios.post(`${API}/api/auth/login`, { email, password }); localStorage.setItem('token', res.data.token); setToken(res.data.token); setUser(res.data.user); };
  const register = async (payload) => axios.post(`${API}/api/auth/register`, payload);
  const refreshUser = async () => { const tok = localStorage.getItem('token'); if (!tok) return; try { const res = await axios.get(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${tok}` } }); setUser(res.data); } catch { logout(); } };
  return ( <AuthContext.Provider value={{ user, setUser, token, login, register, logout, refreshUser, loading }}>{children}</AuthContext.Provider> );
}

// --- Wallet Helpers ---
const getProvider = () => new ethers.JsonRpcProvider(RPC_URL);
const getSignerContract = async () => { if (!window.ethereum) throw new Error('MetaMask is not installed.'); const provider = new ethers.BrowserProvider(window.ethereum); const signer = await provider.getSigner(); return { contract: new ethers.Contract(CONTRACT_ADDRESS, VotingABI, signer), signer, provider }; };

// --- Layouts and Global Components ---
function MainLayout() { return (<><Navbar /><main className="main-content"><Outlet /></main></>); }

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const handleLogout = () => { logout(); toast.success('Logged out successfully'); navigate('/login'); };
    // UPDATED: More precise check for active link to stop Vote from always glowing
    const getNavLinkClass = (path) => {
        if (path === '/') { return location.pathname === '/' ? 'nav-link active' : 'nav-link'; }
        return location.pathname.startsWith(path) ? 'nav-link active' : 'nav-link';
    };
    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'D';
    return ( <nav className="navbar"><div className="container navbar-container"><Link to="/" className="navbar-brand">AuraVote</Link>{user && (<><div className="navbar-links"><Link to="/" className={getNavLinkClass('/')}>Vote</Link><Link to="/results" className={getNavLinkClass('/results')}>Results</Link><Link to="/profile" className={getNavLinkClass('/profile')}>Profile</Link>{user?.role === 'admin' && <Link to="/admin" className={getNavLinkClass('/admin')}>Admin</Link>}</div><div className="navbar-actions"><div className="profile-menu-container"><button className="profile-avatar" onClick={() => setDropdownOpen(!dropdownOpen)}>{userInitial}</button>{dropdownOpen && (<div className="profile-dropdown"><div className="dropdown-header"><span className="font-semibold">{user.name}</span><span className="text-sm text-muted">{user.email}</span></div><Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>Profile</Link>{user.role === 'admin' && <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>Admin Dashboard</Link>}<button className="dropdown-item" onClick={handleLogout}>Log out</button></div>)}</div></div></>)}</div></nav> );
}
  
const InfoBox = ({ children, title, text, icon }) => ( <div className="info-box">{icon && <div className="info-box-icon">{icon}</div>}<div className="info-box-content">{title && <h3 className="info-box-title">{title}</h3>}{text && <p className="info-box-text">{text}</p>}{children}</div></div>);

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
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-header"><h1 className="auth-title">Welcome Back</h1><p className="auth-subtitle">Sign in to your AuraVote account to continue voting</p></div>
      <form onSubmit={handleLogin} className="auth-form">
        <div className="form-group"><label className="form-label">Email Address</label><input className="form-control" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} type="email" required /></div>
        <div className="form-group"><label className="form-label">Password</label><input className="form-control" placeholder="Enter your password" type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading ? <span className="spinner"></span> : <>Sign In <span className="arrow">→</span></>}</button>
      </form>
      <p className="auth-link">Don't have an account? <Link to="/register">Create one here</Link></p>
      <InfoBox title="New to blockchain voting?" text="Create an account to participate in secure, transparent elections powered by smart contracts." />
    </div>
  );
}
function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'voter', inviteCode: '' });
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
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-header"><h1 className="auth-title">Create Account</h1><p className="auth-subtitle">Set up your AuraVote account to participate in secure elections</p></div>
      <form onSubmit={handleRegister} className="auth-form">
        <div className="form-group"><label className="form-label">Full Name</label><input name="name" className="form-control" placeholder="Enter your full name" value={form.name} onChange={handleChange} required /></div>
        <div className="form-group"><label className="form-label">Email Address</label><input name="email" className="form-control" placeholder="you@example.com" type="email" value={form.email} onChange={handleChange} required /></div>
        <div className="form-group"><label className="form-label">Password</label><input name="password" className="form-control" placeholder="Create a strong password" type="password" value={form.password} onChange={handleChange} required /></div>
        <div className="form-group"><label className="form-label">Confirm Password</label><input name="confirmPassword" className="form-control" placeholder="Confirm your password" type="password" value={form.confirmPassword} onChange={handleChange} required /></div>
        <div className="form-group">
          <label className="form-label">Account Type</label>
          <div className="account-type-group">
            <label className={`account-type-label ${form.role === 'voter' ? 'selected' : ''}`}><input type="radio" name="role" value="voter" checked={form.role === 'voter'} onChange={handleChange} className="account-type-radio" />Voter</label>
            <label className={`account-type-label ${form.role === 'admin' ? 'selected' : ''}`}><input type="radio" name="role" value="admin" checked={form.role === 'admin'} onChange={handleChange} className="account-type-radio" />Admin</label>
          </div>
        </div>
        {form.role === 'admin' && <div className="form-group"><label className="form-label">Admin Invite Code</label><input name="inviteCode" className="form-control" placeholder="Enter invite code" value={form.inviteCode} onChange={handleChange} required /></div>}
        {RECAPTCHA_KEY && <div className="flex justify-center"><ReCAPTCHA sitekey={RECAPTCHA_KEY} onChange={setRecaptchaToken} /></div>}
        <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading ? <span className="spinner"></span> : <>Create Account <span className="arrow">→</span></>}</button>
      </form>
      <p className="auth-link">Already have an account? <Link to="/login">Sign in here</Link></p>
      <InfoBox title="Secure & Transparent" text="Your votes are secured by blockchain technology and your privacy is protected with cryptographic signatures." />
    </div>
  );
}

// --- Main App Pages ---
function HomePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingFor, setVotingFor] = useState(null); // Tracks which candidate vote is in progress

  const fetchElectionData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/elections/active`);
      const activeElection = res.data;
      setElection(activeElection);
      const provider = getProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingABI, provider);
      const onChainData = await contract.getElectionBasic(activeElection.onChainId);
      const count = Number(onChainData[6]);
      if (count === 0) {
        setCandidates([]);
        return;
      }
      const promises = Array.from({ length: count }, (_, i) => contract.getCandidate(activeElection.onChainId, i + 1));
      const results = await Promise.all(promises);
      const formatted = results.map(c => ({ id: c[0].toString(), name: c[1], party: c[2], votes: Number(c[3]) }));
      setCandidates(formatted.sort((a, b) => b.votes - a.votes));
    } catch (err) {
      setElection(null);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchElectionData();
    }
  }, [user, fetchElectionData]);

  const handleVote = async (candidate) => {
    setVotingFor(candidate.id); // Set loading state for this specific button
    const voteToast = toast.loading(`Casting vote for ${candidate.name}...`);
    try {
      if (!user?.walletAddress) throw new Error('Please connect your wallet first.');
      if (user.hasVotedOn?.[election.onChainId]) throw new Error('You have already voted in this election.');
      const { contract } = await getSignerContract();
      toast.loading('Please approve the transaction in your wallet...', { id: voteToast });
      const tx = await contract.vote(election.onChainId, candidate.id);
      toast.loading('Submitting your vote to the blockchain...', { id: voteToast });
      const receipt = await tx.wait();
      if (!receipt.hash) throw new Error("Transaction failed after submission.");
      toast.loading('Vote is on-chain! Verifying with server...', { id: voteToast });
      await axios.post(`${API}/api/verify/vote`,
        { txHash: receipt.hash, electionId: election.onChainId, candidateId: candidate.id },
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
      setVotingFor(null); // Clear loading state for the button
    }
  };

  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
  const hasVoted = user && election && user.hasVotedOn?.[election.onChainId];

  const ConnectWalletPrompt = () => (
    <>
      <div className="banner warning">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
        Wallet Required: Please connect your MetaMask wallet to participate in voting.
      </div>
      <div className="connect-wallet-card">
        <h2>Connect Wallet</h2>
        <p>Link your MetaMask wallet to participate in voting</p>
        <button className="btn btn-primary" onClick={() => navigate('/profile/wallet')}>
          Connect MetaMask
        </button>
      </div>
    </>
  );

  const renderContent = () => {
    if (loading) return <div className="container text-center"><div className="spinner-lg"></div></div>;
    if (!user?.walletAddress) return <ConnectWalletPrompt />;
    if (!election) return <div className="text-center"><h2>No Active Election</h2><p>There are no elections available for voting at this time.</p></div>;

    return (
      <>
        {hasVoted && (
          <div className="banner success">
            You have successfully voted in this election. Thank you for your participation!
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate, index) => {
            const percentage = totalVotes > 0 ? (candidate.votes / totalVotes * 100) : 0;
            const isVoting = votingFor === candidate.id;
            return (
              <div key={candidate.id} className={`candidate-card-vote ${index === 0 ? 'leading' : ''}`}>
                <div className="candidate-header">
                  <div className="candidate-rank">#{index + 1}</div>
                  {index === 0 && <div className="candidate-leading-tag">Leading</div>}
                </div>
                <h3 className="candidate-name">{candidate.name}</h3>
                <p className="candidate-party">{candidate.party}</p>
                <div className="candidate-progress-bar"><div style={{ width: `${percentage}%` }}></div></div>
                <div className="candidate-stats">
                  <span>{percentage.toFixed(1)}% of total</span>
                  <span>{candidate.votes} / {totalVotes} Votes</span>
                </div>
                
                <div className="vote-button-container">
                  <button
                    className="btn btn-primary w-full"
                    onClick={() => handleVote(candidate)}
                    disabled={hasVoted || isVoting}
                  >
                    {isVoting ? <span className="spinner"></span> : (hasVoted ? "You Have Voted" : "Vote")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="container">
      {renderContent()}
      <div className="quick-actions-container">
        <h2 className="quick-actions-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          <Link to="/results" className="quick-action-card">View Live Results</Link>
          <Link to="/profile" className="quick-action-card">Manage Profile</Link>
          <a href={`https://testnet.bscscan.com/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="quick-action-card">View on Blockchain</a>
        </div>
      </div>
    </div>
  );
}

// UPDATED ResultsPage component
function ResultsPage() {
    const [data, setData] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedElectionId, setSelectedElectionId] = useState('current');

    // NEW: useLocation hook to potentially select an election from URL query
    const location = useLocation();
    
    const fetchResults = useCallback(async (electionId) => {
        setLoading(true);
        const url = (electionId === 'current' || !electionId) ? `${API}/api/elections/results` : `${API}/api/elections/results?id=${electionId}`;
        try {
            const res = await axios.get(url);
            setData(res.data);
        } catch { setData(null); } 
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        axios.get(`${API}/api/elections/history`).then(res => setHistory(res.data)).catch(() => {});
        
        // Check if an ID is passed in the URL (e.g., from voting history page)
        const queryParams = new URLSearchParams(location.search);
        const specificId = queryParams.get('id');
        if (specificId) {
            setSelectedElectionId(specificId);
            fetchResults(specificId);
        } else {
            fetchResults('current');
        }
    }, [location.search, fetchResults]);

    const handleSelectionChange = (e) => {
        const newId = e.target.value;
        setSelectedElectionId(newId);
        fetchResults(newId);
    };

    const handleRefresh = () => fetchResults(selectedElectionId);
    
    const exportCSV = () => {
                const csvData = Papa.unparse(sortedCandidates.map(r => ({ Candidate: r.name, Party: r.party, Votes: r.votes })));
                const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', `${data.title.replace(/\s+/g, '_')}_results.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        const exportPDF = () => {
                const doc = new jsPDF();
                doc.text(data.title, 14, 16);
                doc.autoTable({ startY: 22, head: [['Rank', 'Candidate', 'Party', 'Votes']], body: sortedCandidates.map((r, i) => [i+1, r.name, r.party, r.votes]) });
                doc.save(`${data.title.replace(/\s+/g, '_')}_results.pdf`);
            };

    if (loading) return <div className="container text-center"><div className="spinner-lg"></div></div>;
    
    if (!data) return ( <div className="container text-center"><h2>No Results Available</h2><p>There are no finished or active elections to display results for.</p></div> );
    
    const sortedCandidates = [...(data.results || [])].sort((a, b) => b.votes - a.votes);
    const totalVotes = sortedCandidates.reduce((sum, c) => sum + c.votes, 0);
    const leadingCandidate = sortedCandidates[0];
    const leadingMargin = leadingCandidate && sortedCandidates[1] ? ((leadingCandidate.votes - sortedCandidates[1].votes) / totalVotes * 100) : (totalVotes > 0 ? 100 : 0);

    return (
        <div className="container">
            <div className="results-header">
                {/* FIX: Title now has its own container to prevent layout shifts */}
                <div className="results-title-container">
                    <h1>{data.title}</h1>
                    <div className={`status-tag ${data.status === 'Live' ? 'active' : 'closed'}`}>{data.status}</div>
                </div>
                <div className="results-header-actions">
                    <select className="results-dropdown" value={selectedElectionId} onChange={handleSelectionChange}>
                        <option value="current">View Current / Last Finished</option>
                        <optgroup label="Past Elections">
                          {history.map(h => <option key={h.onChainId} value={h.onChainId}>{h.title}</option>)}
                        </optgroup>
                    </select>
                    <button onClick={handleRefresh} className="btn btn-secondary">Refresh</button>
                </div>
            </div>
            <div className="results-summary-grid">
                            <div className="summary-card"><div className="summary-card-value">{totalVotes}</div><div className="summary-card-label">Total Votes</div></div><div className="summary-card"><div className="summary-card-value">{sortedCandidates.length}</div><div className="summary-card-label">Candidates</div></div><div className="summary-card"><div className="summary-card-value">{leadingMargin.toFixed(1)}%</div><div className="summary-card-label">Leading Margin</div></div><div className="summary-card"><div className={`summary-card-value ${data.status === 'Live' ? 'live' : ''}`}>{data.status}</div><div className="summary-card-label">Status</div></div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-3 card"><h3 className="card-title">Vote Distribution</h3><div style={{ height: '300px' }}><Bar data={{ labels: sortedCandidates.map(s => s.name), datasets:[{ data: sortedCandidates.map(s => s.votes), backgroundColor: ['#8B5CF6', '#3B82F6', '#10B981'], borderRadius: 4 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } } }}/></div></div>
                            <div className="lg:col-span-2 card">
                                <h3 className="card-title">Export Results</h3>
                                <div className="export-buttons">
                                    <button onClick={exportCSV} className="btn btn-secondary w-full">Export as CSV</button>
                                    <button onClick={exportPDF} className="btn btn-secondary w-full">Export as PDF</button>
                                    <a href={`https://testnet.bscscan.com/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full">View on Blockchain</a>
                                </div>
                            </div>
                        </div>
                        <div className="card mt-6"><h3 className="card-title">Detailed Results</h3><table className="results-table"><thead><tr><th>Rank</th><th>Candidate</th><th>Party</th><th>Votes</th><th>Percentage</th><th>Progress</th></tr></thead><tbody>{sortedCandidates.map((c, index) => { const percentage = totalVotes > 0 ? (c.votes / totalVotes * 100) : 0; return (<tr key={c.onChainId}><td><div className="rank-badge">#{index + 1}</div></td><td>{c.name}</td><td>{c.party}</td><td>{c.votes}</td><td>{percentage.toFixed(2)}%</td><td><div className="table-progress-bar-container"><div className="table-progress-bar" style={{ width: `${percentage}%` }}></div></div></td></tr>)})}</tbody></table></div>
                    </div>
    )
}


// UPDATED Profile Components
function ProfilePage() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" />;
  const activeTab = location.pathname.split('/')[2] || 'overview';
  const getTabClass = (tabName) => `profile-tab-link ${activeTab === tabName ? 'active' : ''}`;
  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'D';

  return (
    <div className="container">
      <div className="profile-header"><div className="profile-header-avatar">{userInitial}</div><div className="profile-header-info"><h2>{user.name}</h2><div className="role-tag">{user.role}</div></div></div>
      <div className="profile-tabs"><Link to="/profile" className={getTabClass('overview')}>Overview</Link><Link to="/profile/wallet" className={getTabClass('wallet')}>Wallet</Link><Link to="/profile/history" className={getTabClass('history')}>Voting History</Link><Link to="/profile/settings" className={getTabClass('settings')}>Settings</Link></div>
      <div className="profile-content"><Outlet /></div>
    </div>
  );
}

function ProfileOverview() {
    const { user } = useAuth();
    return (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="card"><h3 className="card-title">Account Information</h3><div className="profile-info-grid"><span>Full Name</span><strong>{user.name}</strong><span>Email</span><strong>{user.email}</strong><span>Role</span><strong>{user.role}</strong><span>Member Since</span><strong>Recently</strong></div></div><div><div className="card"><h3 className="card-title">Voting Statistics</h3><div className="profile-info-grid"><span>Elections Participated</span><strong>{user.hasVotedOn ? Object.keys(user.hasVotedOn).length : 0}</strong><span>Wallet Status</span>{user.walletAddress ? <strong className="text-green">Connected</strong> : <strong className="text-red">Not Connected</strong>}</div></div><div className="card mt-6"><h3 className="card-title">Quick Actions</h3><div className="quick-actions-list"><Link to="/">Vote in Elections</Link><Link to="/results">View Results</Link>{user.role === 'admin' && <Link to="/admin">Admin Dashboard</Link>}</div></div></div></div>);
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
        } catch (err) { console.error("Failed to fetch balance:", err); setBalance('N/A'); }
      } else { setBalance(null); }
    };
    fetchBalance();
  }, [user?.walletAddress]);

  const linkWallet = async () => {
    if (!window.ethereum) { return toast.error('MetaMask is not installed.'); }
    setLinking(true);
    const toastId = toast.loading('Initializing wallet connection...');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication error.');
      const { data: { message } } = await axios.post(`${API}/api/auth/challenge`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      toast.loading('Please sign the message in MetaMask...', { id: toastId, icon: '✍️' });
      const signature = await signer.signMessage(message);
      await axios.post(`${API}/api/auth/verify-link`, { signature }, { headers: { Authorization: `Bearer ${token}` } });
      await refreshUser();
      toast.success('Wallet linked successfully!', { id: toastId });
    } catch (err) {
      let errorMessage = err.reason || err.response?.data?.msg || err.message || 'An unexpected error occurred.';
      if (err.code === 4001) errorMessage = 'You rejected the request in your wallet.';
      toast.error(errorMessage, { id: toastId });
    } finally { setLinking(false); }
  };

  const disconnectWallet = async () => {
    if (!window.confirm("Are you sure?")) return;
    const toastId = toast.loading("Disconnecting wallet...");
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/auth/disconnect-wallet`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await refreshUser();
      toast.success("Wallet disconnected.", { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to disconnect.", { id: toastId });
    }
  };

  return (
    <div className="card max-w-lg mx-auto">
      <h3 className="card-title">{user.walletAddress ? "Wallet Connected" : "Connect Wallet"}</h3>
      <p className="text-muted">{user.walletAddress ? "Your wallet is linked and ready for voting." : "Link your MetaMask wallet to participate in voting."}</p>
      {user.walletAddress ? (
        <div className="wallet-info-card">
          <div className="wallet-balance"><span>Balance</span><strong>{balance === null ? 'Loading...' : `${balance} tBNB`}</strong></div>
          <div className="wallet-address"><span>Your Address</span><strong>{user.walletAddress}</strong></div>
          <button onClick={disconnectWallet} className="btn btn-danger w-full">Disconnect Wallet</button>
        </div>
      ) : (
        <div className="mt-6"><button onClick={linkWallet} disabled={linking} className="btn btn-primary w-full">{linking ? <span className="spinner"></span> : 'Connect MetaMask'}</button></div>
      )}
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
            } catch { toast.error("Could not load election history."); } 
            finally { setLoading(false); }
        };
        fetchHistory();
    }, []);

    if (loading) return <div className="spinner-lg mx-auto"></div>;

    // Filter elections where the user has voted
    const votedElections = elections.filter(e => user.hasVotedOn?.[e.onChainId]);
    
    if (votedElections.length === 0) {
        return (
            <div className="card text-center">
                <div className="empty-state-icon">🕒</div>
                <h3 className="card-title">No Voting History</h3>
                <p>You haven't participated in any elections yet.</p>
                <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Vote Now</button>
            </div>
        );
    }

    return (
        <div className="card">
            <h3 className="card-title">Your Voting History</h3>
            <div className="history-list">
                {votedElections.map(e => (
                    <div key={e.onChainId} className="history-item">
                        <div className="history-item-info">
                            <strong>{e.title}</strong>
                            <span>Voted on: {new Date(e.endAt || e.createdAt).toLocaleDateString()}</span>
                        </div>
                        {/* Navigate to the specific result page for that election */}
                        <button className="btn btn-secondary" onClick={() => navigate(`/results?id=${e.onChainId}`)}>View Results</button>
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
        // Here you would typically make an API call to update user info
        setUser({...user, ...form});
        toast.success("Profile updated!");
        setIsEditing(false);
    };

    return (
        <div className="max-w-lg mx-auto">
            <div className="card">
                <h3 className="card-title">Account Settings</h3>
                <p>Update your personal information and preferences</p>
                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} disabled={!isEditing} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-control" value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={!isEditing} />
                    </div>
                    {isEditing ? (
                        <div className="flex gap-4 mt-4">
                            <button type="submit" className="btn btn-primary">Save Changes</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                        </div>
                    ) : (
                        <button type="button" className="btn btn-secondary mt-4" onClick={() => setIsEditing(true)}>Edit Profile</button>
                    )}
                </form>
            </div>
            <div className="danger-zone">
                <h3 className="danger-zone-title">Danger Zone</h3>
                <p>Irreversible actions that affect your account.</p>
                <div className="danger-zone-action">
                    <div>
                        <strong>Log Out of Account</strong>
                        <p>Logging out will require you to sign in again. Your wallet connection will remain active.</p>
                    </div>
                    <button className="btn btn-danger" onClick={() => { logout(); navigate('/login'); }}>Log Out of Account</button>
                </div>
            </div>
        </div>
    );
}

// UPDATED Admin Components
function AdminPage() {
    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [detailsModal, setDetailsModal] = useState(null);
    const [activeTab, setActiveTab] = useState('active');

    const loadElections = useCallback(async () => {
        setLoading(true);
        try { const res = await axios.get(`${API}/api/elections`); setElections(res.data); } 
        catch { toast.error('Failed to load elections'); }
        setLoading(false);
    }, []);

    useEffect(() => { loadElections(); }, [loadElections]);

    const now = new Date();
    // Logic is now consistent with the backend:
    const activeElections = elections.filter(e => !e.closed && (!e.endAt || new Date(e.endAt) > now));
    const historyElections = elections.filter(e => e.closed || (e.endAt && new Date(e.endAt) <= now));
    const totalCandidates = elections.reduce((sum, e) => sum + (e.candidates?.length || 0), 0);

    return (
        <div className="container">
            <div className="admin-header"><h1>Admin Dashboard</h1><button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Create Election</button></div>
            <div className="admin-summary-grid"> <div className="summary-card"><div className="summary-card-value">{elections.length}</div><div className="summary-card-label">Total Elections</div></div><div className="summary-card"><div className="summary-card-value">{activeElections.length}</div><div className="summary-card-label">Active Elections</div></div><div className="summary-card"><div className="summary-card-value">{historyElections.length}</div><div className="summary-card-label">Closed Elections</div></div><div className="summary-card"><div className="summary-card-value">{totalCandidates}</div><div className="summary-card-label">Total Candidates</div></div> </div>
            <div className="admin-tabs">
                <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>Active Elections ({activeElections.length})</button>
                <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>Election History ({historyElections.length})</button>
            </div>
            <div className="admin-content">
                {loading ? <div className="spinner-lg"></div> : <ElectionList isHistory={activeTab === 'history'} elections={activeTab === 'active' ? activeElections : historyElections} onViewDetails={setDetailsModal} />}
            </div>
            {modalOpen && <CreateElectionModal onClose={() => setModalOpen(false)} onCreated={loadElections} />}
            {detailsModal && <ElectionDetailsModal election={detailsModal} onClose={() => setDetailsModal(null)} />}
        </div>
    );
}

function ElectionList({ elections, onViewDetails, isHistory }) {
    if (elections.length === 0) return <p>No elections to display in this section.</p>;
    
    return (
        <div className="grid grid-cols-1 gap-6">
            {elections.map(e => {
                const status = e.closed ? "CLOSED" : (e.endAt && new Date(e.endAt) < new Date() ? "FINISHED" : "ACTIVE");
                return (
                    <div className="admin-election-card" key={e.onChainId}>
                        <div className="admin-election-info">
                            <h3>{e.title}</h3>
                            <div className={`status-tag ${status !== 'ACTIVE' ? 'closed' : 'active'}`}>{status}</div>
                            <div className="admin-election-meta"><span>On-chain ID: {e.onChainId}</span><span>Candidates: {e.candidates?.length || 0}</span><span>Total Votes: {e.votesTotal || 0}</span></div>
                        </div>
                        <div className="admin-election-actions">
                            <button onClick={() => onViewDetails(e)} className="btn btn-secondary">Details</button>
                            <a href={`https://testnet.bscscan.com/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Blockchain</a>
                            {/* Only show the Close button if the election is ACTUALLY active */}
                            {status === 'ACTIVE' && <button className="btn btn-danger">Close</button>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
/* function ElectionList({ elections, onViewDetails }) {
    if (elections.length === 0) return <p>No elections to display in this section.</p>;
    return (<div className="grid grid-cols-1 gap-6">{elections.map(e => <div className="admin-election-card" key={e.onChainId}><div className="admin-election-info"><h3>{e.title}</h3><div className={`status-tag ${!e.closed ? 'active' : 'closed'}`}>{e.closed ? "CLOSED" : "ACTIVE"}</div><div className="admin-election-meta"><span>On-chain ID: {e.onChainId}</span><span>Candidates: {e.candidates?.length || 0}</span><span>Total Votes: {e.votesTotal || 0}</span></div></div><div className="admin-election-actions"><button onClick={() => onViewDetails(e)} className="btn btn-secondary">Details</button><a href={`https://testnet.bscscan.com/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Blockchain</a>{!e.closed && <button className="btn btn-danger">Close</button>}</div></div>)}</div>);
 */

function ElectionDetailsModal({ election, onClose }){
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header"><h3>{election.title}</h3><button onClick={onClose} className="modal-close-btn">&times;</button></div>
          <div className="modal-body">
            {/* Proactive UI: Better message for empty description */}
            <p className={!election.description ? 'text-muted' : ''}>
                {election.description || "No description was provided for this election."}
            </p>
            <div className="details-grid">
                <span>On-Chain ID</span><strong>{election.onChainId}</strong>
                <span>Status</span><strong>{election.closed ? 'Closed' : 'Active'}</strong>
                <span>Created</span><strong>{new Date(election.createdAt).toLocaleString()}</strong>
                <span>Total Votes</span><strong>{election.votesTotal || 0}</strong>
            </div>
            <h4 className="mt-6 mb-2 font-semibold">Candidates</h4>
            <div className="candidate-list-modal">
                {election.candidates?.length > 0 ? (
                    <ul>{election.candidates.map(c => <li key={c.onChainId}><span>{c.name} ({c.party || 'N/A'})</span><strong>{c.votes} votes</strong></li>)}</ul>
                ) : (
                    // Proactive UI: Better empty state
                    <div className="modal-empty-state">
                        <p>No candidates were found for this election.</p>
                    </div>
                )}
            </div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={onClose}>Close</button></div>
        </div>
      </div>
    );
}

function CreateElectionModal({ onClose, onCreated }) {
    const [form, setForm] = useState({ title: '', description: '', startAt: '', endAt: '', candidates: [{ name: '', party: '' }] });
    const [loading, setLoading] = useState(false);

    const handleCandidateChange = (index, field, value) => { const newCandidates = [...form.candidates]; newCandidates[index][field] = value; setForm({ ...form, candidates: newCandidates }); };
    const addCandidateField = () => setForm({ ...form, candidates: [...form.candidates, { name: '', party: '' }] });
    const removeCandidateField = (index) => { const newCandidates = form.candidates.filter((_, i) => i !== index); setForm({ ...form, candidates: newCandidates }); };

    // --- NEW: VALIDATION LOGIC ---
    const isFormValid = () => {
        // Title must not be empty
        if (!form.title.trim()) {
            return false;
        }
        // There must be at least one candidate with a non-empty name
        if (!form.candidates.some(c => c.name.trim())) {
            return false;
        }
        return true;
    };
    
    const handleCreate = async () => {
      if (!isFormValid()) {
        toast.error("Please provide an election title and at least one candidate name.");
        return;
      }
      setLoading(true);
    const createToast = toast.loading("Creating election...");
    try {
      const token = localStorage.getItem('token');
      const payload = { title: form.title, description: form.description, startAt: form.startAt || null, endAt: form.endAt || null };
      const res = await axios.post(`${API}/api/admin/elections`, payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.onChainId) {
        const validCandidates = form.candidates.filter(c => c.name.trim());
        if (validCandidates.length > 0) {
          toast.loading(`Adding ${validCandidates.length} candidates...`, { id: createToast });
          for (const c of validCandidates) {
            await axios.post(`${API}/api/admin/elections/${res.data.onChainId}/candidates`, { name: c.name, party: c.party }, { headers: { Authorization: `Bearer ${token}` } });
          }
        }
      }
      toast.success('Election created successfully!', { id: createToast });
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to create election.', { id: createToast });
    } finally { setLoading(false); }
  };
  
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header"><h3>Create New Election</h3><button onClick={onClose} className="modal-close-btn">&times;</button></div>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Election Title *</label><input className="form-control" placeholder="e.g., Student Council Election 2025" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" placeholder="Brief description of the election..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}></textarea></div>
            <div className="grid grid-cols-2 gap-4"><div className="form-group"><label className="form-label">Start Date (Optional)</label><input type="datetime-local" className="form-control" value={form.startAt} onChange={e => setForm({ ...form, startAt: e.target.value })} /></div><div className="form-group"><label className="form-label">End Date (Optional)</label><input type="datetime-local" className="form-control" value={form.endAt} onChange={e => setForm({ ...form, endAt: e.target.value })} /></div></div>
            <div className="form-group">
                <label className="form-label">Candidates *</label>
                {form.candidates.map((c, i) => (
                    <div key={i} className="candidate-input-row">
                        <input className="form-control" placeholder="Candidate Name *" value={c.name} onChange={e => handleCandidateChange(i, 'name', e.target.value)} />
                        <input className="form-control" placeholder="Party (Optional)" value={c.party} onChange={e => handleCandidateChange(i, 'party', e.target.value)} />
                        {form.candidates.length > 1 && <button onClick={() => removeCandidateField(i)} className="btn-remove-candidate">&times;</button>}
                    </div>
                ))}
                <button onClick={addCandidateField} className="btn btn-secondary w-full mt-2">+ Add Candidate</button>
            </div>
          </div>
          <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              {/* Button is now disabled based on validation */}
              <button className="btn btn-primary" onClick={handleCreate} disabled={loading || !isFormValid()}>{loading ? <span className="spinner" /> : "Create Election"}</button>
          </div>
        </div>
      </div>
    );
}
// --- App Root and Routing ---
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

const LoadingScreen = () => <div className="container py-20 text-center"><div className="spinner-lg mx-auto"></div></div>;
function PublicRoute({ children }) { const { user, loading } = useAuth(); if (loading) return <LoadingScreen />; return !user ? children : <Navigate to="/" />; }
function PrivateRoute() { const { user, loading } = useAuth(); if (loading) return <LoadingScreen />; return user ? <MainLayout /> : <Navigate to="/login" />; }
function AdminRoute() { const { user } = useAuth(); return user.role === 'admin' ? <AdminPage /> : <Navigate to="/" />; }
