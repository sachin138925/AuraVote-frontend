import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useWeb3 } from '../hooks/useWeb3';
import api from '../api/api';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ConfirmationModal';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

export default function HomePage() {
  const { user, setUser } = useContext(AuthContext);
  const { castVoteOnChain, walletAddress } = useWeb3();

  const [election, setElection] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/elections/active');
        setElection(res.data);
      } catch (e) {
        // interceptor toasts
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, []);

  const selectCandidate = (candidate, index) => {
    if (user?.hasVoted) return;
    setSelectedCandidate({ ...candidate, id: index + 1 });
    setOpen(true);
  };

  const confirmVote = async () => {
    if (!selectedCandidate) return;
    if (!walletAddress) {
      setOpen(false);
      return toast.error('Please connect your wallet to vote.');
    }
    setBusy(true);
    const tid = toast.loading('Submitting vote to blockchain...');
    try {
      const result = await castVoteOnChain(selectedCandidate.id);
      if (!result.success) throw new Error(result.message);
      await api.post('/vote/update-status');
      setUser({ ...user, hasVoted: true });
      toast.success(`Vote cast! Tx: ${result.hash.slice(0, 10)}...`, { id: tid, duration: 6000 });
    } catch (e) {
      toast.error(e.message, { id: tid });
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  if (pageLoading)
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-card">
        <Spinner size="lg" />
      </div>
    );

  return (
    <>
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold">
            {election ? election.title : 'No Active Election'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {election ? election.description : 'There is no election currently active. Please check back later.'}
          </p>
          {user?.hasVoted && (
            <p className="font-bold text-green-600">You have already voted in this election.</p>
          )}
        </CardHeader>
        {election && (
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {election.candidates.map((c, idx) => (
                <div
                  key={c._id || c.name}
                  className={`cursor-pointer rounded-lg border-2 p-6 text-center transition-all 
                    ${user?.hasVoted ? 'cursor-not-allowed opacity-60' : 'hover:border-primary hover:shadow-lg'}
                    ${selectedCandidate?.name === c.name ? 'border-primary bg-secondary' : 'border-border'}`}
                  onClick={() => selectCandidate(c, idx)}
                >
                  <h3 className="text-xl font-bold">{c.name}</h3>
                  <p className="text-muted-foreground">{c.party}</p>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      <ConfirmationModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={confirmVote}
        candidateName={selectedCandidate?.name}
        isLoading={busy}
      />
    </>
  );
}
