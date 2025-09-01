import React from 'react';

const Step = ({ label, active, done }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 rounded-full ${done ? 'bg-green-500' : active ? 'bg-yellow-500' : 'bg-gray-400'}`}/>
    <span className={`text-sm ${done ? 'font-semibold' : ''}`}>{label}</span>
  </div>
);

const TransactionModal = ({ open, onClose, state, txHash, explorerUrl }) => {
  if (!open) return null;
  const steps = [
    { key: 'initiated', label: 'Initiated' },
    { key: 'pending', label: 'Pending in mempool' },
    { key: 'confirmed', label: 'Confirmed on-chain' },
  ];
  const idx = steps.findIndex(s => s.key === state);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e)=>e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-2">Transaction Status</h2>
        <div className="space-y-3">
          {steps.map((s, i) => (
            <Step key={s.key} label={s.label} active={i===idx} done={i<idx} />
          ))}
        </div>
        {txHash && explorerUrl && (
          <a className="mt-4 inline-block text-sm text-primary underline" href={explorerUrl} target="_blank" rel="noreferrer">
            View on block explorer
          </a>
        )}
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
export default TransactionModal;
