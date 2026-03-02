import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Filter, X, SlidersHorizontal } from 'lucide-react';

export interface CourseFilters {
  branch?: string;
  semester?: number;
  courseType?: string;
  isElective?: boolean;
  electiveGroup?: string;
  minCredits?: number;
  maxCredits?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CourseFiltersProps {
  filters: CourseFilters;
  onFiltersChange: (filters: CourseFilters) => void;
  onApply: (filters: CourseFilters) => void; // Changed to pass filters
}

const CourseFiltersComponent = ({ filters, onFiltersChange, onApply }: CourseFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<CourseFilters>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply(localFilters); // Pass the filters directly
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters: CourseFilters = {
      sortBy: 'course_code',
      sortOrder: 'asc',
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onApply(resetFilters); // Pass the filters directly
  };

  const activeFilterCount = Object.entries(localFilters).filter(
    ([key, value]) => value !== undefined && value !== '' && key !== 'sortBy' && key !== 'sortOrder'
  ).length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="rounded-lg sm:rounded-xl h-8 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm relative">
          <SlidersHorizontal className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <Badge className="ml-1 sm:ml-2 bg-primary text-primary-foreground text-[10px] sm:text-xs h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Courses</SheetTitle>
          <SheetDescription>
            Apply filters to narrow down the course list
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Branch Filter */}
          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Select
              value={localFilters.branch || 'all'}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, branch: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger id="branch">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                <SelectItem value="COBEA">COBEA - Computer Engineering</SelectItem>
                <SelectItem value="ELBEA">ELBEA - Electronics Engineering</SelectItem>
                <SelectItem value="EEBEA">EEBEA - Electrical Engineering</SelectItem>
                <SelectItem value="MEBEA">MEBEA - Mechanical Engineering</SelectItem>
                <SelectItem value="CIBEA">CIBEA - Civil Engineering</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Semester Filter */}
          <div className="space-y-2">
            <Label htmlFor="semester">Semester</Label>
            <Select
              value={localFilters.semester?.toString() || 'all'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  semester: value === 'all' ? undefined : parseInt(value),
                })
              }
            >
              <SelectTrigger id="semester">
                <SelectValue placeholder="All semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All semesters</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <SelectItem key={sem} value={sem.toString()}>
                    Semester {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="courseType">Course Type</Label>
            <Select
              value={localFilters.courseType || 'all'}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, courseType: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger id="courseType">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="Theory">Theory</SelectItem>
                <SelectItem value="Lab">Lab</SelectItem>
                <SelectItem value="Project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Core/Elective Filter */}
          <div className="space-y-2">
            <Label htmlFor="isElective">Core/Elective</Label>
            <Select
              value={
                localFilters.isElective === undefined
                  ? 'all'
                  : localFilters.isElective
                  ? 'true'
                  : 'false'
              }
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  isElective: value === 'all' ? undefined : value === 'true',
                })
              }
            >
              <SelectTrigger id="isElective">
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                <SelectItem value="false">Core</SelectItem>
                <SelectItem value="true">Elective</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Elective Group Filter */}
          {localFilters.isElective && (
            <div className="space-y-2">
              <Label htmlFor="electiveGroup">Elective Group</Label>
              <Input
                id="electiveGroup"
                placeholder="e.g., ELEC-3"
                value={localFilters.electiveGroup || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    electiveGroup: e.target.value || undefined,
                  })
                }
              />
            </div>
          )}

          {/* Credits Range */}
          <div className="space-y-2">
            <Label>Credits Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  type="number"
                  placeholder="Min"
                  step="0.5"
                  min="0"
                  value={localFilters.minCredits || ''}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      minCredits: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Max"
                  step="0.5"
                  min="0"
                  value={localFilters.maxCredits || ''}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      maxCredits: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label htmlFor="sortBy">Sort By</Label>
            <Select
              value={localFilters.sortBy || 'course_code'}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, sortBy: value })
              }
            >
              <SelectTrigger id="sortBy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course_code">Course Code</SelectItem>
                <SelectItem value="course_name">Course Name</SelectItem>
                <SelectItem value="credits">Credits</SelectItem>
                <SelectItem value="semester_no">Semester</SelectItem>
                <SelectItem value="branch_code">Branch</SelectItem>
                <SelectItem value="course_type">Course Type</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Select
              value={localFilters.sortOrder || 'asc'}
              onValueChange={(value: 'asc' | 'desc') =>
                setLocalFilters({ ...localFilters, sortOrder: value })
              }
            >
              <SelectTrigger id="sortOrder">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleApply} className="flex-1">
            <Filter className="h-4 w-4 mr-2" />
            Apply
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CourseFiltersComponent;
