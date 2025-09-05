/* client/src/App.css */

/* ... (add this to the end of your file) ... */

/* FIX for Results Page Header Layout */
.results-header {
    display: flex;
    flex-wrap: wrap; /* Allow items to wrap on smaller screens */
    align-items: center;
    justify-content: space-between; /* Pushes title and actions apart */
    gap: 1.5rem; /* Space between items when they wrap */
    margin-bottom: 2rem;
}

.results-title-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-grow: 1; /* Allows title to take up available space */
}

.results-header-actions {
    display: flex;
    gap: 0.75rem;
    flex-shrink: 0; /* Prevents the actions from shrinking */
}

/* FIX for "View on Blockchain" button bleeding */
.export-buttons .btn {
    white-space: nowrap; /* Prevents text from wrapping */
    overflow: hidden;
    text-overflow: ellipsis; /* Adds "..." if text is too long */
}

/* NEW styles for Admin Details Modal */
.modal-empty-state {
    text-align: center;
    padding: 2rem;
    background-color: var(--bg-secondary);
    border-radius: var(--radius-md);
    border: 1px dashed var(--border-color);
}

.modal-empty-state p {
    margin: 0;
    color: var(--text-muted);
    font-style: italic;
}

/* NEW styles for "Remove Candidate" button in modal */
.candidate-input-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
}

.btn-remove-candidate {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.5rem;
    font-weight: bold;
    cursor: pointer;
    padding: 0 0.5rem;
    line-height: 1;
}
.btn-remove-candidate:hover {
    color: #DC2626; /* Red on hover */
}