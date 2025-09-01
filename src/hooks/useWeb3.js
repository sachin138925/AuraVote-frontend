import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import toast from 'react-hot-toast';

// Your on-chain ABI (same as backend uses)
const contractABI = [
  {"inputs":[{"internalType":"string[]","name":"_candidateNames","type":"string[]"}],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"candidateId","type":"uint256"}],"name":"Voted","type":"event"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"candidates","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"voteCount","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"candidatesCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_candidateId","type":"uint256"}],"name":"vote","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"voters","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}
];

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

export const useWeb3 = () => {
  const { user, setUser } = useContext(AuthContext);
  const [provider, setProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      setProvider(new ethers.BrowserProvider(window.ethereum));
    }
  }, []);

  const connectWallet = async () => {
    if (!provider) return toast.error('MetaMask is not installed.');
    setIsConnecting(true);
    const tid = toast.loading('Connecting wallet...');
    try {
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];
      const updated = await api.post('/auth/wallet', { walletAddress: address });
      setUser(updated.data);
      toast.success('Wallet connected', { id: tid });
    } catch (e) {
      // interceptor will toast the error
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      const updated = await api.delete('/auth/wallet');
      setUser(updated.data);
      toast.success('Wallet disconnected');
    } catch (e) {}
  };

  const castVoteOnChain = async (candidateId) => {
    if (!provider) return { success: false, message: 'MetaMask not found' };
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.vote(candidateId);
      await tx.wait();
      return { success: true, hash: tx.hash };
    } catch (e) {
      return { success: false, message: e?.reason || 'Transaction failed' };
    }
  };

  return {
    connectWallet,
    disconnectWallet,
    isConnecting,
    walletAddress: user?.walletAddress,
    castVoteOnChain
  };
};
