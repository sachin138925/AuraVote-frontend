import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import ExportButtons from '../components/results/ExportButtons';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function ResultsPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/elections/results');
        setData(res.data);
      } catch (e) {
        setErr(e?.response?.data?.msg || 'Could not load results.');
      } finally {
        setBusy(false);
      }
    };
    load();
  }, []);

  const totalVotes = useMemo(() => {
    if (!data?.results) return 0;
    return data.results.reduce((s, c) => s + Number(c.votes || 0), 0);
  }, [data]);

  useEffect(() => {
    if (!data?.results || busy || err) return;
    const ctx = document.getElementById('results-chart');
    // destroy previous chart instance if any
    if (ctx._chart) {
      ctx._chart.destroy();
      ctx._chart = null;
    }
    const labels = data.results.map((r) => r.name);
    const values = data.results.map((r) => r.votes);
    const newChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Votes', data: values }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
    ctx._chart = newChart;
    return () => newChart.destroy();
  }, [data, busy, err]);

  if (busy) return <div className="card"><div className="p-6"><Spinner size="lg" /></div></div>;

  if (err || !data) {
    return (
      <Card>
        <CardHeader>
          <h1>Election Results</h1>
          <p className="font-bold text-red-600">{err}</p>
        </CardHeader>
      </Card>
    );
  }

  const rows = data.results
    .slice()
    .sort((a, b) => b.votes - a.votes)
    .map((r) => ({ name: r.name, party: r.party, votes: r.votes }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{data.title}</h1>
            <p className="text-sm text-muted-foreground">
              These results are fetched live from the blockchain (via your server).
            </p>
          </div>
          <ExportButtons filename="election-results" rows={rows} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-lg font-semibold">Total Votes Cast: {totalVotes}</p>
        <canvas id="results-chart" height="120" />
        <div className="mt-8 space-y-4">
          {rows.map((c) => {
            const pct = totalVotes > 0 ? (c.votes / totalVotes) * 100 : 0;
            return (
              <div key={c.name}>
                <div className="mb-1 flex justify-between">
                  <strong className="text-base">{c.name} <span className="font-normal text-muted-foreground">({c.party})</span></strong>
                  <span className="font-semibold">{c.votes} Votes ({pct.toFixed(1)}%)</span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded bg-border">
                  <div
                    className="h-full rounded bg-primary"
                    style={{ width: `${pct}%`, transition: 'width .5s ease' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
