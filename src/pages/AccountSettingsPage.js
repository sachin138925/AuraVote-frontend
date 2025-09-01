import React, { useState, useContext } from 'react';
import api from '../api/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const AccountSettingsPage = () => {
  const { user, setUser } = useContext(AuthContext);
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const updateEmail = async () => {
    try {
      const res = await api.put('/user/email', { email });
      setUser(res.data);
      toast.success('Email updated');
    } catch (e) {}
  };

  const updatePassword = async () => {
    try {
      await api.put('/user/password', { currentPassword, newPassword });
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e) {}
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Update Email</h2>
        <input className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
               value={email} onChange={(e)=>setEmail(e.target.value)} />
        <div className="mt-3">
          <button className="btn btn-primary" onClick={updateEmail}>Save Email</button>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Change Password</h2>
        <input className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-2"
               type="password" placeholder="Current password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} />
        <input className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
               type="password" placeholder="New password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} />
        <div className="mt-3">
          <button className="btn btn-primary" onClick={updatePassword}>Update Password</button>
        </div>
      </div>
    </div>
  );
};
export default AccountSettingsPage;
