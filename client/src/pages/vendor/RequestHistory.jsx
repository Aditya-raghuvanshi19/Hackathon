import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import AdminHeader from '@/components/ui/AdminHeader';
import Footer from '@/components/Footer';
import axios from 'axios';

const RequestHistory = () => {
  const { token } = useAuth();
  const [repairs, setRepairs] = useState([]);

  const fetchRepairs = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}api/repairs/vendor/all-repairs`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch repairs');

      const data = await res.json();
      setRepairs(data);
    } catch (err) {
      console.error(err);
      toast({
        title: "❌ Error",
        description: "Could not load repairs.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (token) fetchRepairs();
  }, [token]);

  const updateStatus = async (repairId, newStatus) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_SERVER}api/repairs/${repairId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRepairs((prev) =>
        prev.map((r) => (r._id === repairId ? { ...r, status: newStatus } : r))
      );

      toast({
        title: `🔄 Status Updated`,
        description: `Repair marked as ${newStatus}.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "❌ Error",
        description: "Could not update status.",
        variant: "destructive",
      });
    }
  };

  const statusOptions = ['in-progress', 'completed', 'cancelled'];

  return (
    <>
      <AdminHeader />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Repair History</h1>
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-2 px-4 border-b">Request ID</th>
              <th className="py-2 px-4 border-b">User</th>
              <th className="py-2 px-4 border-b">Service Name</th>
              <th className="py-2 px-4 border-b">Description</th>
              <th className="py-2 px-4 border-b">Cost</th>
              <th className="py-2 px-4 border-b w-[150px] text-center">Status</th>
              
            </tr>
          </thead>
          <tbody>
            {repairs.map((repair) => (
              
              <tr key={repair._id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{repair._id}</td>
                <td className="py-2 px-4 border-b">{repair.userId?.email}</td>
                <td className="py-2 px-4 border-b">{repair.serviceId?.name}</td>
                <td className="py-2 px-4 border-b">{repair.description}</td>
                <td className="py-2 px-4 border-b font-semibold">₹{repair.estimatedCost.toFixed(2)}</td>
                <td className="py-2 px-4 border-b capitalize  w-[150px] text-center">
                  <span className={`px-3 py-1 rounded text-white text-sm font-medium ${
                    repair.status === 'pending' ? 'bg-yellow-500'
                    : repair.status === 'in-progress' ? 'bg-blue-500'
                    : repair.status === 'completed' ? 'bg-green-600'
                    : 'bg-red-600'
                  }`}>
                    {repair.status}
                  </span>
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </>
  );
};

export default RequestHistory;
