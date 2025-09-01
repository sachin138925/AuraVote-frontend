import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';

export default function AdminRoute() {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;
  return user?.isAdmin ? <Outlet /> : <Navigate to="/" />;
}
