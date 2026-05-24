# 🔐 IntelliMeet: Security Implementation & Supabase Migration Guide

**Purpose:** Step-by-step implementation guide for migrating to Supabase and implementing enterprise-grade security.

---

## Phase 1: Supabase Setup & Migration (Week 1)

### 1.1 Create Supabase Project

1. **Visit** [supabase.com](https://supabase.com) and sign up
2. **Create new project:**
   - Project Name: `intellmeet-prod`
   - Database Password: Generate strong password (24+ chars)
   - Region: Choose closest to your users (e.g., us-east-1)
   - Free tier supports ~500 concurrent connections
3. **Copy credentials** from project settings

### 1.2 Initialize Database Schema

**Step 1: Connect to your Supabase database**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref [YOUR_PROJECT_ID]
```

**Step 2: Create migrations directory**
```bash
mkdir backend/supabase/migrations
```

**Step 3: Create initial schema migration**
```bash
# Create migration
supabase migration new create_initial_schema
```

**Step 4: Copy schema from ARCHITECTURAL_REVIEW.md Section 2.2 into the migration file**

**Step 5: Push to Supabase**
```bash
supabase db push
```

### 1.3 Enable Row-Level Security (RLS)

```sql
-- Connect to Supabase SQL Editor and run:

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Example RLS Policy: Users table
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add more policies as shown in ARCHITECTURAL_REVIEW.md
```

### 1.4 Update Backend Configuration

**File: `backend/config/db.js`**

```javascript
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for backend
)

// For user-specific queries (with RLS)
export const createUserClient = (accessToken) => {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  )
}

export default supabase
```

**Update: `backend/.env`**

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc... # Service role key (keep secret!)
SUPABASE_ANON_KEY=eyJhbGc...    # Anonymous key (for browser)
SUPABASE_JWT_SECRET=your_jwt_secret_from_supabase
```

### 1.5 Migrate Data from MongoDB to PostgreSQL

**Create migration script: `backend/scripts/migrate-mongodb-to-supabase.js`**

```javascript
import mongoose from 'mongoose'
import { supabase } from '../config/db.js'

async function migrateData() {
  try {
    console.log('🔄 Starting data migration...')
    
    // 1. Migrate Users
    console.log('📤 Migrating users...')
    const users = await mongoose.model('User').find()
    const { error: userError } = await supabase
      .from('users')
      .insert(
        users.map(u => ({
          email: u.email,
          encrypted_password: u.password, // Already hashed
          full_name: u.name,
          avatar_url: u.avatar,
          created_at: u.createdAt,
          updated_at: u.updatedAt
        }))
      )
    if (userError) throw userError
    console.log(`✅ Migrated ${users.length} users`)
    
    // 2. Migrate Meetings
    console.log('📤 Migrating meetings...')
    const meetings = await mongoose.model('Meeting').find()
    const { error: meetingError } = await supabase
      .from('meetings')
      .insert(
        meetings.map(m => ({
          title: m.title,
          description: m.description,
          meeting_code: m.meetingCode,
          host_id: m.host, // Will need to map to user ID
          status: m.status,
          started_at: m.startedAt,
          ended_at: m.endedAt,
          duration_minutes: m.duration,
          transcript: m.transcript,
          created_at: m.createdAt,
          updated_at: m.updatedAt
        }))
      )
    if (meetingError) throw meetingError
    console.log(`✅ Migrated ${meetings.length} meetings`)
    
    // 3. Similar for Tasks, Messages, etc.
    
    console.log('✅ Migration complete!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run: node scripts/migrate-mongodb-to-supabase.js
migrateData()
```

**Run migration:**
```bash
node backend/scripts/migrate-mongodb-to-supabase.js
```

---

## Phase 2: Authentication Implementation (Week 2)

### 2.1 Update Auth Controller

**File: `backend/controllers/authController.js`**

```javascript
import { supabase } from '../config/db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

// SIGNUP
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body
    
    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Missing required fields' })
    }
    
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false
    })

    if (authError) {
      return res.status(400).json({ message: authError.message })
    }

    // Create user profile in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        encrypted_password: hashedPassword,
        full_name: name
      })
      .select()

    if (userError) {
      // Cleanup: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return res.status(500).json({ message: 'Failed to create user profile' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: authData.user.id,
        email: authData.user.email
      },
      process.env.SUPABASE_JWT_SECRET,
      { expiresIn: '1h' }
    )

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: authData.user.id },
      process.env.SUPABASE_JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'User created successfully',
      user: userData[0],
      tokens: { accessToken: token, refreshToken }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' })
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      // Log failed attempt for security audit
      await supabase.from('activity_logs').insert({
        action_type: 'failed_login',
        entity_type: 'user',
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      })
      
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Get user profile
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // Log successful login
    await supabase
      .from('users')
      .update({ last_login_at: new Date() })
      .eq('id', data.user.id)

    res.json({
      user: userData,
      tokens: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// REFRESH TOKEN
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' })
    }

    // Verify and decode refresh token
    const decoded = jwt.verify(refreshToken, process.env.SUPABASE_JWT_SECRET)

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.SUPABASE_JWT_SECRET,
      { expiresIn: '1h' }
    )

    res.json({ accessToken: newAccessToken })
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' })
  }
}

// GET CURRENT USER
export const getMe = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, created_at')
      .eq('id', req.user.id)
      .single()

    if (error) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export default { signup, login, refreshToken, getMe }
```

### 2.2 Create Auth Middleware

**File: `backend/middleware/authMiddleware.js`**

```javascript
import jwt from 'jsonwebtoken'

export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1]

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET)

    req.user = {
      id: decoded.id,
      email: decoded.email
    }

    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' })
    }
    res.status(401).json({ message: 'Invalid token' })
  }
}

export default verifyToken
```

### 2.3 Update Frontend Auth Service

**File: `frontend/src/services/auth.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000
})

// Add JWT to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token expiry
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken')
      
      if (refreshToken) {
        try {
          const { data } = await API.post('/auth/refresh-token', { refreshToken })
          localStorage.setItem('accessToken', data.accessToken)
          
          // Retry original request
          error.config.headers.Authorization = `Bearer ${data.accessToken}`
          return API(error.config)
        } catch (err) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authService = {
  async signup(email: string, password: string, fullName: string) {
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })

    if (error) throw error

    // Create profile via API
    const response = await API.post('/auth/signup', {
      name: fullName,
      email,
      password
    })

    localStorage.setItem('accessToken', response.data.tokens.accessToken)
    localStorage.setItem('refreshToken', response.data.tokens.refreshToken)

    return response.data
  },

  async login(email: string, password: string) {
    const { data } = await API.post('/auth/login', { email, password })

    localStorage.setItem('accessToken', data.tokens.accessToken)
    localStorage.setItem('refreshToken', data.tokens.refreshToken)

    return data
  },

  async logout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    await supabase.auth.signOut()
  },

  async getCurrentUser() {
    return API.get('/auth/me')
  }
}

export default authService
```

---

## Phase 3: Security Hardening (Week 2-3)

### 3.1 Input Validation & Sanitization

**File: `backend/middleware/validation.js`**

```javascript
import { body, param, validationResult } from 'express-validator'
import { escapeHtml } from '../utils/sanitize.js'

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array() 
    })
  }
  next()
}

// Meeting validation rules
export const validateMeetingCreation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 1, max: 255 }).withMessage('Title must be 1-255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description max 5000 characters'),
  body('scheduledTime')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  handleValidationErrors
]

// Task validation rules
export const validateTaskCreation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 1, max: 255 }).withMessage('Title must be 1-255 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  handleValidationErrors
]

// Message validation
export const validateMessage = [
  body('content')
    .trim()
    .notEmpty().withMessage('Message cannot be empty')
    .isLength({ max: 5000 }).withMessage('Message max 5000 characters'),
  handleValidationErrors
]

export default {
  validateMeetingCreation,
  validateTaskCreation,
  validateMessage,
  handleValidationErrors
}
```

**File: `backend/utils/sanitize.js`**

```javascript
export const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return escapeHtml(input.trim())
  }
  if (typeof input === 'object' && input !== null) {
    return Object.keys(input).reduce((acc, key) => {
      acc[key] = sanitizeInput(input[key])
      return acc
    }, {})
  }
  return input
}

export default { escapeHtml, sanitizeInput }
```

### 3.2 Rate Limiting

**File: `backend/middleware/rateLimiter.js`**

```javascript
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import redis from '../config/redis.js'

// General API rate limiter
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:api:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
})

// Strict limiter for authentication
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, try again later'
})

// Moderate limiter for file uploads
export const uploadLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:upload:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Upload limit exceeded'
})

// Tight limiter for password reset
export const passwordResetLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:password:'
  }),
  windowMs: 60 * 60 * 1000,
  max: 3,
  skipSuccessfulRequests: true,
  message: 'Too many password reset attempts'
})

export default {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  passwordResetLimiter
}
```

### 3.3 CORS Configuration

**File: `backend/middleware/cors.js`**

```javascript
import cors from 'cors'

const allowedOrigins = [
  'http://localhost:3000',
  'https://intellmeet.com',
  'https://www.intellmeet.com'
]

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
}

export default cors(corsOptions)
```

### 3.4 Security Headers

**File: `backend/middleware/securityHeaders.js`**

```javascript
import helmet from 'helmet'

export default helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://cdn.cloudinary.com"],
      connectSrc: ["'self'", "wss:", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
})
```

### 3.5 Update Server Entry Point

**File: `backend/server.js`** (Updated)

```javascript
import express from 'express'
import helmet from './middleware/securityHeaders.js'
import corsMiddleware from './middleware/cors.js'
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js'
import { validateMeetingCreation } from './middleware/validation.js'
import authRoutes from './routes/auth.js'
import meetingRoutes from './routes/meetingRoutes.js'
import taskRoutes from './routes/taskRoutes.js'
import aiRoutes from './routes/ai.js'

const app = express()

// Security middleware
app.use(helmet())
app.use(corsMiddleware)

// Body parser
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// Rate limiting
app.use('/api/', apiLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/signup', authLimiter)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/meetings', meetingRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/ai', aiRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})

export default app
```

---

## Phase 4: Audit Logging & Monitoring (Week 3)

### 4.1 Activity Logging Middleware

**File: `backend/middleware/activityLogger.js`**

```javascript
import { supabase } from '../config/db.js'

export const logActivity = async (req, res, next) => {
  const originalJson = res.json.bind(res)
  const startTime = Date.now()

  res.json = async function(body) {
    const duration = Date.now() - startTime

    // Log successful actions
    if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
      const actionType = `${req.method} ${req.path}`
      
      // Extract entity information
      let entityType = null
      let entityId = null

      if (req.path.includes('/meetings')) {
        entityType = 'meeting'
        entityId = req.params.id || req.body.meetingId
      } else if (req.path.includes('/tasks')) {
        entityType = 'task'
        entityId = req.params.id
      } else if (req.path.includes('/messages')) {
        entityType = 'message'
        entityId = req.params.id
      }

      // Log to database
      await supabase.from('activity_logs').insert({
        user_id: req.user.id,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        response_status: res.statusCode,
        response_time_ms: duration
      }).catch(console.error)
    }

    return originalJson(body)
  }

  next()
}

export default logActivity
```

### 4.2 Error Tracking with Sentry

**File: `backend/config/sentry.js`**

```javascript
import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'

export function initSentry(app) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Express({ app })
    ]
  })

  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.tracingHandler())
}

export function attachSentryErrorHandler(app) {
  app.use(Sentry.Handlers.errorHandler())
}

export default { initSentry, attachSentryErrorHandler }
```

---

## Phase 5: Testing & Validation (Week 4)

### 5.1 Security Testing Checklist

```bash
# 1. Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 2. Test rate limiting
for i in {1..10}; do
  curl http://localhost:5000/api/auth/login
done

# 3. Test CORS
curl -X OPTIONS http://localhost:5000/api/meetings \
  -H "Origin: https://unauthorized.com" \
  -H "Access-Control-Request-Method: POST"

# 4. Test XSS protection
curl -X POST http://localhost:5000/api/meetings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"<script>alert(1)</script>"}'

# 5. Scan dependencies
npm audit

# 6. Check for secrets
npm install -g detect-secrets
detect-secrets scan backend/
```

### 5.2 Deployment Checklist

- [ ] All environment variables set correctly
- [ ] Database migrations run successfully
- [ ] RLS policies tested and verified
- [ ] SSL certificate installed
- [ ] API rate limits configured
- [ ] Monitoring and alerting enabled
- [ ] Backup strategy implemented
- [ ] Load testing completed (target: 1000 concurrent users)
- [ ] Security audit completed
- [ ] Incident response plan documented

---

## Quick Reference: Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=your_jwt_secret

# Server
NODE_ENV=production
PORT=5000
API_URL=https://api.intellmeet.com

# Security
JWT_EXPIRE=1h
REFRESH_TOKEN_EXPIRE=7d
ENCRYPTION_KEY=your_32_byte_encryption_key

# External Services
GOOGLE_AI_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SENDGRID_API_KEY=...

# Monitoring
SENTRY_DSN=...

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=https://intellmeet.com
```

---

## Support & Resources

- **Supabase Docs:** [supabase.io/docs](https://supabase.io/docs)
- **JWT Best Practices:** [tools.ietf.org/html/rfc8725](https://tools.ietf.org/html/rfc8725)
- **OWASP Security:** [owasp.org/www-project-top-ten](https://owasp.org/www-project-top-ten)
- **Express Security:** [expressjs.com/en/advanced/best-practice-security.html](https://expressjs.com/en/advanced/best-practice-security.html)

**Last Updated:** May 17, 2026  
**Document Version:** 1.0
