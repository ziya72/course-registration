# CSV Upload Sample Files

This directory contains sample CSV files for testing the CSV upload system.

## File Types

### Valid Files (No Errors)
- `students-valid.csv` - 10 valid student records
- `courses-valid.csv` - 10 valid course records  
- `results-valid.csv` - 10 valid result records

### Files with Errors (For Testing Validation)
- `students-with-errors.csv` - 10 student records with various validation errors
- `courses-with-errors.csv` - 10 course records with various validation errors
- `results-with-errors.csv` - 10 result records with various validation errors

### No Header Files (For Testing Auto-Detection)
- `students-no-header.csv` - 5 student records without header row
- `courses-no-header.csv` - 5 course records without header row
- `results-no-header.csv` - 5 result records without header row

## CSV Formats

### Students CSV Format
```
Sem,Br,FacultyN,EnrolN,Name,Semester,Hall,SPI,CPI,CumEC,Result
```

**Required Fields:** Br, FacultyN, EnrolN, Name, Semester

**Example:**
```
S2425,CE,24CEBEA001,gm7001,Arjun Kumar,4,Morrison Court,8.567,8.234,48.5,Pass
```

**Precision Requirements:**
- SPI/CPI: Up to 3 decimal places (e.g., 8.567)
- CumEC (Credits): Up to 1 decimal place (e.g., 48.5)

### Courses CSV Format
```
course_code,course_name,credits,semester_no,branch_code,is_elective,elective_type,elective_group,course_type,max_seats,is_running
```

**Required Fields:** course_code, course_name, credits, semester_no, branch_code, is_elective

**Example:**
```
CS101,Programming Fundamentals,3.5,1,CE,false,,,Theory,60,true
```

**Precision Requirements:**
- Credits: Up to 1 decimal place (e.g., 3.5)

### Results CSV Format
```
faculty_no,enrollment_no,semester,no_of_courses,course1,grade1,course2,grade2,...
```

**Required Fields:** faculty_no, enrollment_no, semester, no_of_courses

**Example:**
```
24CEBEA001,gm7001,S2425,4,CS101,A+,CS102,A,EE101,B+,GE101,A
```

## Error Types Included

### Student Errors:
- Missing branch code (empty Br field)
- Invalid branch code (XY)
- Missing enrollment number
- Invalid semester (15, -1)
- Missing faculty number
- Missing name
- Invalid SPI/CPI values

### Course Errors:
- Missing course code
- Missing course name
- Invalid credits (0, negative)
- Invalid semester (15)
- Missing branch code
- Invalid elective type
- Missing elective type for elective courses
- Invalid max_seats

### Result Errors:
- Missing faculty number
- Missing enrollment number
- Missing semester
- Invalid no_of_courses
- Invalid grades (X, Z)
- Non-existent course codes
- Mismatch between no_of_courses and actual course-grade pairs

## Usage

1. Use valid files to test successful uploads
2. Use error files to test validation and error CSV generation
3. Use no-header files to test auto-detection functionality
4. Mix and match for comprehensive testing

## Notes

- All files use UTF-8 encoding
- Valid grades: A+, A, B+, B, C, D, E, F, I
- Semester format: S2425 (Session 2024-25)
- Branch codes: CE, EE, ME, ALL
- Elective types: BRANCH, OPEN