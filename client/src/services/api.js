
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_BACKEND_SERVER + 'api';

// Helper function to get authorization header
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};



// API functions
export const apiService = {
    // Auth
    login: async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }

        return await response.json();
    },

    register: async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
        }

        return await response.json();
    },

    // Services
    getServices: async () => {
        const response = await fetch(`${API_BASE_URL}/services`, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch services');
        }

        return await response.json();
    },

    getServiceById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/services/${id}`, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch service');
        }

        return await response.json();
    },

    // Repair Requests
    getRepairRequests: async () => {
        const response = await fetch(`${API_BASE_URL}/repairs`, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch repair requests');
        }

        return await response.json();
    },

    getRepairRequestById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/repairs/${id}`, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch repair request');
        }

        return await response.json();
    },

    createRepairRequest: async (data) => {
        const response = await fetch(`${API_BASE_URL}/repairs`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create repair request');
        }

        return await response.json();
    },

    updateRepairRequest: async (id, data) => {
        const response = await fetch(`${API_BASE_URL}/repairs/${id}`, {
            method: 'PUT',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update repair request');
        }

        return await response.json();
    },

    // Payments
    getPayments: async () => {
        const response = await fetch(`${API_BASE_URL}/payments`, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch payments');
        }

        return await response.json();
    },

    getPaymentById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch payment');
        }

        return await response.json();
    },

    createPayment: async (data) => {
        const response = await fetch(`${API_BASE_URL}/payments`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create payment');
        }

        return await response.json();
    },

    // Appointments
    getAppointments: async () => {
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch appointments');
        }

        return await response.json();
    },

    createAppointment: async (data) => {
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create appointment');
        }

        return await response.json();
    },

    // Reviews
    getReviews: async () => {
        const response = await fetch(`${API_BASE_URL}/reviews`, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch reviews');
        }

        return await response.json();
    },

    createReview: async (data) => {
        const response = await fetch(`${API_BASE_URL}/reviews`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create review');
        }

        return await response.json();
    },
};
