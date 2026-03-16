# CSV Upload Testing Guide

## Quick Test Instructions

### 1. Test Valid Uploads
Upload these files to verify the system works correctly:
- `students-valid.csv` - Should create 10 new students
- `courses-valid.csv` - Should create 10 new courses  
- `results-valid.csv` - Should create grade records for existing students

### 2. Test Error Handling
Upload these files to test validation and error CSV generation:
- `students-with-errors.csv` - Should show validation errors and generate error CSV
- `courses-with-errors.csv` - Should show validation errors and generate error CSV
- `results-with-errors.csv` - Should show validation errors and generate error CSV

### 3. Test Auto-Detection
Upload these files to test header auto-detection:
- `students-no-header.csv` - Should auto-detect and use default headers
- `courses-no-header.csv` - Should auto-detect and use default headers
- `results-no-header.csv` - Should auto-detect and use default headers

## Expected Error Types

### Students with Errors:
- Row 3: Missing branch code (empty Br field)
- Row 4: Invalid branch code "XY"
- Row 5: Missing enrollment number
- Row 6: Invalid semester "15" (should be 1-8)
- Row 7: Missing faculty number
- Row 8: Missing name
- Row 9: Invalid semester "-1"
- Row 10: Invalid SPI "invalid"
- Row 11: Invalid CPI "invalid"

### Courses with Errors:
- Row 2: Missing course code
- Row 3: Missing course name
- Row 4: Invalid credits "0"
- Row 5: Invalid semester "15"
- Row 6: Missing branch code
- Row 7: Invalid elective type "INVALID"
- Row 8: Missing elective type for elective course
- Row 9: Invalid credits "-2.0"
- Row 10: Invalid max_seats "invalid"

### Results with Errors:
- Row 2: Missing faculty number
- Row 3: Missing enrollment number
- Row 4: Missing semester
- Row 5: Invalid no_of_courses "invalid"
- Row 6: Invalid grade "X"
- Row 7: Invalid course code "INVALID_COURSE"
- Row 8: Invalid grade "Z"
- Row 9: Mismatch - says 1 course but has 2 course-grade pairs
- Row 10: Says 0 courses (valid case)

## Testing Workflow

1. **Start with valid files** to ensure basic functionality works
2. **Test error files** to verify validation catches issues
3. **Test no-header files** to verify auto-detection works
4. **Download error CSVs** when uploads fail to verify error reporting
5. **Check import logs** to verify tracking works correctly

## Expected Results

### Valid Files:
- ✅ All records should be created/updated successfully
- ✅ No error CSV should be generated
- ✅ Import log should show SUCCESS status

### Error Files:
- ⚠️ Some records will fail validation
- ⚠️ Error CSV should be generated with failed rows
- ⚠️ Import log should show PARTIAL or FAILED status
- ✅ Valid rows should still be processed

### No-Header Files:
- ✅ System should auto-detect missing headers
- ✅ Should use default field mapping
- ✅ All records should be processed correctly