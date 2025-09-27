import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download,
  Filter,
  Search,
  RefreshCw,
  Calendar,
  FileText,
  Database
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const DataVisualization = ({ fileId }) => {
  const [data, setData] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (fileId) {
      fetchData();
      fetchMetrics();
    }
  }, [fileId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_SERVER}api/data-processing/files/${fileId}`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result.file);
      setProcessedData(result.processedData);
    } catch (error) {
      console.error('Fetch data error:', error);
      setError(error.message);
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

      const result = await response.json();
      setMetrics(result);
    } catch (error) {
      console.error('Fetch metrics error:', error);
    }
  };

  const exportData = async (format) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_SERVER}api/data-processing/files/${fileId}/export?format=${format}`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `export_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Data exported as ${format.toUpperCase()} file`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const generateChartData = (data, field) => {
    if (!data || !Array.isArray(data)) return [];

    const counts = {};
    data.forEach(row => {
      const value = row[field];
      counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts).map(([key, value]) => ({
      name: key || 'Empty',
      value
    }));
  };

  const generateTimeSeriesData = (data, dateField, valueField) => {
    if (!data || !Array.isArray(data)) return [];

    return data
      .filter(row => row[dateField] && row[valueField])
      .map(row => ({
        date: new Date(row[dateField]).toLocaleDateString(),
        value: parseFloat(row[valueField]) || 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getNumericColumns = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    
    const firstRow = data[0];
    return Object.keys(firstRow).filter(key => {
      const value = firstRow[key];
      return !isNaN(parseFloat(value)) && isFinite(value);
    });
  };

  const getCategoricalColumns = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    
    const firstRow = data[0];
    return Object.keys(firstRow).filter(key => {
      const value = firstRow[key];
      return isNaN(parseFloat(value)) || !isFinite(value);
    });
  };

  const getDateColumns = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    
    const firstRow = data[0];
    return Object.keys(firstRow).filter(key => {
      const value = firstRow[key];
      return !isNaN(Date.parse(value));
    });
  };

  const filteredData = processedData?.data?.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading data...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          No data available for visualization.
        </AlertDescription>
      </Alert>
    );
  }

  const numericColumns = getNumericColumns(filteredData);
  const categoricalColumns = getCategoricalColumns(filteredData);
  const dateColumns = getDateColumns(filteredData);

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Data Visualization & Analytics
              </CardTitle>
              <CardDescription>
                {data.originalName} • {data.metadata?.totalRows || 0} rows • {data.metadata?.columns?.length || 0} columns
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportData('json')}>
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Label htmlFor="search">Search in data</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search across all columns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredData.length} of {processedData?.data?.length || 0} rows
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="data">Data Table</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{data.metadata?.totalRows || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Rows</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{data.metadata?.columns?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Columns</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{numericColumns.length}</p>
                    <p className="text-sm text-muted-foreground">Numeric Fields</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{dateColumns.length}</p>
                    <p className="text-sm text-muted-foreground">Date Fields</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Quality Metrics */}
          {processedData?.metrics && (
            <Card>
              <CardHeader>
                <CardTitle>Data Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Data Quality Score</span>
                      <span>{processedData.metrics.dataQualityScore}%</span>
                    </div>
                    <Progress value={processedData.metrics.dataQualityScore} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completeness Score</span>
                      <span>{processedData.metrics.completenessScore}%</span>
                    </div>
                    <Progress value={processedData.metrics.completenessScore} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Accuracy Score</span>
                      <span>{processedData.metrics.accuracyScore}%</span>
                    </div>
                    <Progress value={processedData.metrics.accuracyScore} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          {categoricalColumns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribution Charts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {categoricalColumns.slice(0, 4).map(column => {
                    const chartData = generateChartData(filteredData, column);
                    return (
                      <div key={column}>
                        <h4 className="text-sm font-medium mb-2">{column}</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <RechartsPieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {numericColumns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Numeric Data Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {numericColumns.slice(0, 2).map(column => (
                    <div key={column}>
                      <h4 className="text-sm font-medium mb-2">{column}</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={filteredData.slice(0, 50)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="index" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey={column} fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {dateColumns.length > 0 && numericColumns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Time Series Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateTimeSeriesData(filteredData, dateColumns[0], numericColumns[0])}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Data Table Tab */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Table</CardTitle>
              <CardDescription>
                Showing {Math.min(50, filteredData.length)} of {filteredData.length} rows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full">
                {filteredData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(filteredData[0]).map(column => (
                          <TableHead key={column} className="whitespace-nowrap">
                            {column}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.slice(0, 50).map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value, cellIndex) => (
                            <TableCell key={cellIndex} className="whitespace-nowrap">
                              {String(value)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No data to display
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>File Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">File Size:</span>
                    <p className="text-muted-foreground">{(data.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div>
                    <span className="font-medium">File Type:</span>
                    <p className="text-muted-foreground">{data.fileType.toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Uploaded:</span>
                    <p className="text-muted-foreground">{new Date(data.uploadedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge variant={data.processingStatus === 'completed' ? 'success' : 'secondary'}>
                      {data.processingStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation Results */}
            {processedData?.validationResults && (
              <Card>
                <CardHeader>
                  <CardTitle>Validation Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {processedData.validationResults.slice(0, 5).map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="text-sm font-medium">{result.field}</span>
                          <p className="text-xs text-muted-foreground">{result.rule}</p>
                        </div>
                        <Badge variant={result.status === 'valid' ? 'success' : 'destructive'}>
                          {result.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataVisualization;