# CSV Upload Testing Instructions

## Upload Order (IMPORTANT!)
1. **courses.csv** - Upload first to create course structure
2. **results.csv** - Upload second to create grade records  
3. **students.csv** - Upload third (CPI/Credits calculated automatically)

## Field Name Clarification
- **`Sem`** = Semester code (S24252) - Academic year + semester type
- **`semester_no`** = Semester number (1-8) - Which semester the student is in

## Test Data Overview
- **5 Students** across 3 branches (CE, EE, ME)
- **12 Courses** including 2 advanced courses (CS499, EE499)
- **Grade records** for semester S24252 (2024-25 Even semester)
- **Automatic calculations** for CPI and earned credits

## Key Features to Test
✅ **Advanced Course Tracking** - CS499 and EE499 marked as advanced
✅ **Branch Code Mapping** - CE→COBEA, EE→EEBEA, ME→MEBEA  
✅ **Semester Format** - S24252 (2024-25 Even semester)
✅ **Faculty Number Format** - 24COBEA001 (Year + Branch + Roll)
✅ **Automatic CPI Calculation** - From grade records, not CSV input
✅ **Elective Courses** - GE101 as open elective, CS499/EE499 as branch electives

## Expected Results After Upload
- Students will have calculated CPI based on their grades
- Advanced courses will show purple "ADV" badges in UI
- Total earned credits calculated from passed courses only
- All data consistency maintained across the system

## File Formats
- **Sem**: S24252 (S + AcademicYear + SemesterType)
- **semester_no**: 1-8 (Current semester of student)
- **Faculty No**: 24COBEA001 (AdmissionYear + FullBranchCode + Roll)
- **Grades**: A+, A, B+, B, C, D, E, F, I (enum validated)