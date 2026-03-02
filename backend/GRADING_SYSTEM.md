# Grading System Documentation

## Grade Storage Format

### Database Schema
- **Field:** `grade` (String)
- **Field:** `grade_points` (Decimal)
- **Scale:** 0-10 (numeric)

### Grade Representation
Grades are stored as **numeric strings** representing points out of 10.

**Examples:**
- `"10.0"` - Excellent (A+)
- `"9.0"` - Very Good (A)
- `"8.0"` - Good (B+)
- `"7.0"` - Above Average (B)
- `"6.0"` - Average (C+)
- `"5.0"` - Pass (C)
- `"4.0"` - Minimum Pass (D)
- `"0.0"` - Fail (F)

## Grade Point Scale

| Grade | Points | Description |
|-------|--------|-------------|
| A+ | 10.0 | Outstanding |
| A | 9.0 | Excellent |
| B+ | 8.0 | Very Good |
| B | 7.0 | Good |
| C+ | 6.0 | Above Average |
| C | 5.0 | Average |
| D | 4.0 | Pass |
| F | 0.0 | Fail |

## Prerequisite Requirements

### Minimum Grade Format
Prerequisites use numeric minimum grades:

**Example:**
```typescript
{
  course_code: "CS102",
  prerequisite_course_code: "CS101",
  min_grade: "5.0" // Requires at least 5.0/10 in CS101
}
```

### Validation Logic
```typescript
// Student's grade in CS101: "7.5"
// Minimum required: "5.0"
// Result: 7.5 >= 5.0 → PASS ✅

// Student's grade in CS101: "4.0"
// Minimum required: "5.0"
// Result: 4.0 >= 5.0 → FAIL ❌
```

## CPI Calculation

### CPI (Cumulative Performance Index)
- **Scale:** 0-10
- **Stored as:** Decimal in `student.current_cpi`
- **Calculation:** Weighted average of all course grades

**Formula:**
```
CPI = Σ(grade_points × credits) / Σ(credits)
```

**Example:**
```
CS101: 8.0 points × 4 credits = 32
MA101: 7.0 points × 4 credits = 28
HS101: 9.0 points × 2 credits = 18

Total: (32 + 28 + 18) / (4 + 4 + 2) = 78 / 10 = 7.8 CPI
```

## Grade Records Table

### Structure
```typescript
model GradeRecord {
  grade_id       Int
  enrollment_no  String
  course_code    String
  grade          String?    // "7.5", "8.0", etc.
  grade_points   Decimal?   // 7.5, 8.0, etc.
  is_backlog     Boolean
  is_improvement Boolean
}
```

### Usage
1. **Store grades as strings:** `"7.5"`, `"8.0"`, `"10.0"`
2. **Store grade_points as decimals:** `7.5`, `8.0`, `10.0`
3. **Both fields should match** for consistency

## Implementation

### Prerequisite Checker
```typescript
function checkGradeRequirement(
  actualGrade: string,    // "7.5"
  minGrade: string        // "5.0"
): boolean {
  const actualValue = parseFloat(actualGrade);  // 7.5
  const minValue = parseFloat(minGrade);        // 5.0
  
  return actualValue >= minValue;  // 7.5 >= 5.0 → true
}
```

### Example Validation
```typescript
// Student wants to register for CS102
// CS102 requires CS101 with min grade 5.0

// Check student's grade in CS101
const gradeRecord = await prisma.gradeRecord.findFirst({
  where: {
    enrollment_no: "gm7605",
    course_code: "CS101"
  }
});

// gradeRecord.grade = "7.5"
// min_grade = "5.0"
// Result: 7.5 >= 5.0 → Prerequisite met ✅
```

## Seed Data Examples

### Prerequisites with Numeric Grades
```typescript
await prisma.coursePrerequisite.createMany({
  data: [
    {
      course_code: "CS102",
      prerequisite_course_code: "CS101",
      min_grade: "5.0"  // Minimum 5.0/10
    },
    {
      course_code: "CS301",
      prerequisite_course_code: "CS102",
      min_grade: "6.0"  // Minimum 6.0/10
    },
    {
      course_code: "CS401",
      prerequisite_course_code: "CS301",
      min_grade: "7.0"  // Minimum 7.0/10 (advanced course)
    }
  ]
});
```

### Grade Records with Numeric Grades
```typescript
await prisma.gradeRecord.createMany({
  data: [
    {
      enrollment_no: "gm7605",
      course_code: "CS101",
      grade: "8.5",
      grade_points: 8.5,
      academic_year: 2024,
      semester_type: 1
    },
    {
      enrollment_no: "gm7605",
      course_code: "MA101",
      grade: "7.0",
      grade_points: 7.0,
      academic_year: 2024,
      semester_type: 1
    }
  ]
});
```

## API Responses

### Prerequisite Check Response
```json
{
  "met": false,
  "missing": [
    {
      "course_code": "CS101",
      "course_name": "Programming Fundamentals",
      "min_grade": "5.0"
    }
  ]
}
```

### Grade Display
When displaying grades to students:
```typescript
// Backend sends: "8.5"
// Frontend displays: "8.5/10" or "8.5 CPI"
```

## Migration Notes

### If Changing from Letter Grades
If you previously used letter grades (A, B, C), you need to:

1. **Update existing data:**
```sql
UPDATE grade_records 
SET grade = '10.0', grade_points = 10.0 WHERE grade = 'A+';
UPDATE grade_records 
SET grade = '9.0', grade_points = 9.0 WHERE grade = 'A';
-- etc.
```

2. **Update prerequisites:**
```sql
UPDATE course_prerequisites 
SET min_grade = '5.0' WHERE min_grade = 'P';
UPDATE course_prerequisites 
SET min_grade = '7.0' WHERE min_grade = 'B';
-- etc.
```

## Best Practices

1. ✅ **Always store grades as strings:** `"7.5"`, not `7.5`
2. ✅ **Use one decimal place:** `"7.5"`, not `"7.50"` or `"7"`
3. ✅ **Validate range:** Ensure grades are between 0.0 and 10.0
4. ✅ **Store both fields:** `grade` (string) and `grade_points` (decimal)
5. ✅ **Use parseFloat:** When comparing grades
6. ✅ **Handle NaN:** Check for invalid grade values

## Validation Example

```typescript
function validateGrade(grade: string): boolean {
  const value = parseFloat(grade);
  
  // Check if valid number
  if (isNaN(value)) return false;
  
  // Check if in valid range
  if (value < 0 || value > 10) return false;
  
  return true;
}

// Usage
validateGrade("8.5")   // true ✅
validateGrade("10.0")  // true ✅
validateGrade("11.0")  // false ❌
validateGrade("ABC")   // false ❌
```

## Summary

- **Grades:** Numeric strings (0-10 scale)
- **Format:** `"7.5"`, `"8.0"`, `"10.0"`
- **Comparison:** Use `parseFloat()` and `>=`
- **CPI:** Weighted average of grade points
- **Prerequisites:** Numeric minimum requirements
- **Storage:** Both `grade` (string) and `grade_points` (decimal)
