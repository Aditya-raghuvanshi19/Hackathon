import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const FileUploader = ({ onUploadComplete, onUploadProgress }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        toast({
          title: "File Rejected",
          description: `${file.name}: ${errors.map(e => e.message).join(', ')}`,
          variant: "destructive"
        });
      });
    }

    // Add accepted files
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'ready',
      progress: 0,
      error: null
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFile = async (fileItem) => {
    const formData = new FormData();
    formData.append('file', fileItem.file);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}api/data-processing/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleUploadAll = async () => {
    if (files.length === 0) return;

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      
      if (fileItem.status !== 'ready') continue;

      try {
        // Update file status to uploading
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        ));

        // Upload file
        const result = await uploadFile(fileItem);

        // Update file status to completed
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'completed', progress: 100, uploadResult: result }
            : f
        ));

        // Notify parent component
        if (onUploadComplete) {
          onUploadComplete(result);
        }

        toast({
          title: "Upload Successful",
          description: `${fileItem.file.name} has been uploaded successfully.`,
        });

      } catch (error) {
        console.error('Upload error:', error);
        
        // Update file status to error
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'error', error: error.message }
            : f
        ));

        toast({
          title: "Upload Failed",
          description: `${fileItem.file.name}: ${error.message}`,
          variant: "destructive"
        });
      }
    }

    setUploading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <File className="w-4 h-4 text-blue-500" />;
      case 'uploading':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      ready: 'secondary',
      uploading: 'default',
      completed: 'success',
      error: 'destructive'
    };
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Data Files
        </CardTitle>
        <CardDescription>
          Upload your data files for processing. Supported formats: CSV, Excel, JSON, PDF, DOCX, TXT
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary font-medium">Drop the files here...</p>
            ) : (
              <div>
                <p className="font-medium">Drag & drop files here, or click to select</p>
                <p className="text-sm text-muted-foreground">
                  Maximum file size: 50MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Files to Upload</h4>
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getStatusIcon(fileItem.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fileItem.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {fileItem.error && (
                      <p className="text-xs text-red-500 mt-1">
                        {fileItem.error}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(fileItem.status)}
                  
                  {fileItem.status === 'ready' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileItem.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setFiles([])}
              disabled={uploading}
            >
              Clear All
            </Button>
            <Button
              onClick={handleUploadAll}
              disabled={uploading || files.every(f => f.status !== 'ready')}
            >
              {uploading ? 'Uploading...' : 'Upload All'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUploader;