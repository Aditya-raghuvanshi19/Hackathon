import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [processedData, setProcessedData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      fetchMetrics();
      fetchProcessedData();
    }
  }, [isAuthenticated]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_BACKEND_SERVER + 'api/uploads/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProcessedData = async () => {
    try {
      setLoading(true);
      const res = await fetch(import.meta.env.VITE_BACKEND_SERVER + 'api/uploads/processed', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProcessedData(data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    const form = new FormData();
    for (const f of selectedFiles) form.append('files', f);
    setUploading(true);
    try {
      await fetch(import.meta.env.VITE_BACKEND_SERVER + 'api/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      await fetchMetrics();
      await fetchProcessedData();
      setSelectedFiles([]);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const downloadReport = async (type) => {
    try {
      const res = await fetch(import.meta.env.VITE_BACKEND_SERVER + `api/uploads/download/${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customer_data.${type}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto p-4 space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Customer Data Files</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <input type="file" multiple onChange={handleFileChange} />
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Total Files Processed</CardTitle></CardHeader>
            <CardContent>{metrics ? metrics.totalFiles : <Skeleton className="h-6" />}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Success Count</CardTitle></CardHeader>
            <CardContent>{metrics ? metrics.successCount : <Skeleton className="h-6" />}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Failure Count</CardTitle></CardHeader>
            <CardContent>{metrics ? metrics.failureCount : <Skeleton className="h-6" />}</CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Processing Trend</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer>
                <LineChart data={metrics?.trend || []}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Data Quality KPIs</CardTitle></CardHeader>
            <CardContent className="h-64 flex justify-center items-center">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={metrics?.kpis || []} dataKey="value" nameKey="label" outerRadius={80} label>
                    {metrics?.kpis?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader><CardTitle>Processed Data</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              <div className="overflow-x-auto">
                <table className="table-auto w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      {processedData.length > 0 && Object.keys(processedData[0]).map((k) => (
                        <th key={k} className="px-2 py-1 border">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {processedData.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.values(row).map((v, idx) => (
                          <td key={idx} className="px-2 py-1 border">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Download buttons */}
        <div className="flex gap-4">
          <Button onClick={() => downloadReport('csv')}>Download CSV</Button>
          <Button onClick={() => downloadReport('xlsx')}>Download Excel</Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;

