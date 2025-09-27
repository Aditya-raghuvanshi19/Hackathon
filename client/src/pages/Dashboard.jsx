import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CreditCard, Wrench, ArrowRight } from 'lucide-react';

const fetchUserRepairs = async (token, userId) => {
  const response = await fetch(`https://electronic-repair-server.vercel.app/api/repairs/user/${userId}`, {
    headers: {
      method: "GET",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch repairs');
  }

  return response.json();
};

const fetchUserAppointments = async (token) => {
  const response = await fetch(import.meta.env.VITE_BACKEND_SERVER+'api/appointments', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch appointments');
  }

  return response.json();
};

const fetchUserPayments = async (token, userId) => {
  const response = await fetch(`https://electronic-repair-server.vercel.app/api/payments/user/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch payments');
  }

  return response.json();
};

const Dashboard = () => {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const {
    data: repairs,
    isLoading: repairsLoading
  } = useQuery({
    queryKey: ['repairs', token],
    queryFn: () => fetchUserRepairs(token || '', user._id || ''),
    enabled: !!token,
  });

  const {
    data: appointments,
    isLoading: appointmentsLoading
  } = useQuery({
    queryKey: ['appointments', token],
    queryFn: () => fetchUserAppointments(token || ''),
    enabled: !!token,
  });

  const {
    data: payments,
    isLoading: paymentsLoading
  } = useQuery({
    queryKey: ['payments', token],
    queryFn: () => fetchUserPayments(token || '', user._id || ''),
    enabled: !!token,
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'unpaid':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

     

      <Footer />
    </div>
  );
};

export default Dashboard;