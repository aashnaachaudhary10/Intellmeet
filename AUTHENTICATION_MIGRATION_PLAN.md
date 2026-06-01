# JWT Authentication Implementation Plan with Prisma + PostgreSQL + Zod

---

## 📊 CURRENT STATE ANALYSIS

### **Database Currently Used: MongoDB (NOT PostgreSQL)**
- **Status**: Active Mongoose models connecting to local MongoDB (127.0.0.1:27017)
- **Neon PostgreSQL**: Configured in .env but NOT connected or used
- **Connection File**: `backend/config/db.js` is empty (no initialization code)

### **Current Data Stored in MongoDB**

#### 1. **User Collection**
```
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypt hashed),
  avatar: String (default: ""),
  timestamps: { createdAt, updatedAt }
}
```

#### 2. **Meeting Collection**
```
{
  _id: ObjectId,
  title: String,
  description: String,
  meetingCode: String (unique),
  host: String,
  participants: [String],
  status: enum["scheduled", "active", "ended"],
  startedAt: Date,
  endedAt: Date,
  duration: Number,
  transcript: String,
  recordingFolder: String,
  recordingParts: [
    {
      key, url, name, size, partNumber, uploadedBy, uploadedByName,
      uploadedAt, transcribed, transcript
    }
  ],
  summary: String,
  keyPoints: [String],
  actionItems: [{ task, assignee, dueDate, status }],
  timestamps: { createdAt, updatedAt }
}
```

#### 3. **Task Collection**
```
{
  _id: ObjectId,
  title: String,
  description: String,
  status: enum["todo", "in-progress", "done"],
  user: ObjectId (ref to User),
  meetingId: ObjectId (ref to Meeting),
  timestamps: { createdAt, updatedAt }
}
```

---

## 🔐 CURRENT AUTHENTICATION ANALYSIS

### **Backend (Express.js)**

#### **Implemented Features:**
- ✅ JWT Token Generation (1 day expiry)
- ✅ bcrypt Password Hashing
- ✅ Signup endpoint with duplicate email check
- ✅ Login endpoint with credential validation
- ✅ Basic auth middleware (Bearer token verification)
- ✅ Password removal from responses

#### **Missing/Broken Features:**
- ❌ **NO INPUT VALIDATION** (Zod schemas)
- ❌ **NO REFRESH TOKEN MECHANISM** (tokens can't be renewed)
- ❌ **NO LOGOUT ENDPOINT** (tokens live until expiry)
- ❌ **NO ERROR STANDARDIZATION** (inconsistent error responses)
- ❌ **NO PASSWORD RESET FUNCTIONALITY**
- ❌ **NO EMAIL VERIFICATION**
- ❌ **NO ROLE-BASED ACCESS CONTROL (RBAC)**
- ❌ **NO INPUT SANITIZATION**
- ❌ **NO RATE LIMITING ON AUTH ENDPOINTS** (only on /api/auth path)
- ❌ **NO ACCOUNT LOCKOUT** after failed login attempts

#### **Current Auth Flow:**
```
POST /api/auth/signup → User.findOne({email}) → bcrypt.hash() → User.create() → Response
POST /api/auth/login  → User.findOne({email}) → bcrypt.compare() → jwt.sign() → Response with token
GET  /api/auth/me     → jwt.verify() → User.findById() → Response (no password)
PUT  /api/auth/update → jwt.verify() → User.findById() → Update fields → Response
```

#### **Current Middleware:**
```javascript
// authMiddleware.js
- Extracts token from "Authorization: Bearer <token>"
- Verifies JWT with JWT_SECRET
- Sets req.user = decoded (contains user ID)
- No role/permission checking
```

### **Frontend (React + TypeScript)**

#### **Current Issues:**
- ❌ **FAKE LOGIN IMPLEMENTATION** (Auth.tsx has hardcoded fake token!)
  ```typescript
  const fakeToken = "fake-jwt-token";
  const fakeUser = { id: "1", name: formData.name, email: formData.email };
  ```
- ❌ **NO ACTUAL API INTEGRATION** (not calling /api/auth/signup or /api/auth/login)
- ❌ **NO INPUT VALIDATION** on form submission
- ❌ **NO ERROR DISPLAY** for auth failures
- ❌ **NO FORM STATE VALIDATION**
- ❌ **NO PASSWORD STRENGTH METER**
- ❌ **NO EMAIL FORMAT VALIDATION**

#### **Current Frontend Auth Store:**
```typescript
// authStore.ts (Zustand)
- user: User | null
- token: string | null
- setUser() - saves to localStorage
- logout() - removes from localStorage
- NO refresh token handling
- NO auto-logout on token expiry
```

#### **Current API Setup:**
```typescript
// api.ts
- Axios interceptor adds "Authorization: Bearer <token>" header
- On 401 response: removes token and redirects to /login
- signup() and login() methods exist but NOT called in Auth.tsx
```

---

## 🗺️ MIGRATION REQUIREMENTS

### **PostgreSQL Schema Mapping**

All MongoDB collections will map to PostgreSQL tables:

| MongoDB | PostgreSQL | Relationship |
|---------|-----------|--------------|
| User | users | Primary entity |
| Meeting | meetings | One user has many meetings |
| Task | tasks | One user has many tasks, One meeting has many tasks |
| N/A | refresh_tokens | NEW: Store refresh tokens with expiry |
| N/A | email_verifications | NEW: Email verification tokens |
| N/A | password_resets | NEW: Password reset requests |

---

## 📋 COMPREHENSIVE IMPLEMENTATION PLAN

### **PHASE 1: Database & ORM Setup**

#### **1.1 Initialize Prisma**
- [ ] Install Prisma dependencies
- [ ] Create `prisma/schema.prisma` with all models
- [ ] Configure PostgreSQL connection string in .env
- [ ] Run migrations to create tables

#### **1.2 Prisma Schema Models**
```prisma
model User {
  id                  Int      @id @default(autoincrement())
  email               String   @unique
  name                String
  password            String   // bcrypt hashed
  avatar              String   @default("")
  role                String   @default("member") // "admin", "member"
  isEmailVerified     Boolean  @default(false)
  emailVerificationToken String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  meetings            Meeting[]
  tasks               Task[]
  refreshTokens       RefreshToken[]
  emailVerifications  EmailVerification[]
  passwordResets      PasswordReset[]
}

model Meeting {
  id                  Int      @id @default(autoincrement())
  title               String
  description         String   @default("")
  meetingCode         String   @unique
  hostId              Int
  host                User     @relation(fields: [hostId], references: [id], onDelete: Cascade)
  participants        String   @default("[]") // JSON array as string
  status              String   @default("scheduled") // "scheduled", "active", "ended"
  startedAt           DateTime?
  endedAt             DateTime?
  duration            Int      @default(0) // in minutes
  transcript          String   @default("")
  recordingFolder     String   @default("")
  recordingParts      String   @default("[]") // JSON array as string
  summary             String   @default("")
  keyPoints           String   @default("[]") // JSON array
  actionItems         String   @default("[]") // JSON array
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  tasks               Task[]
}

model Task {
  id                  Int      @id @default(autoincrement())
  title               String
  description         String   @default("")
  status              String   @default("todo") // "todo", "in-progress", "done"
  userId              Int
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  meetingId           Int?
  meeting             Meeting? @relation(fields: [meetingId], references: [id], onDelete: SetNull)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model RefreshToken {
  id                  Int      @id @default(autoincrement())
  token               String   @unique
  userId              Int
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt           DateTime
  createdAt           DateTime @default(now())
}

model EmailVerification {
  id                  Int      @id @default(autoincrement())
  token               String   @unique
  userId              Int
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt           DateTime
  createdAt           DateTime @default(now())
}

model PasswordReset {
  id                  Int      @id @default(autoincrement())
  token               String   @unique
  userId              Int
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt           DateTime
  createdAt           DateTime @default(now())
}
```

---

### **PHASE 2: Backend - Zod Validation Schemas**

#### **2.1 Create Validation Schemas** (`backend/validators/authValidators.ts`)

```typescript
// Schemas needed:
1. SignupSchema
   - email: string, email format, max 255 chars
   - password: string, min 8 chars, must have uppercase, lowercase, number, special char
   - name: string, min 2, max 100 chars

2. LoginSchema
   - email: string, email format
   - password: string, min 1 char

3. UpdateProfileSchema
   - name: string (optional), min 2, max 100
   - avatar: string (optional), URL format

4. RefreshTokenSchema
   - refreshToken: string, non-empty

5. PasswordResetSchema
   - email: string, email format

6. ConfirmPasswordResetSchema
   - token: string
   - newPassword: string (same rules as signup password)
```

---

### **PHASE 3: Backend - Authentication Endpoints**

#### **3.1 New/Updated Endpoints**

```
1. POST /api/auth/signup
   - Input: { email, password, name }
   - Validation: SignupSchema (Zod)
   - Logic: 
     a. Check if user exists
     b. Hash password with bcrypt
     c. Create user in PostgreSQL
     d. Generate access token (15 min) & refresh token (7 days)
     e. Store refresh token in DB
     f. Return { accessToken, refreshToken, user }
   - Errors: 400 (user exists), 422 (validation), 500 (DB)

2. POST /api/auth/login
   - Input: { email, password }
   - Validation: LoginSchema (Zod)
   - Logic:
     a. Find user by email
     b. Verify password with bcrypt
     c. Generate new access & refresh tokens
     d. Store refresh token in DB
     e. Return { accessToken, refreshToken, user }
   - Errors: 401 (invalid credentials), 422 (validation), 500

3. POST /api/auth/refresh
   - Input: { refreshToken }
   - Logic:
     a. Verify refresh token exists in DB
     b. Check if not expired
     c. Generate new access token (15 min)
     d. Return { accessToken }
   - Errors: 401 (invalid/expired token), 500

4. POST /api/auth/logout
   - Input: { refreshToken }
   - Logic:
     a. Delete refresh token from DB
     b. Return { success: true }
   - Errors: 400 (no token), 500

5. POST /api/auth/forgot-password
   - Input: { email }
   - Logic:
     a. Find user by email
     b. Generate reset token (1 hour expiry)
     c. Store in passwordResets table
     d. Send email with reset link (TODO: implement email service)
     e. Return { message: "Reset email sent" }
   - Errors: 404 (user not found), 500

6. POST /api/auth/reset-password
   - Input: { token, newPassword }
   - Validation: ConfirmPasswordResetSchema (Zod)
   - Logic:
     a. Verify reset token exists and not expired
     b. Hash new password
     c. Update user password
     d. Delete reset token
     e. Return { message: "Password reset" }
   - Errors: 401 (invalid/expired token), 422 (validation), 500

7. POST /api/auth/verify-email
   - Input: { token }
   - Logic:
     a. Verify token exists and not expired
     b. Mark user.isEmailVerified = true
     c. Delete verification token
     d. Return { message: "Email verified" }
   - Errors: 401 (invalid/expired token), 500

8. GET /api/auth/me (EXISTING - UPDATE)
   - Auth Required: YES
   - Logic: Return current user (from JWT payload)
   - Errors: 401 (no token), 500

9. PUT /api/auth/update (EXISTING - UPDATE)
   - Input: { name?, avatar? } (multipart form-data for file)
   - Validation: UpdateProfileSchema (Zod)
   - Auth Required: YES
   - Logic: Update user fields
   - Errors: 401 (unauthorized), 422 (validation), 500
```

---

### **PHASE 4: Backend - Middleware & Error Handling**

#### **4.1 Enhanced Auth Middleware**

```typescript
// authMiddleware.ts
- Extract token from "Authorization: Bearer <token>"
- Verify JWT with JWT_SECRET
- Check token expiry (15 min)
- If expired: Return 401 with message "Token expired"
- If invalid: Return 401 with message "Invalid token"
- Set req.user = { id, email, role }
- Continue to next middleware
```

#### **4.2 Error Handler Middleware**

```typescript
// errorHandler.ts
- Catch all errors
- Standardize response format:
  {
    success: false,
    message: string,
    errors?: { field: [errors] } // from Zod
    code: number
  }
```

#### **4.3 Validation Middleware**

```typescript
// validateRequest.ts(schema)
- Validate req.body, req.params, req.query with Zod
- Return 422 with detailed error messages if validation fails
```

---

### **PHASE 5: Frontend - Form Validation with Zod**

#### **5.1 Create Frontend Validation Schemas** (`frontend/src/validators/authValidators.ts`)

```typescript
// Same validation rules as backend but implemented with Zod
1. SignupFormSchema
2. LoginFormSchema
3. UpdateProfileSchema
```

#### **5.2 Frontend Form Components**

```typescript
// Update Auth.tsx component:
1. Implement ACTUAL signup/login API calls (not fake!)
2. Add Zod validation on form submission
3. Display validation errors under form fields
4. Add loading states during API calls
5. Handle and display API error responses
6. Add password strength indicator
7. Add "Remember me" functionality (optional)
```

#### **5.3 Update Frontend Auth Store**

```typescript
// authStore.ts enhancements:
1. Add accessToken & refreshToken management
2. Add auto-refresh token logic (refresh before expiry)
3. Add logout logic (clear tokens)
4. Add isAuthenticated computed property
5. Add interceptor for token refresh on 401
```

---

### **PHASE 6: Frontend - API Integration**

#### **6.1 Update API Service** (`frontend/src/services/api.ts`)

```typescript
1. Update signup() to actually call backend
2. Update login() to actually call backend
3. Add logout() implementation
4. Add refresh() token function
5. Update interceptors:
   - Before request: Add accessToken to header
   - On 401: Attempt to refresh token
   - If refresh fails: Clear auth and redirect to login
   - On 422: Extract validation errors
```

---

### **PHASE 7: Database Migration**

#### **7.1 Data Migration from MongoDB to PostgreSQL**

```typescript
// Migration script needed:
1. Connect to MongoDB and PostgreSQL simultaneously
2. For each collection:
   a. Read all documents
   b. Transform data format (ObjectId → Int id, etc.)
   c. Handle relationships (references)
   d. Insert into PostgreSQL
   e. Verify count matches
3. Validate foreign key relationships
4. Test all queries work as expected
```

---

### **PHASE 8: Environment & Configuration**

#### **8.1 Update .env file structure**

```env
# Database
DATABASE_URL=postgresql://neondb_owner:npg_HONG6vquE7yw@ep-lingering-dream-aqvsswgy.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Backend
PORT=5000
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:5000/api

# Other services (unchanged)
GEMINI_API_KEY=...
CLOUDINARY_*=...
```

---

## 🔄 DATA MIGRATION STRATEGY

### **Step-by-Step Migration**

1. **Backup MongoDB**: Create full dump of current MongoDB
2. **Create PostgreSQL Schema**: Run Prisma migrations
3. **Write Migration Script**: Transform and migrate data
   - Users: Preserve all fields, add `isEmailVerified=false`, `role='member'`
   - Meetings: Map hostId to new user IDs, convert ObjectIds
   - Tasks: Map userId and meetingId to new IDs
4. **Verify Data Integrity**: Count matching records, verify relationships
5. **Run Tests**: Test all queries and relationships work
6. **Switch Connection**: Update backend to use Prisma client
7. **Parallel Testing**: Run both databases for 24h before full switch
8. **Cleanup**: Remove MongoDB connection once verified

---

## ✅ IMPLEMENTATION CHECKLIST

### **Backend Setup**
- [ ] Install Prisma, @prisma/client, zod
- [ ] Create Prisma schema
- [ ] Run migrations (create tables)
- [ ] Create validation schemas
- [ ] Update auth controller with new logic
- [ ] Create new endpoints (refresh, logout, forgot-password, etc.)
- [ ] Create error handling middleware
- [ ] Create validation middleware
- [ ] Update auth middleware
- [ ] Write migration script
- [ ] Test all auth flows

### **Frontend Setup**
- [ ] Create frontend Zod schemas
- [ ] Update API service with real calls
- [ ] Update Auth.tsx component
- [ ] Add form validation
- [ ] Add error display
- [ ] Update auth store
- [ ] Update axios interceptors
- [ ] Test all auth flows
- [ ] Test token refresh mechanism
- [ ] Test error handling

### **Database**
- [ ] Backup MongoDB
- [ ] Create PostgreSQL tables
- [ ] Migrate data
- [ ] Verify integrity
- [ ] Update connection strings
- [ ] Test queries

---

## 🎯 SECURITY CONSIDERATIONS

1. **Password Hashing**: bcrypt with salt rounds = 10
2. **JWT Tokens**: 
   - Access token: 15 minutes (short-lived)
   - Refresh token: 7 days (stored in DB with user reference)
3. **HTTPS Only**: Set HttpOnly, Secure, SameSite cookies for tokens
4. **Rate Limiting**: Apply to signup, login, password reset endpoints
5. **Input Validation**: All inputs validated with Zod
6. **SQL Injection**: Prisma prevents via parameterized queries
7. **CORS**: Already configured in backend
8. **Account Lockout**: Lock account after 5 failed login attempts for 15 minutes
9. **Email Verification**: Send verification email before account activation
10. **Password Reset**: Tokens expire in 1 hour, one-time use only

---

## 📊 FILE STRUCTURE CHANGES

```
backend/
  ├── prisma/
  │   └── schema.prisma (NEW)
  ├── migrations/ (NEW - auto-generated)
  ├── validators/ (NEW)
  │   └── authValidators.ts
  ├── middleware/
  │   ├── authMiddleware.ts (UPDATED)
  │   ├── errorHandler.ts (NEW)
  │   └── validateRequest.ts (NEW)
  ├── controllers/
  │   └── authController.ts (UPDATED - new endpoints)
  ├── routes/
  │   └── auth.ts (UPDATED - new routes)
  ├── config/
  │   ├── db.ts (NEW - Prisma client initialization)
  │   └── ... (existing)
  ├── utils/
  │   ├── jwt.ts (NEW - token generation/verification)
  │   ├── password.ts (NEW - hashing utility)
  │   └── ... (existing)
  └── scripts/
      └── migrateMongoToPSQL.ts (NEW - migration script)

frontend/src/
  ├── validators/ (NEW)
  │   └── authValidators.ts
  ├── services/
  │   └── api.ts (UPDATED)
  ├── pages/
  │   └── Auth.tsx (UPDATED)
  └── store/
      └── authStore.ts (UPDATED)
```

---

## ⏱️ ESTIMATED TIMELINE

| Phase | Task | Days |
|-------|------|------|
| 1 | Prisma setup & schema creation | 1 |
| 2 | Backend validation schemas | 1 |
| 3 | Backend endpoints implementation | 2 |
| 4 | Middleware & error handling | 1 |
| 5 | Frontend validation schemas | 1 |
| 6 | Frontend form components | 2 |
| 7 | API integration & testing | 2 |
| 8 | Database migration | 1 |
| 9 | Integration testing & bug fixes | 2 |
| 10 | Deployment & monitoring | 1 |
| **Total** | | **14 days** |

---

## 🚨 RISKS & MITIGATIONS

| Risk | Mitigation |
|------|-----------|
| Data loss during migration | Backup MongoDB, test migration on copy first |
| Breaking existing features | Run both DBs in parallel, comprehensive testing |
| Token expiry issues | Implement auto-refresh, clear error messages |
| Frontend breaks | Keep old API endpoints during transition period |
| Performance degradation | Add database indexes, monitor queries |
| Security vulnerabilities | Code review, OWASP checklist, penetration testing |

---

## 📝 NOTES

1. **MongoDB still running**: Current backend still connects to MongoDB. Don't shut it down until migration is complete and verified.
2. **Neon PostgreSQL ready**: Connection string is already in .env, just needs to be used.
3. **No data loss**: All MongoDB data will be migrated to PostgreSQL.
4. **Backward compatibility**: Consider maintaining API compatibility during transition.
5. **Testing critical**: Comprehensive testing required for authentication flows.

---

**Status**: 🔍 ANALYSIS COMPLETE - READY FOR IMPLEMENTATION
**Next Step**: Approval to proceed with Phase 1 (Prisma Setup)
