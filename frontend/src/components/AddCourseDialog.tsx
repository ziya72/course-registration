import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { addCourse, checkCourseExists, getErrorMessage } from '@/services/api';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AddCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddCourseDialog = ({ open, onOpenChange, onSuccess }: AddCourseDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    courseCode: '',
    courseName: '',
    credits: '',
    semesterNo: '',
    branchCode: '',
    isElective: false,
    isAdvanced: false,
    electiveGroup: '',
    courseType: 'Theory',
  });

  // Validation states
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{
    exists: boolean;
    message: string;
    existing?: { course_code: string; course_name: string };
  } | null>(null);
  const [nameValidation, setNameValidation] = useState<{
    exists: boolean;
    message: string;
    existing?: { course_code: string; course_name: string };
  } | null>(null);

  // Debounced validation for course code
  useEffect(() => {
    if (!formData.courseCode || formData.courseCode.length < 3) {
      setCodeValidation(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsCheckingCode(true);
        const result = await checkCourseExists({ courseCode: formData.courseCode });
        
        if (result.courseCodeExists) {
          setCodeValidation({
            exists: true,
            message: `Course code already exists: ${result.existingCourseCode?.course_name}`,
            existing: result.existingCourseCode,
          });
        } else {
          setCodeValidation({
            exists: false,
            message: 'Course code is available',
          });
        }
      } catch (err) {
        console.error('Error checking course code:', err);
      } finally {
        setIsCheckingCode(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [formData.courseCode]);

  // Debounced validation for course name
  useEffect(() => {
    if (!formData.courseName || formData.courseName.length < 3) {
      setNameValidation(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsCheckingName(true);
        const result = await checkCourseExists({ courseName: formData.courseName });
        
        if (result.courseNameExists) {
          setNameValidation({
            exists: true,
            message: `Course name already exists: ${result.existingCourseName?.course_code}`,
            existing: result.existingCourseName,
          });
        } else {
          setNameValidation({
            exists: false,
            message: 'Course name is available',
          });
        }
      } catch (err) {
        console.error('Error checking course name:', err);
      } finally {
        setIsCheckingName(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [formData.courseName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.courseCode || !formData.courseName || !formData.credits || 
        !formData.semesterNo || !formData.branchCode) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Check if course code or name already exists
    if (codeValidation?.exists) {
      toast({
        title: 'Validation Error',
        description: 'Course code already exists',
        variant: 'destructive',
      });
      return;
    }

    if (nameValidation?.exists) {
      toast({
        title: 'Validation Error',
        description: 'Course name already exists',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      await addCourse({
        courseCode: formData.courseCode.toUpperCase(),
        courseName: formData.courseName,
        credits: parseFloat(formData.credits),
        semesterNo: parseInt(formData.semesterNo),
        branchCode: formData.branchCode.toUpperCase(),
        isElective: formData.isElective,
        isAdvanced: formData.isAdvanced,
        electiveGroup: formData.isElective && formData.electiveGroup ? formData.electiveGroup : undefined,
        courseType: formData.courseType,
      });

      toast({
        title: 'Success',
        description: 'Course added successfully',
      });

      // Reset form and validation states
      setFormData({
        courseCode: '',
        courseName: '',
        credits: '',
        semesterNo: '',
        branchCode: '',
        isElective: false,
        isAdvanced: false,
        electiveGroup: '',
        courseType: 'Theory',
      });
      setCodeValidation(null);
      setNameValidation(null);

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogDescription>
            Create a new course in the system. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            {/* Course Code */}
            <div className="space-y-2">
              <Label htmlFor="courseCode">
                Course Code <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="courseCode"
                  placeholder="e.g., COA2131"
                  value={formData.courseCode}
                  onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                  disabled={isLoading}
                  className={
                    codeValidation?.exists
                      ? 'border-destructive focus-visible:ring-destructive'
                      : codeValidation && !codeValidation.exists
                      ? 'border-green-500 focus-visible:ring-green-500'
                      : ''
                  }
                />
                {isCheckingCode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!isCheckingCode && codeValidation && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {codeValidation.exists ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                )}
              </div>
              {codeValidation && (
                <p
                  className={`text-xs flex items-center gap-1 ${
                    codeValidation.exists ? 'text-destructive' : 'text-green-600'
                  }`}
                >
                  {codeValidation.exists ? (
                    <AlertCircle className="h-3 w-3" />
                  ) : (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  {codeValidation.message}
                </p>
              )}
            </div>

            {/* Course Name */}
            <div className="space-y-2">
              <Label htmlFor="courseName">
                Course Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="courseName"
                  placeholder="e.g., Data Structures"
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  disabled={isLoading}
                  className={
                    nameValidation?.exists
                      ? 'border-destructive focus-visible:ring-destructive'
                      : nameValidation && !nameValidation.exists
                      ? 'border-green-500 focus-visible:ring-green-500'
                      : ''
                  }
                />
                {isCheckingName && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!isCheckingName && nameValidation && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {nameValidation.exists ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                )}
              </div>
              {nameValidation && (
                <p
                  className={`text-xs flex items-center gap-1 ${
                    nameValidation.exists ? 'text-destructive' : 'text-green-600'
                  }`}
                >
                  {nameValidation.exists ? (
                    <AlertCircle className="h-3 w-3" />
                  ) : (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  {nameValidation.message}
                </p>
              )}
            </div>

            {/* Credits and Semester */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credits">
                  Credits <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="credits"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="10"
                  placeholder="e.g., 4"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="semesterNo">
                  Semester <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.semesterNo}
                  onValueChange={(value) => setFormData({ ...formData, semesterNo: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="semesterNo">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Branch Code */}
            <div className="space-y-2">
              <Label htmlFor="branchCode">
                Branch Code <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.branchCode}
                onValueChange={(value) => setFormData({ ...formData, branchCode: value })}
                disabled={isLoading}
              >
                <SelectTrigger id="branchCode">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COBEA">COBEA - Computer Engineering</SelectItem>
                  <SelectItem value="ELBEA">ELBEA - Electronics Engineering</SelectItem>
                  <SelectItem value="EEBEA">EEBEA - Electrical Engineering</SelectItem>
                  <SelectItem value="MEBEA">MEBEA - Mechanical Engineering</SelectItem>
                  <SelectItem value="CIBEA">CIBEA - Civil Engineering</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Course Type */}
            <div className="space-y-2">
              <Label htmlFor="courseType">Course Type</Label>
              <Select
                value={formData.courseType}
                onValueChange={(value) => setFormData({ ...formData, courseType: value })}
                disabled={isLoading}
              >
                <SelectTrigger id="courseType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Theory">Theory</SelectItem>
                  <SelectItem value="Lab">Lab</SelectItem>
                  <SelectItem value="Project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Is Elective */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isElective" className="cursor-pointer">
                  Elective Course
                </Label>
                <p className="text-xs text-muted-foreground">
                  Mark this course as an elective
                </p>
              </div>
              <Switch
                id="isElective"
                checked={formData.isElective}
                onCheckedChange={(checked) => setFormData({ ...formData, isElective: checked })}
                disabled={isLoading}
              />
            </div>

            {/* Is Advanced */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isAdvanced" className="cursor-pointer">
                  Advanced Course
                </Label>
                <p className="text-xs text-muted-foreground">
                  Course with special grade requirements (e.g., CPI ≥ 8.5)
                </p>
              </div>
              <Switch
                id="isAdvanced"
                checked={formData.isAdvanced}
                onCheckedChange={(checked) => setFormData({ ...formData, isAdvanced: checked })}
                disabled={isLoading}
              />
            </div>

            {/* Elective Group (conditional) */}
            {formData.isElective && (
              <div className="space-y-2">
                <Label htmlFor="electiveGroup">Elective Group</Label>
                <Input
                  id="electiveGroup"
                  placeholder="e.g., ELEC-3"
                  value={formData.electiveGroup}
                  onChange={(e) => setFormData({ ...formData, electiveGroup: e.target.value })}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Group code for elective courses
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                isLoading || 
                isCheckingCode || 
                isCheckingName || 
                codeValidation?.exists === true || 
                nameValidation?.exists === true
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Course
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCourseDialog;
