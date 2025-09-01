import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';

export default function PrivateRoute() {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
}
