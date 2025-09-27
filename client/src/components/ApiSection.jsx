
import { useEffect, useRef } from 'react';
import Endpoint from './Endpoint';
import { ApiCategory, Endpoint as EndpointType } from '../lib/data';



const ApiSection = ({ category, endpoints }) => {
  const sectionRef = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  
  return (
    <section 
      id={category.id} 
      className="py-16 opacity-0 transition-all duration-700" 
      ref={sectionRef}
    >
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <span className="inline-block text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            API
          </span>
          <h2 className="text-3xl font-bold mb-4">{category.title}</h2>
          <p className="text-muted-foreground max-w-3xl">{category.description}</p>
        </div>
        
        <div>
          {endpoints.map((endpoint, index) => (
            <Endpoint key={endpoint.id} endpoint={endpoint} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ApiSection;
