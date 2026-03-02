import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { uploadCSV, previewCSV, getErrorMessage } from '@/services/api';
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

export const CSVUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
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
      const data = await previewCSV(file);
      setPreview(data);
      
      if (data.errors.length > 0) {
        toast({
          title: 'Validation Warnings',
          description: `Found ${data.errors.length} potential issues`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Preview Ready',
          description: `${data.totalRows} rows will be processed`,
        });
      }
    } catch (error) {
      toast({
        title: 'Preview Failed',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setPreviewing(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const data = await uploadCSV(file);
      setResult(data);
      
      toast({
        title: 'Upload Successful',
        description: `Processed ${data.totalRows} rows successfully`,
      });
      
      // Clear file after successful upload
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload CSV File
          </CardTitle>
          <CardDescription>
            Upload student data, grades, or course information via CSV file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  Supports student data, grades, and course information
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
                    Uploading...
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

          {/* Preview Results */}
          {preview && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Preview Summary:</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">Format: {preview.format}</Badge>
                    <Badge variant="secondary">Total Rows: {preview.totalRows}</Badge>
                  </div>
                  
                  {preview.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-destructive">Errors Found:</p>
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

          {/* Upload Results */}
          {result && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Upload Successful!
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Badge variant="secondary" className="justify-center">
                      Students: {result.inserted.students}
                    </Badge>
                    <Badge variant="secondary" className="justify-center">
                      Faculty: {result.inserted.faculty}
                    </Badge>
                    <Badge variant="secondary" className="justify-center">
                      Courses: {result.inserted.courses}
                    </Badge>
                    <Badge variant="secondary" className="justify-center">
                      Grades: {result.inserted.grades}
                    </Badge>
                  </div>
                  
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-orange-600">
                        Partial Success - Some records failed:
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
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* CSV Format Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">CSV Format Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div>
            <p className="font-medium mb-1">Format 1: Course-Grade Pairs</p>
            <code className="block bg-muted p-2 rounded text-[10px] overflow-x-auto">
              faculty_no,enrollment_no,semester,current_sem,course1,grade1,course2,grade2,...
            </code>
          </div>
          
          <div>
            <p className="font-medium mb-1">Format 2: Student Info with SPI/CPI</p>
            <code className="block bg-muted p-2 rounded text-[10px] overflow-x-auto">
              Sem,Br,FacultyN,EnrolN,Name,Semester,Hall,SPI,CPI,Cum. EC,Result/Remarks
            </code>
          </div>
          
          <Alert>
            <AlertDescription className="text-xs">
              <p className="font-medium mb-1">Notes:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• System auto-detects format</li>
                <li>• Creates missing students as inactive</li>
                <li>• Auto-creates faculty numbers and courses</li>
                <li>• Supports grades: A+, A, B+, B, C, D, F, I</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
