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

// --- Configuration ---
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '';
const RECAPTCHA_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
const RPC_URL = process.env.REACT_APP_RPC_URL_BSC_TESTNET;

// --- Auth Context & Wallet Helpers ---
// (These sections are correct and do not need changes)
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);
function AuthProvider({ children }) { /* ... */ }
const getProvider = () => new ethers.JsonRpcProvider(RPC_URL);
const getSignerContract = async () => { /* ... */ };

// --- Layouts and Global Components ---
function MainLayout() { /* ... */ }
function Navbar() { /* ... */ }
const InfoBox = ({ children, title, text, icon }) => { /* ... */ };

// --- Auth Pages ---
function LoginPage() { /* ... */ }
function RegisterPage() { /* ... */ }

// --- Main App Pages ---
function HomePage() { /* ... (This component is correct from the previous version) ... */ }

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
    
    // ... (exportCSV and exportPDF functions are correct)

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
            {/* ... (rest of the results page JSX is correct and will now render properly) ... */}
        </div>
    );
}

// --- Profile Page and Components ---
// (The Profile components are correct from the previous version)
function ProfilePage() { /* ... */ }
function ProfileOverview() { /* ... */ }
function ProfileWallet() { /* ... */ }
function ProfileVotingHistory() { /* ... */ }
function ProfileSettings() { /* ... */ }

// --- Admin Page and Components ---
function AdminPage() { /* ... (Correct from previous version) ... */ }
function ElectionList({ elections, onViewDetails, isHistory }) { /* ... (Correct from previous version) ... */ }

// UPDATED Admin Details Modal
function ElectionDetailsModal({ election, onClose }) {
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
  
// UPDATED Create Election Modal with validation
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
      // ... (rest of the handleCreate function is the same)
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
export default function App() { /* ... (Correct, no changes needed) ... */ }
// ... (Route components are correct and do not need changes)