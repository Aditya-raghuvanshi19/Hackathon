import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, DollarSign } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

const AllServiceCard = ({ service }) => {
  
  
const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const handleRequestRepair = () => {
    if (isAuthenticated) {
      navigate('/repairs', { state: { serviceId: service._id } });
    } else {
      navigate('/login');
    }
  };

  const handleRemoveService = async (service_id, token) => {
    try {
      var route = `${import.meta.env.VITE_BACKEND_SERVER}api/services/${service_id}`
      if (user?.isVendor) {
        route = `${import.meta.env.VITE_BACKEND_SERVER}api/services/vendor/${service_id}`
      }
      const response = await fetch(route, {
        method: "delete",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }) 
      const result = await response.json();
      console.log(result)
      toast({
        title: "Done!",
        description: result.message,
      });
       window.location.reload();
    } catch (e) {
      console.log(e)
    }
  }
  

  const handleViewService = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{service.name}</CardTitle>
            {service.active === false && (
              <Badge variant="outline" className="text-muted-foreground">
                Currently Unavailable
              </Badge>
            )}
          </div>
          <CardDescription>{service.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="flex space-x-4">
            <div className="flex items-center text-muted-foreground">
             
              <span>₹{service.price.toFixed(2)}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Clock className="mr-1 h-4 w-4" />
              <span>{service.duration} mins</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleViewService}
            className="w-half bg-green-500"
            disabled={service.active === false}
          >
            View Service
          </Button>
          <Button
            onClick={() => {
              handleRemoveService(service._id, token)
            }
            }
            className="w-half m-5 bg-red-500"
            disabled={service.active === false}
          >
            Remove Service
          </Button>
        </CardFooter>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-1/3">
            <h2 className="text-xl font-bold">{service.name}</h2>
            <p className="mt-2">{service.description}</p>
            <p className="mt-2">
              <strong>Price:</strong> ₹{service.price.toFixed(2)}
            </p>
            <p className="mt-2">
              <strong>Duration:</strong> {service.duration} mins
            </p>
            <div className="mt-4 flex justify-end">
              <Button onClick={closeModal} className="bg-blue-500 text-white">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllServiceCard;