import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Download, 
  Eye,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const ProcessingStatus = ({ fileId, onStatusChange }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchJobStatus = async () => {
    if (!fileId) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_SERVER}api/data-processing/files/${fileId}`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }

      const data = await response.json();
      setJob(data.jobs?.[0] || null);
      
      if (onStatusChange) {
        onStatusChange(data.jobs?.[0]?.status || 'unknown');
      }
    } catch (error) {
      console.error('Fetch job status error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobStatus();
    
    // Poll for status updates every 5 seconds if job is running
    let interval;
    if (job?.status === 'running' || job?.status === 'queued') {
      interval = setInterval(fetchJobStatus, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fileId, job?.status]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'running':
        return 'text-blue-600 bg-blue-50';
      case 'queued':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'running':
        return <Activity className="w-4 h-4 animate-pulse" />;
      case 'queued':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDuration = (milliseconds) => {
    if (!milliseconds) return 'N/A';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading status...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading status: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!job) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No processing job found for this file.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getStatusIcon(job.status)}
            Processing Status
          </span>
          <Badge className={getStatusColor(job.status)}>
            {job.status?.toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription>
          Job ID: {job.jobId}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {job.progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{job.progress.percentage}%</span>
            </div>
            <Progress value={job.progress.percentage} />
            {job.progress.currentStep && (
              <p className="text-sm text-muted-foreground">
                Current Step: {job.progress.currentStep}
              </p>
            )}
          </div>
        )}

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Job Type:</span>
                <p className="text-muted-foreground">{job.jobType}</p>
              </div>
              <div>
                <span className="font-medium">Priority:</span>
                <p className="text-muted-foreground">{job.priority}</p>
              </div>
              <div>
                <span className="font-medium">Started:</span>
                <p className="text-muted-foreground">
                  {job.startedAt ? new Date(job.startedAt).toLocaleString() : 'Not started'}
                </p>
              </div>
              <div>
                <span className="font-medium">Duration:</span>
                <p className="text-muted-foreground">
                  {formatDuration(job.actualDuration || (job.startedAt ? Date.now() - new Date(job.startedAt).getTime() : 0))}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <ScrollArea className="h-48 w-full">
              {job.logs && job.logs.length > 0 ? (
                <div className="space-y-2">
                  {job.logs.map((log, index) => (
                    <div key={index} className="p-2 bg-muted rounded text-sm">
                      <div className="flex justify-between items-start">
                        <span className={`font-medium ${
                          log.level === 'error' ? 'text-red-600' :
                          log.level === 'warn' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`}>
                          {log.level?.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1">{log.message}</p>
                      {log.details && (
                        <pre className="text-xs bg-background p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No logs available</p>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="errors">
            <ScrollArea className="h-48 w-full">
              {job.errors && job.errors.length > 0 ? (
                <div className="space-y-2">
                  {job.errors.map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-red-600">ERROR</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1 text-red-800">{error.error}</p>
                      {error.stack && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-red-600">Stack Trace</summary>
                          <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No errors recorded</p>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchJobStatus}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {job.status === 'completed' && (
            <>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View Results
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingStatus;