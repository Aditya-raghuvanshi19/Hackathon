import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {

  const server = `https://electronic-repair-server.vercel.app/api`;
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', description: '' });
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    fetchServices();
    fetchPendingRequests();
  }, []);

  const fetchServices = async () => {
    const response = await axios.get('/api/services');
    setServices(response.data);
  };

  const fetchPendingRequests = async () => {
    const response = await axios.get('/api/pending-requests');
    setPendingRequests(response.data);
  };

  const addService = async () => {
    if (!newService.name || !newService.description || !newService.price || !newService.duration) {
      setError('All fields are required.');
      return;
    }
   
    try {
      await axios.post(`${server}/services/create`, newService);
      fetchServices();
      setNewService({ name: '', description: '', price: '', duration: '' });
    } catch (err) {
      
      console.error(err);
    }
  };

  const markAsCompleted = async (id) => {
    await axios.put(`/api/pending-requests/${id}`, { status: 'completed' });
    fetchPendingRequests();
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div>
        <h2>Add New Service</h2>
        
        <input
          type="text"
          placeholder="Service Name"
          value={newService.name}
          onChange={(e) => setNewService({ ...newService, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Service Description"
          value={newService.description}
          onChange={(e) => setNewService({ ...newService, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Service Price"
          value={newService.price}
          onChange={(e) => setNewService({ ...newService, price: e.target.value })}
        />
        <input
          type="number"
          placeholder="Service Duration (mins)"
          value={newService.duration}
          onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
        />
        <button onClick={addService}> 'Add Service'</button>
      </div>
      
    </div>
  );
};

export default AdminDashboard;