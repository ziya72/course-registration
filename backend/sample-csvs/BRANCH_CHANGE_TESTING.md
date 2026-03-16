# Branch Change Testing Guide

## Scenario: Student Branch Changes After Semester 2

This demonstrates how to handle students changing branches based on their cumulative performance.

## Test Files

### 1. Initial Upload: `students-branch-change-example.csv`
```csv
Sem,Br,FacultyN,EnrolN,Name,Semester,Hall,SPI,CPI,CumEC,Result
S2425,CE,24CEBEA001,gm7001,Arjun Kumar,2,Morrison Court,7.5,7.2,18,Pass
S2425,EE,24EEBEA002,gm7002,Priya Sharma,2,Tagore Hall,6.8,6.9,16,Pass
S2425,ME,24MEBEA003,gm7003,Rahul Singh,2,Gandhi Hall,8.1,8.0,20,Pass
```

### 2. After Branch Change: `students-branch-change-updated.csv`
```csv
Sem,Br,FacultyN,EnrolN,Name,Semester,Hall,SPI,CPI,CumEC,Result
S2425,EE,24EEBEA001,gm7001,Arjun Kumar,3,Morrison Court,7.8,7.5,28,Pass
S2425,CE,24CEBEA002,gm7002,Priya Sharma,3,Tagore Hall,7.2,7.1,26,Pass
S2425,CI,24CIBEA003,gm7003,Rahul Singh,3,Gandhi Hall,8.3,8.2,30,Pass
```

## Changes Made

| Student | Original Branch | New Branch | Original Faculty No | New Faculty No | Reason |
|---------|----------------|------------|-------------------|----------------|---------|
| Arjun Kumar | CE | EE | 24CEBEA001 | 24EEBEA001 | Branch change CE→EE |
| Priya Sharma | EE | CE | 24EEBEA002 | 24CEBEA002 | Branch change EE→CE |
| Rahul Singh | ME | CI | 24MEBEA003 | 24CIBEA003 | Branch change ME→CI |

## Testing Steps

1. **Upload Initial File**: Upload `students-branch-change-example.csv`
   - Should create 3 new students
   - Each with their original branch and faculty number

2. **Upload Updated File**: Upload `students-branch-change-updated.csv`
   - Should UPDATE the same 3 students (matched by enrollment_no)
   - Should change their branch codes and faculty numbers
   - Should update semester from 2 to 3
   - Should update CPI and credits

## Expected Results

### After Initial Upload:
- ✅ 3 students created
- ✅ Faculty numbers: 24CEBEA001, 24EEBEA002, 24MEBEA003
- ✅ Branches: CE, EE, ME

### After Branch Change Upload:
- ✅ 3 students updated (not created)
- ✅ Faculty numbers: 24EEBEA001, 24CEBEA002, 24CIBEA003
- ✅ Branches: EE, CE, CI
- ✅ Semester updated to 3
- ✅ CPI and credits updated

## Branch Code Reference

| Code | Full Name |
|------|-----------|
| CE | Computer Engineering |
| EE | Electronics Engineering |
| ME | Mechanical Engineering |
| CI | Civil Engineering |
| CH | Chemical Engineering |
| AR | Architecture |

## Important Notes

1. **Enrollment Number**: Never changes (primary key for updates)
2. **Faculty Number**: Can be updated to reflect new branch
3. **Branch Code**: Must match the faculty number prefix
4. **Consistency**: Course uploads should use the same branch codes
5. **Validation**: System validates branch codes against the supported list

## Faculty Number Format

Faculty numbers follow the pattern: `YYBranchCodeXXXX`
- YY: Admission year (24 for 2024)
- BranchCode: CE, EE, ME, CI, CH, AR
- XXXX: Sequential number

Examples:
- 24CEBEA001 = 2024 admission, Computer Engineering, student #001
- 24EEBEA001 = 2024 admission, Electronics Engineering, student #001
- 24CIBEA001 = 2024 admission, Civil Engineering, student #001