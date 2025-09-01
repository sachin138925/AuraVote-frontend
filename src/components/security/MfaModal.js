import React, { useState } from 'react';
import Spinner from '../ui/Spinner';

const MfaModal = ({ open, onClose, onVerify, email, isLoading }) => {
  const [code, setCode] = useState('');
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e)=>e.stopPropagation()}>
        <h2 className="text-lg font-semibold">MFA Verification</h2>
        <p className="text-sm mb-3">Enter the 6-digit code sent to <b>{email}</b>.</p>
        <input
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="123456" inputMode="numeric" maxLength={6}
          value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,''))}
        />
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button className="btn btn-primary" onClick={()=>onVerify(code)} disabled={isLoading || code.length!==6}>
            {isLoading ? <Spinner size="sm" /> : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default MfaModal;
