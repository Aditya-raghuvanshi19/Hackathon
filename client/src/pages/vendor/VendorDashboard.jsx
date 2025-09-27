import { useState } from 'react';
import AdminHeader from '@/components/ui/AdminHeader';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

import { Link } from 'react-router-dom';

import AllServices from '@/pages/admin/AllServices';
import { useToast } from "@/components/ui/use-toast";

import { FaPlusCircle  , FaClipboardCheck, FaCalendarCheck, FaStar, FaCheckCircle } from 'react-icons/fa';
import { FcServices } from "react-icons/fc";


export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const server = `https://electronic-repair-server.vercel.app/api`;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: '',
    duration: ''
    
  });




  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
    try {
      const payload = {
      ...formData,
      vendorId: user._id, // inject vendorId here directly
    };

    const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}api/services/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();  // ✅ Await response.json()
    toast({
      title: "🎉 Service Added Successfully!",
      description: "Your new service has been added and is now available.",
      status: "success",
      duration: 5000,
      isClosable: true,
    });

    console.log(result)
    
  } catch (err) {
    console.error("Error:", err);
  }

  
  setIsModalOpen(false);
};


  return (
    <>
      <AdminHeader/>
   <div className="admin-dashboard p-4">
    <h1 className="text-2xl font-bold mb-6">Technician Dashboard</h1>

    {/* Technician Message/Quotes Section */}
    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-6 m-12 shadow-md">
      <p className="text-gray-700 italic">
        "Your expertise keeps everything running smoothly 🔧 — thank you for your dedication on the ground!"
      </p>
      <p className="text-gray-600 text-sm mt-2">
        Today's Focus: Complete scheduled repairs and review any new assignments.
      </p>
    </div>
  

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 m-24">
        {/* Add Services Card */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="text-center">
            <FaPlusCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Add Services</h3>
            <p className="text-gray-600 mb-4">Add new services to the platform</p>
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors"
              onClick={() => setIsModalOpen(true)}
            >
              Add Services
            </button>
          </div>
        </div>

        {/* Remove Services Card */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="text-center">
            <FcServices className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">All Services</h3>
            <p className="text-gray-600 mb-4">Manage existing services and removals</p>
            <Link to="/vendor/all-services">
           <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md">
             View All Services
           </button>
          </Link>
          </div>
        </div>

        {/* Service Requests Card */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="text-center">
            <FaClipboardCheck className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-600 mb-2">Service Requests</h3>
            <p className="text-gray-600 mb-4">View and manage service requests</p>
            <Link to="/vendor/all-repairs"> 
            <button 
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition-colors"
              
            >
              Check All Requests
            </button>
            </Link>
          </div>
          </div>

       
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="text-center">
          <FaStar className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-500 mb-2">Reviews</h3>
          <p className="text-gray-600 mb-4">View and manage reviews</p>
          <Link to="/admin/all-reviews">
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md transition-colors">
              Check All Reviews
            </button>
          </Link>
        </div>
          </div>
          
           {/* Service Requests Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-shadow">
          <div className="text-center">
            <FaCheckCircle className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-indigo-700 mb-2">Requests History</h3>
            <p className="text-gray-600 mb-4">Easily access all service requests history</p>
            <Link to="/vendor/request-history">
              <button
                className="bg-indigo-500 hover:bg-violet-600 text-white font-medium px-6 py-2 rounded-md transition-all shadow-sm hover:shadow-md"
              >
                View History
              </button>
            </Link>
          </div>
        </div>
          
       

      {/* Reviews */}
      
      </div>

      {/* Add Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Service</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    rows="3"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
       <Footer/>
    </>
  );
}