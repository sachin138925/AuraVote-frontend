/* Global and Reset */
*,
*::before,
*::after {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #121212;
  color: #eee;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: #8b5cf6;
  text-decoration: none;
}

a:hover,
a:focus {
  text-decoration: underline;
  outline: none;
}

/* Utility */
.container {
  max-width: 1024px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 1rem;
}

.text-center {
  text-align: center;
}

.text-muted {
  color: #888;
}

.text-green {
  color: #10b981;
}

.text-red {
  color: #ef4444;
}

.font-semibold {
  font-weight: 600;
}

.mt-2 {
  margin-top: 0.5rem;
}
.mt-4 {
  margin-top: 1rem;
}
.mt-6 {
  margin-top: 1.5rem;
}
.mb-2 {
  margin-bottom: 0.5rem;
}

.flex {
  display: flex;
}
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
.flex-gap-4 {
  gap: 1rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
  border: none;
  transition: background-color 0.2s ease, color 0.2s ease;
  padding: 0.5rem 1rem;
  user-select: none;
  font-size: 1rem;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-primary {
  background-color: #8b5cf6;
  color: #fff;
}

.btn-primary:hover:not(:disabled),
.btn-primary:focus:not(:disabled) {
  background-color: #7c3aed;
  outline: none;
}

.btn-secondary {
  background-color: #374151;
  color: #ddd;
}

.btn-secondary:hover:not(:disabled),
.btn-secondary:focus:not(:disabled) {
  background-color: #4b5563;
  outline: none;
}

.btn-danger {
  background-color: #ef4444;
  color: #fff;
}

.btn-danger:hover:not(:disabled),
.btn-danger:focus:not(:disabled) {
  background-color: #dc2626;
  outline: none;
}

.btn-warning {
  background-color: #f59e0b;
  color: #fff;
}

.btn-warning:hover:not(:disabled),
.btn-warning:focus:not(:disabled) {
  background-color: #d97706;
  outline: none;
}

.btn-remove-candidate {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.25rem;
  align-self: center;
  transition: color 0.2s ease;
}

.btn-remove-candidate:hover {
  color: #b91c1c;
}

/* Width utilities */
.w-full {
  width: 100%;
}
.max-w-lg {
  max-width: 32rem;
}
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

/* Spinner */
.spinner,
.spinner-lg {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

.spinner {
  width: 1rem;
  height: 1rem;
}

.spinner-lg {
  width: 3rem;
  height: 3rem;
  margin: 1rem auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Navbar */
.navbar {
  background-color: #1f2937;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.2);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-brand {
  font-weight: 700;
  font-size: 1.5rem;
  color: #8b5cf6;
}

.navbar-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-link {
  color: #ddd;
  font-weight: 500;
  padding: 0.375rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.nav-link:hover,
.nav-link:focus {
  background-color: #4b5563;
  outline: none;
}

.nav-link.active {
  color: #8b5cf6;
  font-weight: 700;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile-menu-container {
  position: relative;
}

.profile-avatar {
  width: 2.5rem;
  height: 2.5rem;
  background-color: #8b5cf6;
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
  font-size: 1.25rem;
  border: none;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.profile-avatar:hover,
.profile-avatar:focus {
  background-color: #7c3aed;
  outline: none;
}

/* Dropdown */
.profile-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  background-color: #1f2937;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgb(0 0 0 / 0.25);
  width: 220px;
  z-index: 2000;
  padding: 0.5rem 0;
}

.dropdown-header {
  padding: 0 1rem 0.5rem 1rem;
  border-bottom: 1px solid #374151;
  margin-bottom: 0.5rem;
  color: #eee;
  font-size: 0.9rem;
}

.dropdown-header .font-semibold {
  display: block;
  font-weight: 700;
  margin-bottom: 0.15rem;
}

.dropdown-header .text-muted {
  font-size: 0.8rem;
  color: #aaa;
}

.dropdown-item {
  display: block;
  padding: 0.5rem 1rem;
  font-weight: 500;
  color: #ddd;
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  transition: background-color 0.2s ease;
  user-select: none;
}

.dropdown-item:hover,
.dropdown-item:focus {
  background-color: #4b5563;
  outline: none;
}

/* Main Content */
.main-content {
  padding: 1.5rem 1rem 3rem;
  min-height: calc(100vh - 56px);
}

/* Info Box */
.info-box {
  background-color: #1f2937;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 2rem;
}

.info-box-icon {
  font-size: 2rem;
  color: #8b5cf6;
}

.info-box-content {
  flex: 1;
}

.info-box-title {
  margin: 0 0 0.25rem 0;
  font-weight: 700;
  font-size: 1.125rem;
}

.info-box-text {
  margin: 0;
  color: #aaa;
  font-size: 0.9rem;
}

/* Auth Container */
.auth-container {
  max-width: 400px;
  margin: 3rem auto;
  background-color: #1f2937;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgb(0 0 0 / 0.3);
}

.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.auth-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: #8b5cf6;
}

.auth-subtitle {
  font-size: 1rem;
  color: #bbb;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  margin-bottom: 0.25rem;
  font-weight: 600;
  color: #ddd;
}

.form-control {
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #374151;
  background-color: #121212;
  color: #eee;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 6px #8b5cf6aa;
}

.account-type-group {
  display: flex;
  gap: 1rem;
}

.account-type-label {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  border: 1px solid transparent;
  user-select: none;
  font-weight: 600;
  color: #ddd;
  background-color: #2d3748;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.account-type-label.selected {
  background-color: #8b5cf6;
  border-color: #7c3aed;
  color: #fff;
}

.account-type-radio {
  display: none;
}

.arrow {
  margin-left: 0.5rem;
  font-weight: 700;
  font-size: 1.25rem;
}

/* Banner */
.banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.banner svg {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
}

.banner.warning {
  background-color: #fbbf24;
  color: #92400e;
}

.banner.success {
  background-color: #10b981;
  color: #064e3b;
}

/* Connect Wallet Card */
.connect-wallet-card {
  background-color: #1f2937;
  padding: 1.5rem;
  border-radius: 12px;
  max-width: 400px;
  margin: 2rem auto 0;
  text-align: center;
}

.connect-wallet-card h2 {
  margin-bottom: 0.5rem;
  color: #8b5cf6;
  font-weight: 700;
}

.connect-wallet-card p {
  margin-bottom: 1rem;
  color: #bbb;
}

/* Candidate Vote Card */
.candidate-card-vote {
  background-color: #1f2937;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  box-shadow: 0 6px 12px rgb(0 0 0 / 0.3);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: transform 0.2s ease;
}

.candidate-card-vote:hover {
  transform: translateY(-4px);
}

.candidate-header {
  display: flex;
  justify-content: flex-end;
}

.candidate-rank {
  font-weight: 700;
  font-size: 1.125rem;
  color: #8b5cf6;
}

.candidate-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ddd;
  margin: 0;
}

.candidate-party {
  font-size: 1rem;
  font-weight: 500;
  color: #aaa;
  margin: 0;
}

.candidate-progress-bar {
  background-color: #374151;
  border-radius: 12px;
  height: 10px;
  overflow: hidden;
  margin-top: 0.25rem;
}

.candidate-progress-bar > div {
  height: 100%;
  background-color: #8b5cf6;
  border-radius: 12px 0 0 12px;
  transition: width 0.4s ease;
}

.candidate-stats {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  font-size: 0.9rem;
  color: #ddd;
}

.vote-button-container {
  margin-top: auto;
}

/* Quick Actions */
.quick-actions-container {
  margin-top: 3rem;
}

.quick-actions-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #8b5cf6;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
}

.quick-action-card {
  background-color: #1f2937;
  padding: 1rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #ddd;
  text-align: center;
  box-shadow: 0 4px 8px rgb(0 0 0 / 0.25);
  transition: background-color 0.2s ease;
}

.quick-action-card:hover,
.quick-action-card:focus {
  background-color: #3b82f6;
  color: #fff;
  outline: none;
}

/* Results Page */
.results-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.results-title-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-weight: 700;
  font-size: 1.5rem;
  color: #8b5cf6;
}

.status-tag {
  padding: 0.15rem 0.75rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.85rem;
  color: #fff;
}

.status-tag.active {
  background-color: #10b981;
}

.status-tag.closed {
  background-color: #6b7280;
}

.results-header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.results-dropdown {
  background-color: #1f2937;
  border: 1px solid #374151;
  color: #ddd;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 1rem;
}

.results-dropdown:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 6px #8b5cf6aa;
}

.results-summary-grid {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.summary-card {
  background-color: #1f2937;
  flex: 1 1 150px;
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 6px 12px rgb(0 0 0 / 0.3);
}

.summary-card-value {
  font-size: 2rem;
  font-weight: 700;
  color: #8b5cf6;
}

.summary-card-label {
  font-size: 0.95rem;
  color: #bbb;
}

/* Card */
.card {
  background-color: #1f2937;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 6px 12px rgb(0 0 0 / 0.3);
  color: #ddd;
}

/* Card Title */
.card-title {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #8b5cf6;
}

/* Export buttons */
.export-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Results table */
.results-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  color: #ddd;
}

.results-table th,
.results-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #374151;
  text-align: left;
  vertical-align: middle;
}

.results-table th {
  background-color: #2d3748;
  font-weight: 700;
}

.rank-badge {
  background-color: #8b5cf6;
  color: #fff;
  border-radius: 12px;
  padding