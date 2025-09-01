import React from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Spinner from './ui/Spinner';

export default function ConfirmationModal({
  isOpen, onClose, onConfirm, candidateName, isLoading
}) {
  return (
    <Modal open={isOpen} onClose={onClose} title="Confirm Your Vote">
      <p className="mb-2">
        Are you sure you want to cast your vote for <strong>{candidateName}</strong>?
      </p>
      <p className="mb-6 text-sm font-medium text-red-600">This action is irreversible.</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button onClick={onConfirm} disabled={isLoading}>
          {isLoading ? <Spinner size="sm" /> : 'Yes, Cast My Vote'}
        </Button>
      </div>
    </Modal>
  );
}
