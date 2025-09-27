
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';



const fetchServices = async () => {
  const response = await fetch(import.meta.env.VITE_BACKEND_SERVER+'api/services');
  if (!response.ok) {
    throw new Error('Failed to fetch services');
  }
  return response.json();
};

const RepairRequests = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [serviceId, setServiceId] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }

    // Check if we have a service ID from another page
    if (location.state?.serviceId) {
      setServiceId(location.state.serviceId);
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!serviceId || !description) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(import.meta.env.VITE_BACKEND_SERVER+'api/repairs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId,
          description,
          estimatedCost: parseFloat(estimatedCost || '0'),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit repair request');
      }

      toast({
        title: "Request submitted",
        description: "Your repair request has been submitted successfully",
      });

      // Redirect to dashboard
      navigate('/dashboard');

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
          <h1 className="text-3xl font-bold mb-2">Submit Repair Request</h1>
          <p className="text-muted-foreground max-w-2xl">
            Fill out the form below to submit a repair request. Our team will review
            your request and reach out to schedule an appointment.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Repair Request Form</CardTitle>
            <CardDescription>
              Provide details about your device and the issues you're experiencing
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="service" className="text-sm font-medium">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <Select
                  value={serviceId}
                  onValueChange={setServiceId}
                  disabled={isLoading || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map((service) => (
                      <SelectItem
                        key={service._id}
                        value={service._id}
                        disabled={!service.active}
                      >
                        {service.name} - ${service.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="description"
                  placeholder="Please describe the issue with your device in detail..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="estimatedCost" className="text-sm font-medium">
                  Your Budget (optional)
                </label>
                <Input
                  id="estimatedCost"
                  type="number"
                  placeholder="Your estimated budget for repairs"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Actual cost may vary based on diagnosis
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default RepairRequests;
