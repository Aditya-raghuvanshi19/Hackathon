import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Users, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  PieChart,
  BarChart3
} from 'lucide-react';

const CustomerDataDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  // Load dashboard data
  useEffect(() => {
    loadAnalytics();
    loadCustomers();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/customer-data/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const loadCustomers = async (page = 1, search = searchTerm, segment = selectedSegment) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(segment && { segment })
      });

      const response = await fetch(`/api/customer-data/customers?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
        setPagination({
          currentPage: data.currentPage || 1,
          totalPages: data.totalPages || 1,
          total: data.total || 0
        });
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadCustomers(1, searchTerm, selectedSegment);
  };

  const handlePageChange = (newPage) => {
    loadCustomers(newPage, searchTerm, selectedSegment);
  };

  const getSegmentColor = (segment) => {
    const colors = {
      'Premium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'VIP': 'bg-purple-100 text-purple-800 border-purple-300',
      'Loyal': 'bg-blue-100 text-blue-800 border-blue-300',
      'Regular': 'bg-green-100 text-green-800 border-green-300',
      'New': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[segment] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customer Data Dashboard</h1>
          <p className="text-gray-600">Analyze your customer data and insights</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <div className="text-2xl font-bold">
                  {analytics.overview?.totalCustomers?.toLocaleString() || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <div className="text-2xl font-bold">
                  ${analytics.overview?.totalRevenue?.toLocaleString() || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <ShoppingCart className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <div className="text-2xl font-bold">
                  {analytics.overview?.totalTransactions?.toLocaleString() || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <div className="text-2xl font-bold">
                  ${analytics.overview?.avgOrderValue?.toFixed(2) || '0.00'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Customer List
                <div className="flex space-x-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-64"
                    />
                    <Button onClick={handleSearch} size="sm">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading customers...</div>
              ) : customers.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No customers found. Try uploading customer data files.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Customer List */}
                  <div className="space-y-2">
                    {customers.map((customer) => (
                      <Card key={customer._id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {customer.customerInfo?.name || customer.customerId}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {customer.customerInfo?.email || 'No email'}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={getSegmentColor(customer.analytics?.customerSegment)}>
                                  {customer.analytics?.customerSegment || 'Unknown'}
                                </Badge>
                                {customer.analytics?.favoriteCategory && (
                                  <Badge variant="outline">
                                    {customer.analytics.favoriteCategory}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              ${customer.analytics?.totalSpent?.toFixed(2) || '0.00'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {customer.analytics?.totalTransactions || 0} transactions
                            </div>
                            <div className="text-xs text-gray-500">
                              Avg: ${customer.analytics?.averageOrderValue?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {((pagination.currentPage - 1) * 10) + 1} to{' '}
                        {Math.min(pagination.currentPage * 10, pagination.total)} of{' '}
                        {pagination.total} customers
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage <= 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage >= pagination.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Customer Segments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.segmentDistribution && analytics.segmentDistribution.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analytics.segmentDistribution.map((segment) => (
                    <Card key={segment._id} className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {segment.count}
                      </div>
                      <div className="font-medium">{segment._id || 'Unknown'}</div>
                      <div className="text-sm text-gray-600">
                        Revenue: ${segment.revenue?.toFixed(2) || '0.00'}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No segment data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Category Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.categoryDistribution && analytics.categoryDistribution.length > 0 ? (
                <div className="space-y-4">
                  {analytics.categoryDistribution.map((category, index) => (
                    <div key={category._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium">{category._id || 'Unknown'}</div>
                          <div className="text-sm text-gray-600">
                            {category.customerCount} customers
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ${category.revenue?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No category data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Sales Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.monthlyTrends && analytics.monthlyTrends.length > 0 ? (
                <div className="space-y-4">
                  {analytics.monthlyTrends.reverse().map((trend) => (
                    <div key={`${trend._id.year}-${trend._id.month}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <div>
                          <div className="font-medium">
                            {new Date(trend._id.year, trend._id.month - 1).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long'
                            })}
                          </div>
                          <div className="text-sm text-gray-600">
                            {trend.transactions} transactions
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ${trend.revenue?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDataDashboard;