import React from 'react';

const Spinner = ({ size = 'md' }) => {
  const m = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size] || 'w-6 h-6';
  return (
    <div
      className={`animate-spin rounded-full border-4 border-t-transparent ${m}`}
      style={{ borderColor: '#4f46e5', borderTopColor: 'transparent' }}
    />
  );
};
export default Spinner;
