import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import FileUploader from '../components/FileUploader';
import ProcessingStatus from '../components/ProcessingStatus';
import DataVisualization from '../components/DataVisualization';
import CustomerDataDashboard from '../components/CustomerDataDashboard';
import Chatbot from '../components/Chatbot';
import { 
  Upload, 
  Database, 
  BarChart3, 
  MessageSquare,
  FileText,
  TrendingUp,
  Users,
  Bot
} from 'lucide-react';

const CustomerDataProcessing = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processingJobs, setProcessingJobs] = useState([]);

  const handleFilesUploaded = (files) => {
    setUploadedFiles(prev => [...prev, ...files]);
    setActiveTab('processing');
  };

  const handleProcessingComplete = (job) => {
    setProcessingJobs(prev => [...prev, job]);
  };

  const startProcessing = async () => {
    if (uploadedFiles.length === 0) return;

    try {
      const fileIds = uploadedFiles.map(file => file.id);
      
      const response = await fetch('/api/customer-data/process-customer-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ fileIds })
      });

      if (response.ok) {
        const result = await response.json();
        handleProcessingComplete(result.result);
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error('Processing failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Customer Data Analytics Platform
              </h1>
              <p className="mt-2 text-gray-600">
                Extract, transform, and analyze your customer data with AI-powered insights
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Database className="w-4 h-4" />
                <span>Files: {uploadedFiles.length}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>Processed: {processingJobs.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="processing" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Processing</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="chatbot" className="flex items-center space-x-2">
              <Bot className="w-4 h-4" />
              <span>AI Assistant</span>
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Upload Customer Data Files</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
                    <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Upload Your Customer Data Files
                    </h3>
                    <p className="text-blue-700 mb-4">
                      Support for CSV, Excel, JSON, XML, and PDF files
                    </p>
                    <div className="text-sm text-blue-600 space-y-1">
                      <p>• Customer master data (names, emails, addresses)</p>
                      <p>• Transaction records (purchases, payments)</p>
                      <p>• Product catalogs and category information</p>
                      <p>• Customer behavior and interaction data</p>
                    </div>
                  </div>

                  <FileUploader 
                    onFilesUploaded={handleFilesUploaded}
                    acceptedTypes="customer-data"
                  />

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold">Uploaded Files ({uploadedFiles.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {uploadedFiles.map((file, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-8 h-8 text-blue-600" />
                              <div className="flex-1">
                                <div className="font-medium">{file.name}</div>
                                <div className="text-sm text-gray-600">
                                  {file.size} • {file.type}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                      
                      <div className="flex justify-center">
                        <Button 
                          onClick={startProcessing}
                          size="lg"
                          className="px-8"
                        >
                          Process Customer Data
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Processing Tab */}
          <TabsContent value="processing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Data Processing Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProcessingStatus 
                  jobs={processingJobs}
                  onJobComplete={handleProcessingComplete}
                />
                
                {processingJobs.length === 0 && uploadedFiles.length > 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">
                      Ready to process {uploadedFiles.length} files
                    </div>
                    <Button onClick={startProcessing}>
                      Start Processing
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <CustomerDataDashboard />
          </TabsContent>

          {/* Visualization Tab */}
          <TabsContent value="visualization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Data Visualization & Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataVisualization type="customer-analytics" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chatbot Tab */}
          <TabsContent value="chatbot" className="space-y-6">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>AI Customer Data Assistant</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full p-0">
                <Chatbot />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Features Overview */}
      {activeTab === 'upload' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Powerful Customer Data Analytics
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Transform your raw customer data into actionable insights with our comprehensive analytics platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Multi-Format Support</h3>
              <p className="text-gray-600">
                Upload CSV, Excel, JSON, XML, and PDF files. Our system automatically detects and processes different data formats.
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-gray-600">
                Get customer segmentation, lifetime value analysis, purchase patterns, and predictive insights.
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
              <p className="text-gray-600">
                Ask questions about your customers using natural language. Get instant answers and recommendations.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDataProcessing;