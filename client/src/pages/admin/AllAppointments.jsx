// AllRequests.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/ui/AdminHeader';
import Footer from '@/components/Footer';

const AllAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const { token } = useAuth();
  const server = `https://electronic-repair-server.vercel.app/api`;

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}api/appointments/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      console.log(data);
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  useEffect(() => {
    if(token)
      fetchAppointments();
  }, [token]);

  const handleAccept = async (id) => {
    // Implement the accept logic here
    //console.log(`Accepted request with ID: ${id}`);
  };

  const handleReject = async (id) => {
    // Implement the reject logic here
    //console.log(`Rejected request with ID: ${id}`);
  };

  var i=0

  return (
    <> 
    <AdminHeader/>

    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Appointments</h1>
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="py-2 px-4 border-b">Appointment ID</th>
            <th className="py-2 px-4 border-b">User</th>
            <th className="py-2 px-4 border-b">Repair ID</th>
            <th className="py-2 px-4 border-b">Service Name</th>
            <th className="py-2 px-4 border-b">Status</th>
            <th className="py-2 px-4 border-b">Time</th>
            
            
          </tr>
        </thead>
          <tbody>
           
            {appointments.map((appointment) => (
              
            <tr key={appointment._id} className="hover:bg-gray-100">
              <td className="py-2 px-4 border-b">{appointment._id}</td>
              <td className="py-2 px-4 border-b">{appointment.userId.email}</td>
              <td className="py-2 px-4 border-b">{appointment.repairRequestId._id}</td>
              <td className="py-2 px-4 border-b">{appointment.repairRequestId.serviceId.name}</td>
              <td className="py-2 px-4 border-b">{appointment.status}</td>
              <td className="py-2 px-4 border-b"><td className="py-2 px-4 border-b">
                {new Date(appointment.scheduledDateTime).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                })}
                </td></td>
              
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <Footer/>
    </>
  );
};

export default AllAppointments;