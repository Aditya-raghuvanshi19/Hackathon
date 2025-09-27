
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

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
              src="data:image/png;base64,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"
              alt="Logo"
              className="h-8 w-11" // Adjust the height and width as needed
            />
            <div
              className={`text-xl font-bold bg-clip-text ${
                scrolled ? 'text-primary' : 'text-foreground'
              } transition-all-slow`}
            >
              File Management
            </div>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              
              <>
                <Button variant="ghost" size="sm" asChild>
                  
                      <Link to="/dashboard" className="flex items-center space-x-1">
                        <User size={16} />
                        <span>Dashboard</span>
                      </Link>
                   
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
