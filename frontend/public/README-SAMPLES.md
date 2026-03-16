# Sample CSV Files for Testing

## 📁 Available Files

1. **sample-courses.csv** - 34 courses
   - 9 core courses (CE, EE, ME)
   - 15 branch electives (BRANCH type)
   - 10 open electives (OPEN type)

2. **sample-students.csv** - 10 students
   - Mix of CE, EE, ME branches
   - Semesters 2 and 3
   - Various halls and CPIs

3. **sample-results.csv** - 50+ grade records
   - Course-grade pairs for students
   - Valid grades: A+, A, B+, B, C, D, E, F, I

## 🚀 Quick Start

### Upload Order:
1. **Courses** first (creates course catalog)
2. **Students** second (creates student records)
3. **Results** last (requires both students and courses to exist)

### How to Use:
1. Login as Admin
2. Go to "Upload" tab
3. Select appropriate tab (Students/Results/Courses)
4. Upload the corresponding CSV file
5. Click "Preview" to validate
6. Click "Upload & Process" to import

## 📊 What's Included

### Courses (34 total)
- **Core Courses**: CS301, CS302, CS303, EE301, EE302, EE303, ME301, ME302, ME303
- **Branch Electives**: CS401E-CS408E (CE), EE401E-EE404E (EE), ME401E-ME403E (ME)
- **Open Electives**: GE401-GE410 (available to all branches)

### Students (10 total)
- Amrita (gn5616) - CE, Semester 2
- Pratyush (gq0165) - EE, Semester 3
- Rahul Kumar (gn5617) - CE, Semester 2
- Priya Singh (gm5618) - ME, Semester 2
- And 6 more...

### Results
- Grade records for all 10 students
- 5 courses per student (semester 1 courses)
- Grades ranging from A+ to B

## ✅ Expected Outcome

After uploading all three files:
- ✅ 34 courses in database
- ✅ 10 students created/updated
- ✅ 50+ grade records created
- ✅ Elective types properly categorized
- ✅ All validations passed

## 🔗 Full Documentation

See `SAMPLE_CSV_TESTING_GUIDE.md` in the project root for detailed testing instructions.
