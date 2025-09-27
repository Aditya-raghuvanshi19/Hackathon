import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';



const fetchServices = async () => {
  const response = await fetch(import.meta.env.VITE_BACKEND_SERVER+'api/services');
  if (!response.ok) {
    throw new Error('Failed to fetch services');
  }
  return response.json();
};

const Services = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
  });

  const filteredServices = services?.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Our Repair Services</h1>
          <p className="text-muted-foreground max-w-3xl">
            Browse our comprehensive range of electronic repair services.
            From smartphones to laptops, we've got you covered.
          </p>
        </div>

        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                <Skeleton className="h-[250px]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-muted rounded-lg">
            <p className="text-lg font-medium">Failed to load services</p>
            <p className="text-muted-foreground">Please try again later</p>
          </div>
        ) : filteredServices?.length === 0 ? (
          <div className="p-8 text-center bg-muted rounded-lg">
            <p className="text-lg font-medium">No services found</p>
            <p className="text-muted-foreground">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices?.map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Services;
