
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Star, Loader2 } from 'lucide-react';



const fetchServices = async () => {
  const response = await fetch(import.meta.env.VITE_BACKEND_SERVER+'api/services');
  if (!response.ok) {
    throw new Error('Failed to fetch services');
  }
  return response.json();
};

const Reviews = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [serviceId, setServiceId] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!serviceId || !rating || !comment) {
      toast({
        title: "Missing information",
        description: "Please fill out all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(import.meta.env.VITE_BACKEND_SERVER+'api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId,
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit review');
      }

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });

      // Reset form
      setServiceId('');
      setRating(0);
      setComment('');

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Leave a Review</h1>
          <p className="text-muted-foreground max-w-2xl">
            Share your experience with our repair services
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Review</CardTitle>
              <CardDescription>
                Your feedback helps us improve our services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Select Service <span className="text-red-500">*</span>
                  </label>

                  {servicesLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={serviceId}
                      onValueChange={setServiceId}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services?.map((service) => (
                          <SelectItem key={service._id} value={service._id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="p-1"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        disabled={isSubmitting}
                      >
                        <Star
                          className={`h-8 w-8 ${(hoveredRating ? hoveredRating >= star : rating >= star)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-muted-foreground'
                            }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Your Review <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Share your experience with our repair service..."
                    rows={6}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Why Leave a Review?</CardTitle>
              <CardDescription>
                Your feedback matters to us
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Help Others Make Decisions</h3>
                  <p className="text-sm text-muted-foreground">
                    Your honest review helps other customers choose the right service for their needs.
                  </p>
                </div>

                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Improve Our Services</h3>
                  <p className="text-sm text-muted-foreground">
                    Your feedback helps us identify areas where we can improve and better serve our customers.
                  </p>
                </div>

                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Recognize Our Team</h3>
                  <p className="text-sm text-muted-foreground">
                    Positive reviews motivate our technicians and staff to continue providing excellent service.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-md">
                <p className="text-sm italic text-center">
                  "We strive to provide the best repair service possible. Your feedback
                  is essential in helping us achieve this goal."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Reviews;
