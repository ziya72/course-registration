# Authentication & Authorization Middleware

## Overview

This middleware system provides JWT-based authentication and role-based authorization with a hierarchical privilege system.

## Role Hierarchy

```
admin (Level 3)
  ↓ (superset of)
teacher (Level 2)
  ↓ (superset of)
student (Level 1)
```

- **Admin**: Can access admin, teacher, and student routes
- **Teacher**: Can access teacher and student routes  
- **Student**: Can only access student routes

## Middleware Functions

### 1. `authenticate`

Verifies JWT token and attaches user info to `req.user`.

**Usage:**
```typescript
import { authenticate } from './middlewares/auth.middleware';

router.get('/protected', authenticate, (req, res) => {
  // req.user is available here
  res.json({ user: req.user });
});
```

### 2. `authorize(allowedRoles)`

Checks if user has one of the allowed roles (respects hierarchy).

**Usage:**
```typescript
import { authenticate, authorize } from './middlewares/auth.middleware';

// Only teachers and admins can access
router.get('/students', authenticate, authorize(['teacher']), (req, res) => {
  // Admin can also access due to hierarchy
});

// Only admins can access
router.post('/create-teacher', authenticate, authorize(['admin']), (req, res) => {
  // Only admin role allowed
});

// Multiple roles
router.get('/dashboard', authenticate, authorize(['student', 'teacher', 'admin']), (req, res) => {
  // Any authenticated user can access
});
```

### 3. `studentOnly`

Ensures ONLY students can access (admin and teachers blocked).

**Usage:**
```typescript
import { authenticate, studentOnly } from './middlewares/auth.middleware';

router.get('/my-courses', authenticate, studentOnly, (req, res) => {
  // Only students can access
  const enrollmentNo = req.user!.enrollmentNo;
});
```

### 4. `teacherOnly`

Ensures teachers OR admins can access (admin is superset).

**Usage:**
```typescript
import { authenticate, teacherOnly } from './middlewares/auth.middleware';

router.post('/upload-grades', authenticate, teacherOnly, (req, res) => {
  // Teachers and admins can access
});
```

### 5. `adminOnly`

Ensures ONLY admins can access.

**Usage:**
```typescript
import { authenticate, adminOnly } from './middlewares/auth.middleware';

router.post('/create-user', authenticate, adminOnly, (req, res) => {
  // Only admins can access
});
```

### 6. `ownerOrAdmin`

Students can only access their own resources, teachers/admins can access all.

**Usage:**
```typescript
import { authenticate, ownerOrAdmin } from './middlewares/auth.middleware';

// Expects enrollmentNo in params or body
router.get('/student/:enrollmentNo/grades', authenticate, ownerOrAdmin, (req, res) => {
  // Students can only see their own grades
  // Teachers and admins can see any student's grades
});
```

## Request Object Extension

After `authenticate` middleware, `req.user` contains:

**For Students:**
```typescript
{
  enrollmentNo: string;
  role: "student";
}
```

**For Teachers/Admins:**
```typescript
{
  teacherId: number;
  role: "teacher" | "admin";
}
```

## Example Routes

### Student Routes
```typescript
// src/routes/student.routes.ts
import { Router } from 'express';
import { authenticate, studentOnly, ownerOrAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Student can view their own courses
router.get('/my-courses', authenticate, studentOnly, (req, res) => {
  const enrollmentNo = req.user!.enrollmentNo;
  // Fetch courses for this student
});

// Student can view their own grades, or teacher/admin can view any
router.get('/:enrollmentNo/grades', authenticate, ownerOrAdmin, (req, res) => {
  const enrollmentNo = req.params.enrollmentNo;
  // Fetch grades
});

export default router;
```

### Teacher Routes
```typescript
// src/routes/teacher.routes.ts
import { Router } from 'express';
import { authenticate, teacherOnly } from '../middlewares/auth.middleware';

const router = Router();

// Teachers and admins can view all students
router.get('/students', authenticate, teacherOnly, (req, res) => {
  // Fetch all students
});

// Teachers and admins can upload grades
router.post('/grades', authenticate, teacherOnly, (req, res) => {
  // Upload grades
});

export default router;
```

### Admin Routes
```typescript
// src/routes/admin.routes.ts
import { Router } from 'express';
import { authenticate, adminOnly } from '../middlewares/auth.middleware';

const router = Router();

// Only admins can create teachers
router.post('/teachers', authenticate, adminOnly, (req, res) => {
  // Create teacher account
});

// Only admins can manage system settings
router.put('/settings', authenticate, adminOnly, (req, res) => {
  // Update settings
});

export default router;
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

```json
{
  "error": "Token expired"
}
```

```json
{
  "error": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied",
  "message": "This route requires one of the following roles: teacher, admin"
}
```

```json
{
  "error": "Access denied",
  "message": "You can only access your own resources"
}
```

## Testing with REST Client

```http
### Login as Student
POST http://localhost:8000/auth/login
Content-Type: application/json

{
  "email": "gm0001@myamu.ac.in",
  "password": "Student@123"
}

### Use the token
@studentToken = <paste-token-here>

### Access Protected Route
GET http://localhost:8000/api/my-courses
Authorization: Bearer {{studentToken}}
```

## Best Practices

1. **Always use `authenticate` first** before any authorization middleware
2. **Use `authorize([])` for flexible role checking** with hierarchy
3. **Use specific middleware** (`studentOnly`, `teacherOnly`, `adminOnly`) when you need strict role enforcement
4. **Use `ownerOrAdmin`** for resource-specific access control
5. **Check `req.user` in your route handlers** to get user information

## Security Notes

- JWT tokens are verified on every request
- Expired tokens are automatically rejected
- Role hierarchy is enforced server-side
- Students cannot escalate privileges
- Admins have full access (superset of all roles)
