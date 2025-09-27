import React, { useEffect, useState } from 'react';
import AdminHeader from '@/components/ui/AdminHeader';
import Footer from '@/components/Footer';

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(import.meta.env.VITE_BACKEND_SERVER+'api/reviews/getReviews')
      .then(res => res.json())
      .then(data => {
          setReviews(data);
          console.log(data)
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching reviews:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4 text-gray-600">Loading reviews...</div>;

    return (
        <>
         <AdminHeader/>
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Reviews</h1>
      {reviews.map((review) => (
        <div key={review._id} className="mb-4 p-4 border rounded-xl shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-lg">{review.userId?.email || 'Anonymous'}</div>
            <div className="text-yellow-500">⭐ {review.rating}/5</div>
          </div>
          <div className="text-gray-700 mt-2">{review.comment}</div>
          <div className="text-sm text-gray-400 mt-1">
            {new Date(review.createdAt).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mt-1 italic">
                  For: {review.serviceId?.name || 'Unknown Service'}
          </div>
          <div className="text-sm text-gray-500 mt-1 italic">
                  Vendor: { review.serviceId?.vendorId?.email || 'Unknown'} 
          </div>
                  
        </div>
      ))}
            </div>
            <Footer/>
      </>
  );
};

export default ReviewsPage;
