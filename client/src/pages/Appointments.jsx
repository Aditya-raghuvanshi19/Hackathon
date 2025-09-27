import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { format } from "date-fns";

const fetchUserRepairs = async (token, userId) => {
  const response = await fetch(import.meta.env.VITE_BACKEND_SERVER+'api/repairs/user/'+userId, {
   
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch repairs');
  }
  const result = await response.json();
  console.log(userId);
  console.log(token);
  console.log(result);

  return result;
};

const Appointments = () => {
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState("10:00");
  const [repairId, setRepairId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const combinedDateTime = new Date(date);
  const [hours, minutes] = time.split(":");
  combinedDateTime.setHours(parseInt(hours), parseInt(minutes));
  const {
    data: repairs,
    isLoading: repairsLoading
  } = useQuery({
    queryKey: ['repairs', token],
    queryFn: () => fetchUserRepairs(token || '', user?._id),
    enabled: !!token,
  });

  const handleTimeChange = (e) => {
    setTime(e.target.value);
  };

  console.log("id is: "+user?._id);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!repairId || !date) {
      toast({
        title: "Missing information",
        description: "Please select a repair request and appointment date",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(import.meta.env.VITE_BACKEND_SERVER+'api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          repairRequestId: repairId,
          scheduledDateTime: combinedDateTime.toISOString(),
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to schedule appointment');
      }

      toast({
        title: "Appointment scheduled",
        description: "Your appointment has been scheduled successfully",
      });

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

  const availableRepairs = repairs?.filter(repair =>
    repair.status !== 'completed' && repair.status !== 'cancelled'
  );
  console.log("availableRepairs")
  console.log(availableRepairs)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Schedule an Appointment</h1>
          <p className="text-muted-foreground max-w-2xl">
            Choose a convenient time for your device repair
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>New Appointment</CardTitle>
              <CardDescription>
                Schedule a time for your repair service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Select Repair Request <span className="text-red-500">*</span>
                  </label>

                  {repairsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : availableRepairs?.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                      No active repair requests found. Please submit a repair request first.
                    </div>
                  ) : (
                    <Select
                      value={repairId}
                      onValueChange={setRepairId}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a repair request" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRepairs?.map((repair) => (
                          <SelectItem key={repair._id} value={repair._id}>
                            {repair.serviceId.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Select Date <span className="text-red-500">*</span>
                  </label>
                  <div className="border rounded-md p-2">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today || date.getDay() === 0;
                      }}
                      className="mx-auto"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="time" className="text-sm font-medium">
                    Select Time:
                  </label>
                  <input
                    id="time"
                    type="time"
                    value={time}
                    onChange={handleTimeChange}
                    className="border rounded-md p-2"
                  />
                </div>

                <div className="text-sm text-gray-600">
                  Selected: {format(combinedDateTime, "PPPp")}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Notes</label>
                  <Textarea
                    placeholder="Any special requirements or information about your device"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !date || !repairId}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    "Schedule Appointment"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking Information</CardTitle>
              <CardDescription>
                Our working hours and policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Working Hours</h3>
                <ul className="text-sm space-y-1">
                  <li className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 6:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Saturday</span>
                    <span>10:00 AM - 4:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Service Policies</h3>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Please arrive 10 minutes before your scheduled appointment</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Bring any relevant accessories with your device</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Back up your data before bringing in your device</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Cancellations should be made at least 24 hours in advance</span>
                  </li>
                </ul>
              </div>

              <div className="bg-muted p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <Clock size={16} className="mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Typical Service Duration</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Most repairs take 1-3 hours depending on the complexity. Some repairs may require
                  ordering parts which can extend the repair time.
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

export default Appointments;