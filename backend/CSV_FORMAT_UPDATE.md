# CSV Upload Format Update - Students

## New Format (Updated)

```
Sem,Br,FacultyN,EnrolN,Name,semester_no,SPI,CPI,credit_earned,Hall,Remark
```

### Field Details

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| Sem | String | ✅ Yes | Semester code (SYYYY[S]T) | S24252 |
| Br | String | ✅ Yes | Branch code | CS, EE, ME, EC, CH, CE |
| FacultyN | String | ✅ Yes | Faculty number | 24COBEA001 |
| EnrolN | String | ✅ Yes | Enrollment number | gm8001 |
| Name | String | ✅ Yes | Student name | Amit Kumar |
| semester_no | Integer | ✅ Yes | Current semester (1-8) | 2 |
| SPI | Decimal | ❌ No | Semester Performance Index (0-10) | 8.5 |
| CPI | Decimal | ❌ No | Cumulative Performance Index (0-10) | 8.2 |
| credit_earned | Decimal | ❌ No | Total credits earned | 45.5 |
| Hall | String | ❌ No | Hostel/Hall name | Aftab Hall |
| Remark | String | ❌ No | Any remarks or notes | Good standing |

## Previous Format (Old)

```
Sem,Br,FacultyN,EnrolN,Name,semester_no,Hall
```

## Key Changes

### 1. New Fields Added
- **SPI**: Semester Performance Index (optional)
- **CPI**: Cumulative Performance Index (optional)
- **credit_earned**: Total credits earned (optional)
- **Remark**: Remarks or notes (optional)

### 2. Auto-Calculation Logic
- If **CPI** is not provided → System calculates from grade records
- If **credit_earned** is not provided → System calculates from grade records
- If **CPI** is provided in CSV → Uses CSV value (no calculation)
- If **credit_earned** is provided in CSV → Uses CSV value (no calculation)

### 3. Header Detection
- **Header is OPTIONAL** - System auto-detects if first row is header
- If header present → Uses column names from CSV
- If no header → Uses default column positions (fixed order)
- Column order MUST be maintained when no header is used

## Database Changes

### New Fields in Student Table
```sql
current_spi    DECIMAL(6,3) DEFAULT 0.000
remark         TEXT
```

### Migration Applied
```
20260316190521_add_spi_and_remark_to_student
```

## Examples

### Example 1: With All Fields
```csv
Sem,Br,FacultyN,EnrolN,Name,semester_no,SPI,CPI,credit_earned,Hall,Remark
S24252,CS,24COBEA001,gm8001,Amit Kumar,2,8.5,8.2,45.5,Aftab Hall,Good standing
```

### Example 2: With Auto-Calculation (No CPI/Credits)
```csv
Sem,Br,FacultyN,EnrolN,Name,semester_no,SPI,CPI,credit_earned,Hall,Remark
S24251,EE,24EEBEA002,gm8002,Priya Sharma,3,9.0,,,SS Hall,CPI will be calculated
```

### Example 3: Without Header
```csv
S24252,CS,24COBEA001,gm8001,Amit Kumar,2,8.5,8.2,45.5,Aftab Hall,Good standing
S24251,EE,24EEBEA002,gm8002,Priya Sharma,3,9.0,8.8,68.0,SS Hall,
```

### Example 4: Minimal Required Fields Only
```csv
Sem,Br,FacultyN,EnrolN,Name,semester_no,SPI,CPI,credit_earned,Hall,Remark
S24252,ME,24MEBEA003,gm8003,Rahul Singh,4,,,,,
```

## Testing

### Test Files Created
1. `test-data/test-students-new-format.csv` - With headers, mixed data
2. `test-data/test-students-no-header.csv` - Without headers

### How to Test
1. Upload `test-students-new-format.csv` via frontend
2. Check preview shows correct data
3. Process upload
4. Verify database has SPI, CPI, credit_earned, and Remark fields populated

## Backward Compatibility

⚠️ **Breaking Change**: Old 7-column format will NOT work anymore
- Old format: `Sem,Br,FacultyN,EnrolN,Name,semester_no,Hall`
- New format: `Sem,Br,FacultyN,EnrolN,Name,semester_no,SPI,CPI,credit_earned,Hall,Remark`

**Migration Required**: Update all existing CSV files to new 11-column format

## Implementation Files Changed

1. **Backend**
   - `prisma/schema.prisma` - Added `current_spi` and `remark` fields
   - `src/services/csv-upload-v2.service.ts` - Updated parsing and processing logic
   
2. **Frontend**
   - `src/components/CSVUploadV2.tsx` - Updated schema guide and format description

## Notes

- Empty optional fields can be left blank (e.g., `,,` for consecutive empty fields)
- SPI range: 0.000 to 10.000 (3 decimal places)
- CPI range: 0.000 to 10.000 (3 decimal places)
- credit_earned: Up to 1 decimal place (e.g., 45.5)
- Remark: Any text, no length limit
- System prioritizes CSV values over calculated values
