
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import AllServices from '../../pages/admin/AllServices';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all-slow py-4 px-8 ${
        scrolled ? 'glass-effect shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <img
              src="../assets/repair_ninja_logo.png"
              alt="Repair Ninja Logo"
              className="h-8 w-11" // Adjust the height and width as needed
            />
            <div
              className={`text-xl font-bold bg-clip-text ${
                scrolled ? 'text-primary' : 'text-foreground'
              } transition-all-slow`}
            >
              Repair Ninja
            </div>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <nav className="flex space-x-6">
            
            {isAuthenticated && (
              <>
               
                <Link to="/payments" className="text-sm font-medium hover:text-primary transition-colors">
                  Payments
                </Link>
                
              </>
            )}
          </nav>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              
              <>
                <Button variant="ghost" size="sm" asChild>
                  {user?.isAdmin ? (
                      <Link to="/admin" className="flex items-center space-x-1">
                        <User size={16} />
                        <span>Dashboard</span>
                      </Link>
                    ) : user?.isVendor ? (
                      <Link to="/vendor" className="flex items-center space-x-1">
                        <User size={16} />
                        <span>Dashboard</span>
                      </Link>
                    ) : (
                      <Link to="/dashboard" className="flex items-center space-x-1">
                        <User size={16} />
                        <span>Dashboard</span>
                      </Link>
                    )}
                  
                  

                </Button>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background pt-16 px-4 flex flex-col md:hidden animate-in slide-in-from-top-10">
          <nav className="flex flex-col space-y-6 pt-8">
            <Link to="/" className="text-lg font-medium" onClick={closeMenu}>
              Home
            </Link>
            <Link to="/services" className="text-lg font-medium" onClick={closeMenu}>
              Services
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/repairs" className="text-lg font-medium" onClick={closeMenu}>
                  Repairs
                </Link>
                <Link to="/appointments" className="text-lg font-medium" onClick={closeMenu}>
                  Appointments
                </Link>
                <Link to="/payments" className="text-lg font-medium" onClick={closeMenu}>
                  Payments
                </Link>
                <Link to="/reviews" className="text-lg font-medium" onClick={closeMenu}>
                  Reviews
                </Link>
              </>
            )}
          </nav>
          
          <div className="mt-auto pb-10 flex flex-col space-y-4">
            {isAuthenticated ? (
              <>
                <Button variant="outline" size="lg" asChild className="w-full">
                  <Link to="/dashboard" onClick={closeMenu}>
                    Dashboard
                  </Link>
                </Button>
                <Button variant="default" size="lg" className="w-full" onClick={() => {
                  logout();
                  closeMenu();
                }}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="lg" asChild className="w-full">
                  <Link to="/login" onClick={closeMenu}>
                    Login
                  </Link>
                </Button>
                <Button variant="default" size="lg" asChild className="w-full">
                  <Link to="/register" onClick={closeMenu}>
                    Register
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
