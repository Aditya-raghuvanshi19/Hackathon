import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Upload, 
  BarChart3, 
  Settings, 
  FileText, 
  Search,
  Filter,
  RefreshCw,
  Eye,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Import our data processing components
import FileUploader from '@/components/data-processing/FileUploader';
import ProcessingStatus from '@/components/data-processing/ProcessingStatus';
import DataVisualization from '@/components/data-processing/DataVisualization';

const DataProcessingDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [files, setFiles] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchFiles();
    fetchMetrics();
  }, [user, navigate]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_SERVER}api/data-processing/files`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Fetch files error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_SERVER}api/data-processing/metrics`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Fetch metrics error:', error);
    }
  };

  const handleUploadComplete = (result) => {
    // Refresh the files list
    fetchFiles();
    fetchMetrics();
    
    // Switch to files tab and select the new file
    setActiveTab('files');
    setTimeout(() => {
      setSelectedFile(result.fileId);
    }, 1000);
  };

  const handleFileSelect = (fileId) => {
    setSelectedFile(fileId);
    setActiveTab('visualization');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = !searchTerm || 
      file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.fileType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || file.processingStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Database className="w-8 h-8 text-primary" />
                Data Processing & Visualization
              </h1>
              <p className="text-muted-foreground mt-2">
                Automated data extraction, transformation, and visualization platform
              </p>
            </div>
            
            <Button 
              variant="outline"
              onClick={() => { fetchFiles(); fetchMetrics(); }}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Overview */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{metrics.totalFiles}</p>
                    <p className="text-sm text-muted-foreground">Total Files</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{metrics.processedFiles}</p>
                    <p className="text-sm text-muted-foreground">Processed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{metrics.failedFiles}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {(metrics.totalDataSize / 1024 / 1024).toFixed(1)} MB
                    </p>
                    <p className="text-sm text-muted-foreground">Total Data</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Visualization
            </TabsTrigger>
            <TabsTrigger value="processing" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Processing
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <FileUploader onUploadComplete={handleUploadComplete} />
            
            {/* Recent Jobs */}
            {metrics?.recentJobs && metrics.recentJobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Processing Jobs</CardTitle>
                  <CardDescription>Latest data processing activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.recentJobs.map((job, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{job.jobType}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.inputFiles?.length || 0} files • {new Date(job.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>File Management</CardTitle>
                <CardDescription>Manage your uploaded and processed data files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-4 items-center">
                  <div className="flex-1 relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search files..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Files Table */}
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading files...
                  </div>
                ) : filteredFiles.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFiles.map((file) => (
                        <TableRow key={file._id}>
                          <TableCell className="font-medium">{file.originalName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{file.fileType.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(file.processingStatus)}>
                              {file.processingStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(file.uploadedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFileSelect(file._id)}
                                disabled={file.processingStatus !== 'completed'}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      No files found. Upload some files to get started.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visualization Tab */}
          <TabsContent value="visualization" className="space-y-6">
            {selectedFile ? (
              <DataVisualization fileId={selectedFile} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No File Selected</h3>
                    <p className="text-muted-foreground mb-4">
                      Select a processed file from the Files tab to view its visualization.
                    </p>
                    <Button onClick={() => setActiveTab('files')}>
                      Browse Files
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Processing Tab */}
          <TabsContent value="processing" className="space-y-6">
            {selectedFile ? (
              <ProcessingStatus fileId={selectedFile} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <Settings className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No File Selected</h3>
                    <p className="text-muted-foreground mb-4">
                      Select a file from the Files tab to view its processing status.
                    </p>
                    <Button onClick={() => setActiveTab('files')}>
                      Browse Files
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default DataProcessingDashboard;