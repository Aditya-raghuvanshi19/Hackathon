import { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  TrendingUp, 
  Users, 
  ShoppingCart,
  DollarSign,
  Lightbulb,
  Clock,
  Sparkles
} from 'lucide-react';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  // Initial welcome message
  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'bot',
      content: "Hi! I'm your customer data assistant. Ask me anything about your customers, analytics, or trends!",
      timestamp: new Date(),
      suggestions: [
        'Show me analytics',
        'Top 10 customers',
        'Sales trends',
        'Give me recommendations'
      ]
    };
    setMessages([welcomeMessage]);
    loadSuggestions();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSuggestions = async () => {
    try {
      const response = await fetch('/api/chatbot/suggestions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const sendMessage = async (message = inputValue) => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.message,
        timestamp: new Date(),
        data: data.data,
        visualData: data.visualData,
        suggestions: data.suggestions,
        success: data.success
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
        success: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chatbot/quick-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      const actionMessage = {
        id: Date.now(),
        type: 'user',
        content: `Quick Action: ${action.replace('-', ' ').toUpperCase()}`,
        timestamp: new Date()
      };

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.message,
        timestamp: new Date(),
        data: data.data,
        visualData: data.visualData,
        success: data.success
      };

      setMessages(prev => [...prev, actionMessage, botMessage]);
    } catch (error) {
      console.error('Quick action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderVisualization = (visualData) => {
    if (!visualData) return null;

    switch (visualData.type) {
      case 'customer-profile':
        return (
          <Card className="mt-2 p-4 bg-blue-50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Customer ID: {visualData.customer.customerId}</p>
                <p>Name: {visualData.customer.customerInfo?.name || 'N/A'}</p>
                <p>Email: {visualData.customer.customerInfo?.email || 'N/A'}</p>
              </div>
              <div>
                <p>Total Spent: ${visualData.customer.analytics?.totalSpent?.toFixed(2) || '0.00'}</p>
                <p>Transactions: {visualData.customer.analytics?.totalTransactions || 0}</p>
                <p>Segment: {visualData.customer.analytics?.customerSegment || 'N/A'}</p>
              </div>
            </div>
          </Card>
        );

      case 'top-customers':
        return (
          <Card className="mt-2 p-4 bg-green-50">
            <h4 className="font-semibold mb-2 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Top Customers
            </h4>
            <div className="space-y-2">
              {visualData.customers?.slice(0, 5).map((customer, index) => (
                <div key={customer._id} className="flex justify-between items-center">
                  <span className="font-medium">
                    #{index + 1} {customer.customerInfo?.name || customer.customerId}
                  </span>
                  <Badge variant="outline">
                    ${customer.analytics?.totalSpent?.toFixed(2) || '0.00'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        );

      case 'analytics-dashboard':
        return (
          <Card className="mt-2 p-4 bg-purple-50">
            <h4 className="font-semibold mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics Overview
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {visualData.overview?.totalCustomers || 0}
                </p>
                <p className="text-sm text-gray-600">Total Customers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  ${visualData.overview?.totalRevenue?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {visualData.overview?.totalTransactions || 0}
                </p>
                <p className="text-sm text-gray-600">Total Transactions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  ${visualData.overview?.avgOrderValue?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-600">Avg Order Value</p>
              </div>
            </div>
          </Card>
        );

      default:
        return (
          <Card className="mt-2 p-4 bg-gray-50">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(visualData, null, 2)}
            </pre>
          </Card>
        );
    }
  };

  const quickActions = [
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'top-customers', label: 'Top Customers', icon: Users },
    { id: 'sales-trends', label: 'Sales Trends', icon: ShoppingCart },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb }
  ];

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Customer Data Assistant</h2>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Sparkles className="w-3 h-3" />
          <span>AI Powered</span>
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-2 ${
                message.type === 'user' ? 'justify-end' : ''
              }`}
            >
              {message.type === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
              )}
              
              <div className={`max-w-md ${message.type === 'user' ? 'order-first' : ''}`}>
                <Card className={`p-3 ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : message.success === false 
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  
                  {message.visualData && renderVisualization(message.visualData)}
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => sendMessage(suggestion)}
                          className="text-xs"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </Card>
                
                <div className="flex items-center mt-1 space-x-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-green-600" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <Card className="p-3 bg-gray-50">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                  </div>
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      {messages.length === 1 && (
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Quick Actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.id)}
                  disabled={isLoading}
                  className="flex items-center space-x-1"
                >
                  <Icon className="w-3 h-3" />
                  <span>{action.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about your customers, analytics, or trends..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={() => sendMessage()}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Suggestions:</span>
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => sendMessage(suggestion)}
                className="text-xs h-6 px-2"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatbot;