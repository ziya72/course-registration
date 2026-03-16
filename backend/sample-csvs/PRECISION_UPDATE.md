# Database Precision Update

## Changes Made

Updated decimal field precision in the database schema to match academic requirements:

### ✅ **Credits: 1 Decimal Place**
- **Field**: `Course.credits`, `Student.total_earned_credits`, `SemesterResult.total_credits_earned`
- **Precision**: `@db.Decimal(3, 1)` or `@db.Decimal(4, 1)`
- **Examples**: `3.5`, `48.5`, `160.0`
- **Range**: Up to 99.9 or 999.9

### ✅ **CPI/SPI: 3 Decimal Places**
- **Fields**: `Student.current_cpi`, `SemesterResult.spi`, `SemesterResult.cpi`
- **Precision**: `@db.Decimal(6, 3)`
- **Examples**: `8.567`, `7.234`, `9.123`
- **Range**: Up to 999.999

### ✅ **Grade Points: 2 Decimal Places**
- **Field**: `GradeRecord.grade_points`
- **Precision**: `@db.Decimal(4, 2)`
- **Examples**: `10.00`, `9.00`, `8.00`
- **Range**: Up to 99.99

## Database Migration

Migration applied: `20260313090524_update_decimal_precision`

```sql
-- Example of changes made:
ALTER TABLE "Student" ALTER COLUMN "current_cpi" TYPE DECIMAL(6,3);
ALTER TABLE "Course" ALTER COLUMN "credits" TYPE DECIMAL(3,1);
-- ... and other fields
```

## Updated Sample Files

All CSV sample files have been updated to reflect the new precision:

### Students CSV Examples:
```csv
# Before
S2425,CE,24CEBEA001,gm7001,Arjun Kumar,4,Morrison Court,8.5,8.2,48,Pass

# After
S2425,CE,24CEBEA001,gm7001,Arjun Kumar,4,Morrison Court,8.567,8.234,48.5,Pass
```

### Courses CSV Examples:
```csv
# Before
CS101,Programming Fundamentals,3.0,1,CE,false,,,Theory,60,true

# After
CS101,Programming Fundamentals,3.5,1,CE,false,,,Theory,60,true
```

## Frontend Updates

Updated CSV format guides in the frontend to show:
- SPI/CPI examples with 3 decimal places
- Credits examples with 1 decimal place
- Added precision notes in the help text

## Validation Impact

The system will now:
- ✅ Accept values like `8.567` for CPI/SPI
- ✅ Accept values like `3.5` for credits
- ❌ Reject values with too many decimal places
- ❌ Reject values that exceed the precision limits

## Testing

Use the updated sample CSV files to test:
- `students-valid.csv` - Contains 3-decimal CPI/SPI values
- `courses-valid.csv` - Contains 1-decimal credit values
- `students-branch-change-*.csv` - Updated with new precision

## Benefits

1. **Academic Accuracy**: Supports precise GPA calculations
2. **Data Consistency**: Enforces uniform decimal precision
3. **Storage Efficiency**: Optimized database storage
4. **Validation**: Automatic precision validation at database level