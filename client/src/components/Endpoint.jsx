
import { useState } from 'react';
import { ChevronDown, ChevronUp, Lock } from 'lucide-react';
import CodeBlock from './CodeBlock';
import { Endpoint as EndpointType, baseUrl } from '../lib/data';
import { Badge } from '@/components/ui/badge';



const Endpoint = ({ endpoint, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const methodClass = `method-${endpoint.method.toLowerCase()}`;

  // Animation delay based on index
  const animationDelay = `${index * 0.1}s`;

  const requestBodyCode = endpoint.requestBody 
    ? JSON.stringify(
        Object.fromEntries(
          Object.entries(endpoint.requestBody).map(([key, value]) => [
            key,
            value.type
          ])
        ),
        null,
        2
      )
    : '';
  
  const fullPath = `${baseUrl}${endpoint.path}`;

  return (
    <div 
      className="border border-border rounded-lg overflow-hidden hover-scale mb-6 opacity-0 animate-fade-in"
      style={{ animationDelay }}
    >
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-4">
          <Badge className={`font-mono text-xs px-3 py-0.5 ${methodClass}`}>
            {endpoint.method}
          </Badge>
          <h3 className="text-lg font-semibold">{endpoint.title}</h3>
          {endpoint.authentication && (
            <div className="flex items-center text-muted-foreground">
              <Lock size={12} className="mr-1" />
              <span className="text-xs">Auth required</span>
            </div>
          )}
        </div>
        <div className="flex items-center">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>
      
      {isOpen && (
        <div className="p-4 border-t border-border animate-fade-in">
          <div className="mb-4">
            <p className="text-muted-foreground mb-2">{endpoint.description}</p>
            <div className="bg-muted/50 rounded-md px-3 py-2 font-mono text-sm overflow-x-auto">
              {fullPath}
            </div>
          </div>
          
          {endpoint.authentication && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Authentication</h4>
              <div className="bg-muted/50 rounded-md px-3 py-2 font-mono text-xs">
                Authorization: Bearer &lt;token&gt;
              </div>
            </div>
          )}
          
          {endpoint.requestBody && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Request Body</h4>
              <CodeBlock 
                code={requestBodyCode} 
                title="application/json"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {Object.entries(endpoint.requestBody).map(([key, value]) => (
                  <div key={key} className="bg-muted/30 p-3 rounded-md">
                    <div className="font-semibold font-mono text-xs">{key}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span>{value.type}</span>
                      {value.required && (
                        <span className="text-red-500 ml-1">(required)</span>
                      )}
                    </div>
                    {value.description && (
                      <div className="text-xs mt-1">{value.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-semibold mb-2">Response: {endpoint.responseBody}</h4>
            <CodeBlock 
              code={endpoint.responseExample} 
              title="application/json"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Endpoint;
