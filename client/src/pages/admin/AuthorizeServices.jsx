import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/ui/AdminHeader';
import Footer from '@/components/Footer';
import { toast } from '@/components/ui/use-toast';
import axios from 'axios';

const AuthorizeServices = () => {
  const [services, setServices] = useState([]);
  const { token } = useAuth();

  const fetchServices = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}api/services/admin/getAll`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  useEffect(() => {
    if (token) fetchServices();
  }, [token]);

  const updateRequestStatus = (id, newStatus) => {
    setServices((prev) =>
      prev.map((req) =>
        req._id === id ? { ...req, active: newStatus, isEnabled: true } : req
      )
    );
  };

  const handleAccept = async (serviceId) => {
    const service = services.find((s) => s._id === serviceId);
    const targetId = service?.serviceId?._id || service?._id;

    if (!targetId) {
      toast({
        title: "❌ Error",
        description: "Service ID missing.",
        variant: "destructive",
      });
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_SERVER}api/services/authorize`,
        {
          isAccepted: true,
          serviceId: targetId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      updateRequestStatus(serviceId, true);
      toast({
        title: "✅ Service Accepted",
        description: "The service has been accepted.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "❌ Error",
        description: "Failed to accept the request.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (serviceId) => {
    const service = services.find((s) => s._id === serviceId);
    const targetId = service?.serviceId?._id || service?._id;

    if (!targetId) {
      toast({
        title: "❌ Error",
        description: "Service ID missing.",
        variant: "destructive",
      });
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_SERVER}api/services/authorize`,
        {
          isAccepted: false,
          serviceId: targetId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      updateRequestStatus(serviceId, false);
      toast({
        title: "🚫 Service Rejected",
        description: "The service request has been rejected.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "❌ Error",
        description: "Failed to reject the request.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <AdminHeader />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Authorize Services</h1>
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-2 px-4 border-b">Service Name</th>
              <th className="py-2 px-4 border-b">Vendor</th>
              <th className="py-2 px-4 border-b">Description</th>
              <th className="py-2 px-4 border-b">Duration</th>
              <th className="py-2 px-4 border-b">Price</th>
              <th className="py-2 px-4 border-b  w-[300px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service._id} className="hover:bg-gray-100">
                <td className="py-2 px-4 border-b">{service.name}</td>
                <td className="py-2 px-4 border-b">{service.vendorId?.email}</td>
                <td className="py-2 px-4 border-b">{service.description}</td>
                <td className="py-2 px-4 border-b capitalize">{service.duration}</td>
                <td className="py-2 px-4 border-b font-bold">₹{service.price?.toFixed(2)}</td>
                <td className="py-2 px-4 border-b text-center w-[300px]">
                  {service.isEnabled === false ? (
                    <>
                      <button
                        onClick={() => handleAccept(service._id)}
                        className="bg-green-500 text-white px-4 py-1 rounded mr-2"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(service._id)}
                        className="bg-red-500 text-white px-4 py-1 rounded"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded text-white text-sm font-medium ${
                        service.active === true
                          ? 'bg-green-600'
                          : service.active === false
                          ? 'bg-red-600'
                          : 'bg-gray-500'
                      }`}
                    >
                      {service.active==true? "Accepted" : "Rejected"}
                    </span>
                  )}
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

export default AuthorizeServices;
