import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useWeb3 } from '../hooks/useWeb3';

const MyVotesPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { explorerFor } = useWeb3();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/vote/history');
        setHistory(res.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <div className="card-header">
        <h1>My Votes</h1>
        <p className="opacity-80 text-sm">Verify your vote hashes on the block explorer.</p>
      </div>
      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Election</th>
              <th>Candidate</th>
              <th>Tx Hash</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => {
              const link = explorerFor(h.txHash);
              return (
                <tr key={h.txHash}>
                  <td>{new Date(h.date).toLocaleString()}</td>
                  <td>{h.electionTitle}</td>
                  <td>{h.candidateName}</td>
                  <td>
                    {link
                      ? <a className="text-primary underline" href={link} target="_blank" rel="noreferrer">{h.txHash.slice(0,10)}...</a>
                      : h.txHash}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default MyVotesPage;
