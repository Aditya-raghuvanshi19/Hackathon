import { useState, useEffect } from 'react';
import { ArrowRight, Smartphone, Laptop, Tv, Headphones, Clock, Shield, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';


const Index = () => {
  const [loaded, setLoaded] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    setLoaded(true);
  }, []);

 


  return (
    <div className="min-h-screen flex flex-col">
      {(user?.isAdmin || user?.isVendor) ? (
        <AdminHeader/>
      ):(<Header />)
      }
        
        
        {/* Hero section */}
        <section className="relative min-h-[85vh] flex flex-col justify-center items-center text-center px-4 bg-gradient-to-b from-background to-background/95">
          <div className={`transition-all duration-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
           
            <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
              Expert file Management Services
            </h1>
           
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            {(!user?.isAdmin && !user?.isVendor) ? (
            <>
              <Button size="lg" asChild>
                <Link to={isAuthenticated ? "/repairs" : "/register"}>
                  {isAuthenticated ? "Explore service" : "Get Started"}
                </Link>
              </Button>
              
            </>
          ) : (
            <Button size="lg" asChild>
              <Link to={user?.isAdmin ? "/admin" : "/vendor"}>
                Go to Dashboard
              </Link>
            </Button>
          )}

            </div>
          </div>
          
          {/* Decorative gradient blob */}
          <div className="absolute -z-10 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </section>
        
        {/* Features section */}
       
        
      
      
        
        <Footer />
      </div>
    );
  };

export default Index;