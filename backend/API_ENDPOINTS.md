# API Endpoints Documentation

Base URL: `https://your-app.vercel.app` or `http://localhost:8000`

## Table of Contents
- [General](#general)
- [Authentication](#authentication)
- [Student Routes](#student-routes)
- [Course Routes](#course-routes)
- [Teacher Routes](#teacher-routes)
- [Admin Routes](#admin-routes)
- [Upload Routes](#upload-routes)
- [Registration Control](#registration-control)
- [Debug Routes](#debug-routes)

---

## General

### Health Check
```
GET /test
```
**Description:** Check if server is running  
**Auth Required:** No  
**Response:**
```json
{
  "message": "Server is running"
}
```

### Root Endpoint
```
GET /
```
**Description:** API information and available endpoints  
**Auth Required:** No  
**Response:**
```json
{
  "message": "Course Registration API",
  "status": "running",
  "endpoints": {
    "health": "/test",
    "auth": "/api/auth",
    "student": "/api/student",
    "courses": "/api/courses",
    "teacher": "/api/teacher",
    "upload": "/api/admin/upload",
    "registrationControl": "/api/registration-control"
  }
}
```

---

## Authentication

Base Path: `/api/auth`

### Request OTP
```
POST /api/auth/request-otp
```
**Description:** Request OTP for email verification  
**Auth Required:** No  
**Body:**
```json
{
  "email": "student@example.com"
}
```

### Verify OTP
```
POST /api/auth/verify-otp
```
**Description:** Verify OTP code  
**Auth Required:** No  
**Body:**
```json
{
  "email": "student@example.com",
  "otp": "123456"
}
```

### Register/Signup
```
POST /api/auth/register
```
**Description:** Register new student account  
**Auth Required:** No  
**Body:**
```json
{
  "enrollment_no": "22BXXXX",
  "faculty_no": "22FXXXX",
  "name": "Student Name",
  "email": "student@example.com",
  "password": "securePassword123"
}
```

### Login/Signin
```
POST /api/auth/login
```
**Description:** Login to account (student/teacher/admin)  
**Auth Required:** No  
**Method:** POST (NOT GET - must be POST request)  
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": false
}
```
**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "enrollmentNo": "22BXXXX",
    "name": "Student Name",
    "email": "student@example.com",
    "role": "student"
  }
}
```

**Note:** This endpoint only accepts POST requests. GET requests will return "Route not found" error.

### Forgot Password
```
POST /api/auth/forgot-password
```
**Description:** Request password reset token  
**Auth Required:** No  
**Body:**
```json
{
  "email": "user@example.com"
}
```

### Reset Password
```
POST /api/auth/reset-password
```
**Description:** Reset password using token  
**Auth Required:** No  
**Body:**
```json
{
  "token": "reset_token",
  "newPassword": "newSecurePassword123"
}
```

### Logout
```
POST /api/auth/logout
```
**Description:** Logout user  
**Auth Required:** No  
**Body:**
```json
{
  "email": "user@example.com"
}
```

---

## Student Routes

Base Path: `/api/student`  
**Auth Required:** Yes (Student role)  
**Header:** `Authorization: Bearer <token>`

### Get Dashboard
```
GET /api/student/dashboard
```
**Description:** Get student dashboard with current semester info, enrolled courses, and statistics

### Get Course History
```
GET /api/student/course-history
```
**Description:** Get all courses taken by student with grades

### Get Registration History
```
GET /api/student/registration-history
```
**Description:** Get complete registration history including dropped courses

---

## Course Routes

Base Path: `/api/courses`  
**Auth Required:** Yes (Student role)  
**Header:** `Authorization: Bearer <token>`

### Get Available Courses
```
GET /api/courses/available
```
**Description:** Get all courses available for registration based on student's semester and prerequisites  
**Query Parameters:**
- `semester` (optional): Filter by semester
- `branch` (optional): Filter by branch
- `isElective` (optional): Filter elective courses

### Register for Course
```
POST /api/courses/register
```
**Description:** Register for a course  
**Body:**
```json
{
  "courseCode": "CS101",
  "academicYear": 2024,
  "semesterType": 1
}
```

### Drop Course
```
DELETE /api/courses/drop/:courseCode
```
**Description:** Drop an enrolled course  
**URL Parameters:**
- `courseCode`: Course code to drop

### Get Enrolled Courses
```
GET /api/courses/enrolled
```
**Description:** Get all currently enrolled courses for the student

---

## Teacher Routes

Base Path: `/api/teacher`  
**Auth Required:** Yes (Teacher/Admin role)  
**Header:** `Authorization: Bearer <token>`

### Get Dashboard
```
GET /api/teacher/dashboard
```
**Description:** Get teacher dashboard with statistics and overview

### Get Students
```
GET /api/teacher/students
```
**Description:** Get list of all students  
**Query Parameters:**
- `semester` (optional): Filter by semester
- `branch` (optional): Filter by branch
- `isActive` (optional): Filter by active status

### Update Student Status
```
PUT /api/teacher/students/:enrollmentNo/status
```
**Description:** Update student active status (Admin only)  
**URL Parameters:**
- `enrollmentNo`: Student enrollment number  
**Body:**
```json
{
  "isActive": true
}
```

### Get Courses
```
GET /api/teacher/courses
```
**Description:** Get all courses  
**Query Parameters:**
- `semester` (optional): Filter by semester
- `branch` (optional): Filter by branch

### Get Approvals
```
GET /api/teacher/approvals
```
**Description:** Get pending course registration approvals (Admin only)

### Approve Registration
```
POST /api/teacher/approvals/:id/approve
```
**Description:** Approve a course registration (Admin only)  
**URL Parameters:**
- `id`: Registration ID

### Reject Registration
```
POST /api/teacher/approvals/:id/reject
```
**Description:** Reject a course registration (Admin only)  
**URL Parameters:**
- `id`: Registration ID  
**Body:**
```json
{
  "reason": "Does not meet prerequisites"
}
```

### Get Statistics
```
GET /api/teacher/reports/stats
```
**Description:** Get registration and course statistics

---

## Admin Routes

Base Path: `/api/teacher` (Admin-only endpoints)  
**Auth Required:** Yes (Admin role only)  
**Header:** `Authorization: Bearer <token>`

### Check Course Exists
```
GET /api/teacher/courses/check?courseCode=CS101
```
**Description:** Check if a course exists  
**Query Parameters:**
- `courseCode`: Course code to check

### Add Course
```
POST /api/teacher/courses
```
**Description:** Add a new course  
**Body:**
```json
{
  "courseCode": "CS101",
  "courseName": "Introduction to Programming",
  "credits": 4,
  "semesterNo": 1,
  "branchCode": "CS",
  "isElective": false,
  "courseType": "Theory"
}
```

### Update Course
```
PUT /api/teacher/courses/:courseCode
```
**Description:** Update course details  
**URL Parameters:**
- `courseCode`: Course code to update  
**Body:**
```json
{
  "courseName": "Updated Course Name",
  "credits": 4
}
```

### Delete Course
```
DELETE /api/teacher/courses/:courseCode
```
**Description:** Delete a course  
**URL Parameters:**
- `courseCode`: Course code to delete

### Add Prerequisite
```
POST /api/teacher/courses/:courseCode/prerequisites
```
**Description:** Add prerequisite to a course  
**URL Parameters:**
- `courseCode`: Course code  
**Body:**
```json
{
  "prerequisiteCourseCode": "CS100",
  "minGrade": "C"
}
```

### Update Prerequisite
```
PUT /api/teacher/courses/:courseCode/prerequisites/:prerequisiteCode
```
**Description:** Update prerequisite requirement  
**URL Parameters:**
- `courseCode`: Course code
- `prerequisiteCode`: Prerequisite course code  
**Body:**
```json
{
  "minGrade": "B"
}
```

### Delete Prerequisite
```
DELETE /api/teacher/courses/:courseCode/prerequisites/:prerequisiteCode
```
**Description:** Remove prerequisite from course  
**URL Parameters:**
- `courseCode`: Course code
- `prerequisiteCode`: Prerequisite course code

### Get Rules
```
GET /api/teacher/rules
```
**Description:** Get all registration rules

### Update Rule
```
PUT /api/teacher/rules/:ruleId
```
**Description:** Update a registration rule  
**URL Parameters:**
- `ruleId`: Rule ID  
**Body:**
```json
{
  "ruleValue": "24",
  "isActive": true
}
```

### Toggle Registration
```
POST /api/teacher/registration/toggle
```
**Description:** Enable/disable registration system  
**Body:**
```json
{
  "isActive": true
}
```

---

## Upload Routes

Base Path: `/api/admin/upload`  
**Auth Required:** Yes (Admin role only)  
**Header:** `Authorization: Bearer <token>`

### Test Upload Route
```
GET /api/admin/upload/test
```
**Description:** Test if upload routes are working

### Upload CSV
```
POST /api/admin/upload/csv
```
**Description:** Upload and process CSV file (students, courses, grades)  
**Content-Type:** `multipart/form-data`  
**Body:**
- `file`: CSV file (max 4.5MB)

**Response:**
```json
{
  "message": "CSV uploaded and processed successfully",
  "format": "students",
  "inserted": 150,
  "totalRows": 150
}
```

### Preview CSV
```
POST /api/admin/upload/preview
```
**Description:** Preview CSV file without inserting data  
**Content-Type:** `multipart/form-data`  
**Body:**
- `file`: CSV file (max 4.5MB)

**Response:**
```json
{
  "format": "students",
  "totalRows": 150,
  "preview": [...],
  "errors": [],
  "totalErrors": 0
}
```

---

## Registration Control

Base Path: `/api/registration-control`  
**Auth Required:** Yes (varies by endpoint)  
**Header:** `Authorization: Bearer <token>`

### Get All Phases
```
GET /api/registration-control/phases
```
**Description:** Get all registration phases (Admin only)

### Get Current Phase
```
GET /api/registration-control/current-phase
```
**Description:** Get currently active registration phase  
**Auth Required:** Yes (Any authenticated user)

### Update Phase
```
PUT /api/registration-control/phases/:phaseId
```
**Description:** Update a specific phase (Admin only)  
**URL Parameters:**
- `phaseId`: Phase ID  
**Body:**
```json
{
  "startDate": "2024-01-15T00:00:00Z",
  "endDate": "2024-01-30T23:59:59Z",
  "isEnabled": true
}
```

### Toggle Phase
```
POST /api/registration-control/phases/:phaseId/toggle
```
**Description:** Toggle phase active status (Admin only)  
**URL Parameters:**
- `phaseId`: Phase ID

### Bulk Update Phases
```
POST /api/registration-control/phases/bulk-update
```
**Description:** Update multiple phases at once (Admin only)  
**Body:**
```json
{
  "phases": [
    {
      "phaseId": 1,
      "startDate": "2024-01-15T00:00:00Z",
      "endDate": "2024-01-30T23:59:59Z",
      "isActive": true
    }
  ]
}
```

---

## Debug Routes

Base Path: `/api/debug`  
**Auth Required:** No

### Environment Check
```
GET /api/debug/env-check
```
**Description:** Check environment variables status (for debugging)  
**Response:**
```json
{
  "message": "Environment variables status",
  "environment": {
    "NODE_ENV": "production",
    "PORT": "3000",
    "DATABASE_URL": "✅ Set",
    "JWT_SECRET": "✅ Set",
    "SENDGRID_API_KEY": "✅ Set"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Roles
- **student**: Access to student and course routes
- **teacher**: Access to teacher routes (view-only)
- **admin**: Full access to all routes including admin operations

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Validation error",
  "message": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Route not found",
  "path": "/api/invalid",
  "method": "GET"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Something went wrong"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

---

## CORS

Allowed origins are configured in `src/app.ts`:
- http://localhost:8080
- http://localhost:8081
- http://localhost:5173
- https://course-registration-new.netlify.app
- Custom FRONTEND_URL from environment variables

---

## Notes

1. All timestamps are in ISO 8601 format
2. File uploads are limited to 4.5MB (Vercel limit)
3. JWT tokens expire based on configuration
4. Soft deletes are used for course registrations (deleted_at field)
