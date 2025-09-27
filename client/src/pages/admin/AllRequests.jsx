import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/ui/AdminHeader';
import Footer from '@/components/Footer';
import { toast } from '@/components/ui/use-toast';
import axios from 'axios';

const AllRequests = () => {
  const [requests, setRequests] = useState([]);
  const { token } = useAuth();

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}api/repairs/admin/all-repairs`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data);
      
    } catch (error) {
      console.log(error)
      console.error('Error fetching requests:', error);
    }
  };

  useEffect(() => {
    if (token) fetchRequests();
  }, [token]);

 
  return (
    <>
      <AdminHeader />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">All Repair Requests</h1>
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-2 px-4 border-b">Request ID</th>
              <th className="py-2 px-4 border-b">User</th>
              <th className="py-2 px-4 border-b">Service Name</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Description</th>
              <th className="py-2 px-4 border-b">Estimated Cost</th>
             
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request._id} className="hover:bg-gray-100">
                <td className="py-2 px-4 border-b">{request._id}</td>
                <td className="py-2 px-4 border-b">{request.userId?.email}</td>
                <td className="py-2 px-4 border-b">{request.serviceId?.name}</td>
                <td className="py-2 px-4 border-b capitalize">{request.status}</td>
                <td className="py-2 px-4 border-b">{request.description}</td>
                <td className="py-2 px-4 border-b font-bold">₹{request.estimatedCost.toFixed(2)}</td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </>
  );
};

export default AllRequests;
