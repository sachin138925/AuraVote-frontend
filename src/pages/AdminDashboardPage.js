import React, { useEffect, useState } from 'react';
import api from '../api/api';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

export default function AdminDashboardPage() {
  const [elections, setElections] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/elections');
        setElections(res.data);
      } catch (e) {} finally {
        setBusy(false);
      }
    };
    load();
  }, []);

  const toggleStatus = async (id, current) => {
    const tid = toast.loading(`${current ? 'Ending' : 'Starting'} election...`);
    try {
      const res = await api.put(`/elections/${id}/status`, { isActive: !current });
      setElections((prev) => prev.map((e) => (e._id === id ? res.data : e)));
      toast.success('Election status updated!', { id: tid });
    } catch (e) {
      toast.error('Failed to update status', { id: tid });
    }
  };

  if (busy) {
    return <div className="flex h-64 items-center justify-center rounded border"><Spinner size="lg" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage all elections from this central hub.</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-3">Title</th>
                <th className="p-3">Status</th>
                <th className="p-3">Start</th>
                <th className="p-3">End</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {elections.map((el) => (
                <tr key={el._id} className="border-t">
                  <td className="p-3">{el.title}</td>
                  <td className="p-3">
                    <Badge color={el.isActive ? 'green' : 'red'}>
                      {el.isActive ? 'Active' : 'Ended'}
                    </Badge>
                  </td>
                  <td className="p-3">{new Date(el.startDate).toLocaleDateString()}</td>
                  <td className="p-3">{new Date(el.endDate).toLocaleDateString()}</td>
                  <td className="p-3">
                    <Button variant="outline" onClick={() => toggleStatus(el._id, el.isActive)}>
                      {el.isActive ? 'End' : 'Start'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
