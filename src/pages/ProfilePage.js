import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

export default function ProfilePage() {
  const { user } = useContext(AuthContext);
  if (!user) return <p>Loading profile...</p>;

  const row = (label, value) => (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} disabled />
    </div>
  );

  return (
    <Card>
      <CardHeader><h1 className="text-2xl font-semibold">My Profile</h1></CardHeader>
      <CardContent className="space-y-4">
        {row('Email Address', user.email)}
        {row('Connected Wallet', user.walletAddress || 'Not Connected')}
        {row('Voting Status', user.hasVoted ? 'Voted' : 'Has Not Voted')}
        {row('Account Type', user.isAdmin ? 'Administrator' : 'Voter')}
      </CardContent>
    </Card>
  );
}
