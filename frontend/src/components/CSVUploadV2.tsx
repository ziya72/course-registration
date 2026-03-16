import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertTriangle, Users, GraduationCap, BookOpen, BarChart3, Clock, Zap } from 'lucide-react';
import api from '@/services/api';

type UploadType = 'students' | 'results' | 'courses';

interface UploadAnalytics {
  totalRecords: number;
  processingTimeMs: number;
  processingTimeSeconds: string;
  recordsPerSecond: number;
  successRate: string;
  batchCount: number;
  avgBatchTimeMs: number;
  fileSize: string;
  fileName: string;
  uploadedBy: string;
  timestamp: string;
  uploadType: string;
}

interface PreviewRow {
  rowNumber: number;
  identifier: string;
  action: 'CREATE' | 'UPDATE' | 'ERROR' | 'UNCHANGED';
  data: any;
  errors: string[];
}

interface PreviewResult {
  uploadType: UploadType;
  totalRows: number;
  summary: {
    create: number;
    update: number;
    error: number;
    unchanged: number;
  };
  preview: PreviewRow[];
  errors: string[];
}

export const CSVUploadV2 = () => {
  const [uploadType, setUploadType] = useState<UploadType>('students');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<any>(null);
  const [analytics, setAnalytics] = useState<UploadAnalytics | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [actionFilter, setActionFilter] = useState<'ALL' | 'CREATE' | 'UPDATE' | 'ERROR' | 'UNCHANGED'>('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: 'Invalid File',
          description: 'Please select a CSV file',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      setPreview(null);
      setResult(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setPreviewing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadType', uploadType);

      const response = await api.post('/api/admin/upload/v2/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;
      
      // Check if decryption worked properly
      if (data.encrypted === true) {
        throw new Error('Failed to decrypt server response. Please try again.');
      }
      
      setPreview(data);
      setCurrentPage(1); // Reset to first page
      setActionFilter('ALL'); // Reset filter
      
      if (data?.summary?.error > 0) {
        toast({
          title: 'Validation Warnings',
          description: `Found ${data.summary.error} rows with errors`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Preview Ready',
          description: `${data?.summary?.create || 0} new, ${data?.summary?.update || 0} updates`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Preview Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setPreviewing(false);
    }
  };


  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setAnalytics(null);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev; // Stop at 90% until real completion
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadType', uploadType);

      const response = await api.post('/api/admin/upload/v2/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;
      setResult(data);
      setAnalytics(data.analytics);
      setUploadProgress(100); // Complete progress
      
      console.log('📊 Upload result:', data);
      console.log('📈 Analytics:', data.analytics);
      console.log('❌ Failed count:', data.inserted?.failed);
      console.log('📄 Has errorCSV:', !!data.errorCSV);
      console.log('📄 ErrorCSV length:', data.errorCSV?.length);
      
      if (data.inserted.failed > 0) {
        toast({
          title: 'Partial Success',
          description: `Created: ${data.inserted.created}, Updated: ${data.inserted.updated}, Failed: ${data.inserted.failed}`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Upload Successful',
          description: `Processed ${data.analytics?.totalRecords} records in ${data.analytics?.processingTimeSeconds}s`,
        });
      }
      
      // Clear file after successful upload
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setUploadProgress(0);
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
    }
  };

  const handleDownloadErrors = async () => {
    if (!result?.errorCSV) return;

    try {
      const response = await api.post('/api/admin/upload/v2/download-errors', 
        { errorCSV: result.errorCSV },
        { responseType: 'blob' }
      );

      // Create blob and download
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `upload-errors-${uploadType}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download Started',
        description: 'Error CSV file is being downloaded',
      });
    } catch (error: any) {
      toast({
        title: 'Download Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setPreview(null);
      setResult(null);
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please drop a CSV file',
        variant: 'destructive',
      });
    }
  };

  const getSchemaGuide = () => {
    switch (uploadType) {
      case 'students':
        return {
          title: 'Student Information CSV',
          format: 'Sem,Br,FacultyN,EnrolN,Name,semester_no,SPI,CPI,credit_earned,Hall,Remark',
          example: 'S24252,CE,24COBEA803,gm7001,Arjun Kumar,2,8.5,8.2,45.5,Morrison Court,Good standing',
          required: ['Sem', 'Br', 'FacultyN', 'EnrolN', 'Name', 'semester_no'],
          notes: [
            'Sem: Semester code (format: SYYYY[S]T, e.g., S24252)',
            '  - S: Prefix, YYYY: Academic year (2425 = 2024-25), T: Type (1=Odd, 2=Even)',
            'Br: Branch code (CE, EE, ME, CI, CH, AR)',
            'FacultyN: Faculty number (format: YY + FullBranchCode + RollNo, e.g., 24COBEA803)',
            'EnrolN: Enrollment number',
            'semester_no: Current semester number (1-8)',
            'SPI: Semester Performance Index (optional, 0-10)',
            'CPI: Cumulative Performance Index (optional, 0-10, auto-calculated if not provided)',
            'credit_earned: Total credits earned (optional, auto-calculated if not provided)',
            'Hall: Hostel/Hall name (optional)',
            'Remark: Any remarks or notes (optional)',
            'Header row is optional - system will auto-detect',
            'If CPI/credits not provided, they are calculated from grade records',
            'Branch codes: CE→COBEA, EE→EEBEA, ME→MEBEA, CI→CIBEA, CH→CHBEA, AR→ARBEA',
          ],
        };
      case 'results':
        return {
          title: 'Student Results CSV',
          format: 'faculty_no,enrollment_no,sem,no_of_courses,course1,grade1,course2,grade2,...',
          example: '24COBEA803,gm7001,S24252,2,CS101,A+,CS102,A',
          required: ['faculty_no', 'enrollment_no', 'sem', 'no_of_courses'],
          notes: [
            'Sem format: SYYYY[S]T (e.g., S24252 = Academic year 2024-25, Even semester)',
            'Dynamic course-grade pairs after first 4 fields',
            'Valid grades: A+, A, B+, B, C, D, E, F, I',
            'no_of_courses can be 0 (for students with no courses)',
            'Course must exist in database',
            'Student must exist in database',
            'Note: Create count shows grade records, not rows (1 row = multiple grades)',
          ],
        };
      case 'courses':
        return {
          title: 'Course Information CSV',
          format: 'course_code,course_name,credits,semester_no,branch_code,is_elective,elective_type,elective_group,course_type,max_seats,is_running,is_advanced',
          example: 'CS301,Data Structures,3.5,3,CE,false,,,Theory,60,true,false',
          required: ['course_code', 'course_name', 'credits', 'semester_no', 'branch_code', 'is_elective'],
          notes: [
            'elective_type: BRANCH or OPEN (required if is_elective=true)',
            'elective_group: Group identifier (optional)',
            'course_type: Theory, Lab, or Project (default: Theory)',
            'max_seats: Maximum enrollment (optional)',
            'is_running: true or false (default: true)',
            'is_advanced: true or false (default: false) - for courses with special requirements',
            'credits: Up to 1 decimal place (e.g., 3.5)',
          ],
        };
    }
  };

  const schema = getSchemaGuide();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            CSV Upload System
          </CardTitle>
          <CardDescription>
            Upload and manage student data, results, and course information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Type Tabs */}
          <Tabs value={uploadType} onValueChange={(v) => {
            const newType = v as UploadType;
            setUploadType(newType);
            setFile(null);
            setPreview(null);
            setResult(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="students" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Students</span>
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Results</span>
              </TabsTrigger>
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Courses</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={uploadType} className="space-y-4 mt-4">
              {/* File Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-12 w-12 text-primary" />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm font-medium">Drop CSV file here or click to browse</p>
                    <p className="text-xs text-muted-foreground">
                      Upload {schema.title}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {file && (
                <div className="flex gap-2">
                  <Button
                    onClick={handlePreview}
                    disabled={previewing || uploading}
                    variant="outline"
                    className="flex-1"
                  >
                    {previewing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Previewing...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Preview
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || previewing}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload & Process
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Upload Progress Bar */}
              {uploading && (
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Processing...</span>
                        <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Using optimized batch processing for better performance
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>


          {/* Preview Results */}
          {preview && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">Preview Summary:</p>
                  {uploadType === 'results' && (
                    <p className="text-xs text-muted-foreground">
                      Note: For results, counts show grade records (not rows). Each row can contain multiple course-grade pairs.
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Badge variant="default" className="justify-center">
                      Create: {preview?.summary?.create || 0}
                    </Badge>
                    <Badge variant="secondary" className="justify-center">
                      Update: {preview?.summary?.update || 0}
                    </Badge>
                    <Badge variant="destructive" className="justify-center">
                      Error: {preview?.summary?.error || 0}
                    </Badge>
                    <Badge variant="outline" className="justify-center">
                      Total: {preview?.totalRows || 0} {uploadType === 'results' ? 'rows' : ''}
                    </Badge>
                  </div>
                  
                  {/* Action Filter Buttons */}
                  {preview?.preview && preview.preview.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant={actionFilter === 'ALL' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setActionFilter('ALL');
                          setCurrentPage(1);
                        }}
                        className="h-8 text-xs"
                      >
                        All ({preview.preview.length})
                      </Button>
                      <Button
                        variant={actionFilter === 'CREATE' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setActionFilter('CREATE');
                          setCurrentPage(1);
                        }}
                        className="h-8 text-xs"
                      >
                        Create ({preview.summary.create})
                      </Button>
                      <Button
                        variant={actionFilter === 'UPDATE' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setActionFilter('UPDATE');
                          setCurrentPage(1);
                        }}
                        className="h-8 text-xs"
                      >
                        Update ({preview.summary.update})
                      </Button>
                      <Button
                        variant={actionFilter === 'ERROR' ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setActionFilter('ERROR');
                          setCurrentPage(1);
                        }}
                        className="h-8 text-xs"
                      >
                        Error ({preview.summary.error})
                      </Button>
                    </div>
                  )}
                  
                  {/* Preview Table */}
                  {preview?.preview && preview.preview.length > 0 && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-xs border">
                        <thead className="bg-muted">
                          <tr>
                            <th className="p-2 text-left">Row</th>
                            <th className="p-2 text-left">Identifier</th>
                            <th className="p-2 text-left">Action</th>
                            <th className="p-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.preview
                            .filter(row => actionFilter === 'ALL' || row.action === actionFilter)
                            .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                            .map((row, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="p-2">{row.rowNumber}</td>
                              <td className="p-2 font-mono">{row.identifier}</td>
                              <td className="p-2">
                                <Badge 
                                  variant={
                                    row.action === 'CREATE' ? 'default' :
                                    row.action === 'UPDATE' ? 'secondary' :
                                    row.action === 'ERROR' ? 'destructive' : 'outline'
                                  }
                                  className="text-xs"
                                >
                                  {row.action}
                                </Badge>
                              </td>
                              <td className="p-2">
                                {row.errors.length > 0 ? (
                                  <span className="text-destructive text-xs">
                                    {row.errors[0]}
                                  </span>
                                ) : (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {/* Pagination Controls */}
                      {(() => {
                        const filteredData = preview?.preview.filter(row => actionFilter === 'ALL' || row.action === actionFilter) || [];
                        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
                        
                        return filteredData.length > rowsPerPage && (
                          <div className="flex items-center justify-between mt-3 text-xs">
                            <p className="text-muted-foreground">
                              Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} rows
                              {actionFilter !== 'ALL' && ` (filtered by ${actionFilter})`}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-7 text-xs"
                              >
                                Previous
                              </Button>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                  .filter(page => {
                                    // Show first, last, current, and adjacent pages
                                    return page === 1 || 
                                           page === totalPages || 
                                           Math.abs(page - currentPage) <= 1;
                                  })
                                  .map((page, idx, arr) => (
                                    <React.Fragment key={page}>
                                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                                        <span className="px-1">...</span>
                                      )}
                                      <Button
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className="h-7 w-7 p-0 text-xs"
                                      >
                                        {page}
                                      </Button>
                                    </React.Fragment>
                                  ))}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                                className="h-7 text-xs"
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  
                  {preview?.errors && preview.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-destructive">Validation Errors:</p>
                      <ul className="text-xs space-y-1 mt-1">
                        {preview.errors.slice(0, 5).map((error: string, idx: number) => (
                          <li key={idx} className="text-muted-foreground">• {error}</li>
                        ))}
                        {preview.errors.length > 5 && (
                          <li className="text-muted-foreground">
                            ... and {preview.errors.length - 5} more errors
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Analytics */}
          {analytics && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4" />
                  Upload Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs font-medium">Processing Time</span>
                    </div>
                    <p className="text-lg font-bold">{analytics.processingTimeSeconds}s</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Zap className="h-3 w-3" />
                      <span className="text-xs font-medium">Speed</span>
                    </div>
                    <p className="text-lg font-bold">{analytics.recordsPerSecond}/s</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle className="h-3 w-3" />
                      <span className="text-xs font-medium">Success Rate</span>
                    </div>
                    <p className="text-lg font-bold">{analytics.successRate}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <FileText className="h-3 w-3" />
                      <span className="text-xs font-medium">Batches</span>
                    </div>
                    <p className="text-lg font-bold">{analytics.batchCount}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <p><strong>File:</strong> {analytics.fileName} ({analytics.fileSize})</p>
                    <p><strong>Total Records:</strong> {analytics.totalRecords}</p>
                  </div>
                  <div>
                    <p><strong>Avg Batch Time:</strong> {analytics.avgBatchTimeMs}ms</p>
                    <p><strong>Upload Type:</strong> {analytics.uploadType}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Results */}
          {result && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Upload Successful!
                  </p>
                  
                  {/* DEBUG INFO - Remove after testing */}
                  <div className="text-xs bg-yellow-100 p-2 rounded">
                    <p>DEBUG: Failed count = {result.inserted?.failed}</p>
                    <p>DEBUG: Has errorCSV = {result.errorCSV ? 'YES' : 'NO'}</p>
                    <p>DEBUG: ErrorCSV length = {result.errorCSV?.length || 0}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Badge variant="default" className="justify-center">
                      Created: {result.inserted.created}
                    </Badge>
                    <Badge variant="secondary" className="justify-center">
                      Updated: {result.inserted.updated}
                    </Badge>
                    <Badge variant="destructive" className="justify-center">
                      Failed: {result.inserted.failed}
                    </Badge>
                  </div>
                  
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-orange-600">
                        Some records failed:
                      </p>
                      <ul className="text-xs space-y-1 mt-1">
                        {result.errors.slice(0, 3).map((error: string, idx: number) => (
                          <li key={idx} className="text-muted-foreground">• {error}</li>
                        ))}
                        {result.errors.length > 3 && (
                          <li className="text-muted-foreground">
                            ... and {result.errors.length - 3} more errors
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Download Error CSV Button */}
                  {result.inserted.failed > 0 && result.errorCSV && (
                    <div className="mt-3">
                      <Button
                        onClick={handleDownloadErrors}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Download Error CSV
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        Download failed rows to fix and re-upload
                      </p>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* CSV Format Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{schema.title} Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div>
            <p className="font-medium mb-1">CSV Header:</p>
            <code className="block bg-muted p-2 rounded text-[10px] overflow-x-auto">
              {schema.format}
            </code>
          </div>
          
          <div>
            <p className="font-medium mb-1">Example Row:</p>
            <code className="block bg-muted p-2 rounded text-[10px] overflow-x-auto">
              {schema.example}
            </code>
          </div>
          
          <div>
            <p className="font-medium mb-1">Required Fields:</p>
            <div className="flex flex-wrap gap-1">
              {schema.required.map((field) => (
                <Badge key={field} variant="secondary" className="text-[10px]">
                  {field}
                </Badge>
              ))}
            </div>
          </div>
          
          <Alert>
            <AlertDescription className="text-xs">
              <p className="font-medium mb-1">Notes:</p>
              <ul className="space-y-1 text-muted-foreground">
                {schema.notes.map((note, idx) => (
                  <li key={idx}>• {note}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
