import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useWeb3 } from '../../hooks/useWeb3';
import Button from '../ui/Button';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const { connectWallet, disconnectWallet, walletAddress, isConnecting } = useWeb3();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const navLink = ({ isActive }) =>
    `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-foreground/60'}`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <NavLink to="/" className="text-xl font-bold text-primary">HybridVote</NavLink>

        <div className="hidden items-center space-x-6 md:flex">
          <NavLink to="/" className={navLink}>Vote</NavLink>
          <NavLink to="/results" className={navLink}>Results</NavLink>
          <NavLink to="/profile" className={navLink}>Profile</NavLink>
          {user?.isAdmin && <NavLink to="/admin" className={navLink}>Admin</NavLink>}
        </div>

        <div className="flex items-center gap-3">
          {walletAddress ? (
            <div className="flex items-center gap-3 rounded-md bg-secondary px-3 py-2 font-mono text-sm">
              <span>{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</span>
              <button onClick={disconnectWallet} className="text-destructive/80 hover:text-destructive text-xs font-semibold">
                Disconnect
              </button>
            </div>
          ) : (
            <Button onClick={connectWallet} disabled={isConnecting}>
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}

          <Button variant="outline" onClick={() => { logout(); navigate('/login'); }}>
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
