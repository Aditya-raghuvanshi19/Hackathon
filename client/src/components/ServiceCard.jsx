
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, DollarSign } from 'lucide-react';



const ServiceCard = ({ service }) => {
  console.log(service)
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleRequestRepair = () => {
    if (isAuthenticated) {
      navigate('/repairs', { state: { serviceId: service._id } });
    } else {
      navigate('/login');
    }
  };

  return (
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
        <div className='text-muted-foreground'> Vendor: {service?.vendorId.email }</div>
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
          onClick={handleRequestRepair}
          className="w-full"
          disabled={service.active === false}
        >
          Request Repair
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;
