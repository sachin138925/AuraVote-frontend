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

// --- Configuration and ABI ---
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '';
const RECAPTCHA_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
const RPC_URL = process.env.REACT_APP_RPC_URL_BSC_TESTNET;
const VotingABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"electionId","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"candidateId","type":"uint256"},{"indexed":false,"internalType":"string","name":"name","type":"string"},{"indexed":false,"internalType":"string","name":"party","type":"string"}],"name":"CandidateAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"electionId","type":"uint256"}],"name":"ElectionClosed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"electionId","type":"uint256"},{"indexed":false,"internalType":"string","name":"title","type":"string"},{"indexed":false,"internalType":"uint256","name":"startAt","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"endAt","type":"uint256"}],"name":"ElectionCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"electionId","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"candidateId","type":"uint256"},{"indexed":true,"internalType":"address","name":"voter","type":"address"}],"name":"Voted","type":"event"},{"inputs":[{"internalType":"uint256","name":"_electionId","type":"uint256"},{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_party","type":"string"}],"name":"addCandidate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_title","type":"string"},{"internalType":"string","name":"_description","type":"string"},{"internalType":"uint256","name":"_startAt","type":"uint256"},{"internalType":"uint256","name":"_endAt","type":"uint256"}],"name":"createElection","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"elections","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"string","name":"title","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"uint256","name":"startAt","type":"uint256"},{"internalType":"uint256","name":"endAt","type":"uint256"},{"internalType":"bool","name":"closed","type":"bool"},{"internalType":"uint256","name":"nextCandidateId","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_electionId","type":"uint256"},{"internalType":"uint256","name":"_candidateId","type":"uint256"}],"name":"getCandidate","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_electionId","type":"uint256"}],"name":"getElectionBasic","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bool","name":"","type":"bool"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nextElectionId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_electionId","type":"uint256"},{"internalType":"bool","name":"_isClosed","type":"bool"}],"name":"toggleCloseElection","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_electionId","type":"uint256"},{"internalType":"uint256","name":"_candidateId","type":"uint256"}],"name":"vote","outputs":[],"stateMutability":"nonpayable","type":"function"}];

// --- Auth Context ---
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
    // ... (This entire section is correct and unchanged)
}

// --- Wallet Helpers ---
const getProvider = () => new ethers.JsonRpcProvider(RPC_URL);
const getSignerContract = async () => {
    // ... (This section is correct and unchanged)
};

// --- Layouts and Global Components ---
function MainLayout() { /* ... (unchanged) ... */ }
function Navbar() { /* ... (unchanged) ... */ }
const InfoBox = ({ children, title, text, icon }) => { /* ... (unchanged) ... */ };

// --- Auth Pages ---
function LoginPage() { /* ... (unchanged) ... */ }
function RegisterPage() { /* ... (unchanged) ... */ }

// --- Main App Pages ---

function HomePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchElectionData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/elections/active`);
      setElection(res.data);
      const provider = getProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingABI, provider);
      const onChainData = await contract.getElectionBasic(res.data.onChainId);
      const count = Number(onChainData[6]);

      if (count === 0) {
        setCandidates([]);
        return;
      }
      
      const promises = Array.from({ length: count }, (_, i) => contract.getCandidate(res.data.onChainId, i + 1));
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

  // THIS FUNCTION IS NOW USED
  const handleVote = async (candidate) => {
    const voteToast = toast.loading('Preparing your vote...');
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
    }
  };

  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

  const ConnectWalletPrompt = () => (
    <>
      <div className="banner warning">Wallet Required: Please connect your MetaMask wallet to participate in voting.</div>
      <div className="connect-wallet-card">
        <h2>Connect Wallet</h2>
        <p>Link your MetaMask wallet to participate in voting</p>
        <button className="btn btn-primary" onClick={() => navigate('/profile/wallet')}>Connect MetaMask</button>
      </div>
    </>
  );

  const renderContent = () => {
    if (loading) return <div className="container text-center"><div className="spinner-lg"></div></div>;
    if (!user?.walletAddress) return <ConnectWalletPrompt />;
    if (!election) return <div className="text-center"><h2>No Active Election</h2><p>There are no elections available for voting at this time.</p></div>;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((candidate, index) => {
          const percentage = totalVotes > 0 ? (candidate.votes / totalVotes * 100) : 0;
          return (
            // --- FIX IS HERE: Added the onClick handler to the div ---
            <div 
              key={candidate.id} 
              className={`candidate-card-vote ${index === 0 ? 'leading' : ''}`}
              onClick={() => handleVote(candidate)} // This line makes the card clickable
            >
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
            </div>
          );
        })}
      </div>
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


function ResultsPage() { /* ... (unchanged) ... */ }

// --- Profile Page and Tabs ---
function ProfilePage() { /* ... (unchanged) ... */ }
function ProfileOverview() { /* ... (unchanged) ... */ }
function ProfileWallet() { /* ... (unchanged) ... */ }
function ProfileVotingHistory() { /* ... (unchanged) ... */ }
function ProfileSettings() { /* ... (unchanged) ... */ }

// --- Admin Page and Components ---
function AdminPage() { /* ... (unchanged) ... */ }
function ElectionList({ elections, onViewDetails }) { /* ... (unchanged) ... */ }
function ElectionDetailsModal({ election, onClose }) { /* ... (unchanged) ... */ }
function CreateElectionModal({ onClose, onCreated }) { /* ... (unchanged) ... */ }

// --- App Root and Routing ---
export default function App() { /* ... (unchanged) ... */ }
const LoadingScreen = () => { /* ... (unchanged) ... */ };
function PublicRoute({ children }) { /* ... (unchanged) ... */ }
function PrivateRoute() { /* ... (unchanged) ... */ }
function AdminRoute() { /* ... (unchanged) ... */ }