# IntelliMeet - Professional README

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/intellmeet.git
cd Intellmeet

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup environment variables
# Backend: cp backend/.env.example backend/.env
# Frontend: cp frontend/.env.example frontend/.env

# Start development servers
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev

# Application will be available at http://localhost:3000
```

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [API Documentation](#api-documentation)
8. [Development](#development)
9. [Deployment](#deployment)
10. [Contributing](#contributing)
11. [License](#license)

---

## 📖 Project Overview

**IntelliMeet** is an AI-powered real-time meeting and collaboration platform that enhances productivity through seamless video conferencing, real-time communication, meeting intelligence, and intelligent task management.

### Vision
To revolutionize remote work by providing teams with tools that not only connect people but also capture insights, automate follow-ups, and drive actionable outcomes from every meeting.

### Target Users
- **Remote Teams:** Distributed companies needing seamless collaboration
- **Enterprises:** Large organizations requiring security, audit trails, and compliance
- **Agencies:** Service providers managing client meetings and deliverables
- **Educators:** Instructors conducting online classes with engagement tracking

### Key Metrics
- **Real-time Collaboration:** < 100ms latency for video/audio
- **Scalability:** Support 10,000+ concurrent meetings
- **Reliability:** 99.9% uptime SLA
- **Performance:** Page load < 2 seconds

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based authentication** with refresh token rotation
- **Password security:** bcrypt hashing (12 rounds minimum)
- **Protected routes** with middleware-based authorization
- **Rate limiting** to prevent brute-force attacks
- **OAuth 2.0** integration (Google, Microsoft, SSO)
- **Two-factor authentication** (2FA/MFA support)

### 👥 User Management
- **Profile management:** Create, update, view user profiles
- **Avatar upload:** Cloudinary integration for image storage
- **User settings:** Preferences, notifications, theme selection
- **Role-based access:** Admin, host, participant roles

### 📅 Meeting Management
- **Create & schedule meetings** with auto-generated meeting codes
- **Join meetings** by code or direct link
- **Meeting history** with metadata and timestamps
- **Scheduling assistant** with conflict detection (planned)
- **Meeting lifecycle:** Scheduled → Active → Ended/Cancelled

### 🎥 Real-Time Collaboration
- **WebRTC-based video/audio** with peer-to-peer communication
- **Audio/video controls:** Mute, camera toggle, quality settings
- **Screen sharing:** Share entire screen or specific windows
- **Presence indicators:** Live participant tracking
- **Typing indicators:** Show who's composing messages

### 💬 Instant Communication
- **Socket.io-powered chat:** Real-time messaging
- **Message history:** Persistent chat for future reference
- **Notifications:** Real-time alerts for new messages, participants
- **Emoji & rich text:** Enhanced message formatting
- **Media sharing:** Share images and files in chat

### 🤖 AI-Powered Intelligence
- **Meeting transcription:** Automatic speech-to-text
- **AI-generated summaries:** Key points extracted automatically
- **Action item extraction:** Auto-identify and assign tasks
- **Sentiment analysis:** Emotion detection from conversation
- **Meeting insights:** Speaker stats, engagement metrics (planned)

### 📊 Task & Project Management
- **Kanban board:** Visualize tasks in todo/in-progress/done
- **Task assignment:** Assign to team members with due dates
- **Meeting-linked tasks:** Tasks created from action items
- **Progress tracking:** Monitor task status and completion
- **Priority levels:** Low, medium, high, critical

### 📈 Analytics & Insights
- **Meeting analytics:** Participant count, duration, engagement
- **Speaker insights:** Talk time, interruptions, key speakers
- **Team metrics:** Meeting frequency, average duration
- **Usage trends:** Monthly/quarterly analytics
- **Export reports:** PDF/CSV exports for presentations

---

## 🏗️ Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React/TypeScript)           │
│  Dashboard │ MeetingRoom │ KanbanBoard │ Analytics      │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼──────────────┐
        │            │              │
    ┌───▼───┐   ┌───▼────┐    ┌───▼──┐
    │ REST  │   │WebSocket│   │ gRPC │
    │ API   │   │ Socket  │   │ P2P  │
    └───┬───┘   └───┬────┘    └───┬──┘
        │           │             │
┌───────▼───────────▼─────────────▼──────────┐
│         Express.js Application Server       │
│  • Authentication & Authorization          │
│  • Business Logic & Controllers            │
│  • Real-time Event Handling                │
└───────┬──────────────────────────────────┬─┘
        │                                  │
    ┌───▼────────────┐            ┌──────▼────────┐
    │  PostgreSQL    │            │  Redis Cache  │
    │  (Supabase)    │            │  (Sessions)   │
    │  • Users       │            │  • Meetings   │
    │  • Meetings    │            │  • Rankings   │
    │  • Tasks       │            └───────────────┘
    │  • Messages    │
    └────────────────┘
```

### Data Flow
1. **User initiates action** (e.g., create meeting)
2. **Frontend sends request** via REST API with JWT token
3. **Backend validates** token, input, and permissions
4. **Business logic executes** (e.g., generate meeting code)
5. **Database persists** data to Supabase
6. **Real-time update** via Socket.io to all participants
7. **Frontend updates** UI with new data

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | UI framework with strong typing |
| | Vite | Fast build tool & dev server |
| | TailwindCSS + shadcn/ui | Styling & component library |
| | Zustand | Lightweight state management |
| | TanStack Query | Server state management |
| | Axios | HTTP client with interceptors |
| | Socket.io Client | Real-time WebSocket communication |
| **Backend** | Node.js | Runtime environment |
| | Express 5 | REST API framework |
| | Socket.io | Real-time communication |
| | Mongoose | MongoDB ODM (can migrate to Sequelize for PostgreSQL) |
| **Database** | PostgreSQL (Supabase) | Primary data store |
| | Redis | Caching & sessions |
| **Authentication** | JWT | Token-based authentication |
| | bcrypt | Password hashing |
| **File Storage** | Cloudinary | Image & media hosting |
| **AI/ML** | Google Generative AI | Summarization & insights |
| **DevOps** | Docker | Containerization |
| | Kubernetes | Orchestration (production) |
| **Monitoring** | Sentry | Error tracking |
| | Prometheus | Metrics collection |
| | Grafana | Visualization |

---

## 📦 Installation

### Prerequisites
- **Node.js:** v18+ (LTS recommended)
- **npm/yarn:** v8+ or v3+
- **Git:** v2.30+
- **PostgreSQL:** v13+ (if running locally, or use Supabase cloud)
- **Redis:** v6+ (for caching)

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/intellmeet.git
cd Intellmeet
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
# or
yarn install
```

### Step 3: Install Frontend Dependencies
```bash
cd ../frontend
npm install
# or
yarn install
```

### Step 4: Setup Environment Variables

**Backend** (`backend/.env`):
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/intellmeet
# OR for PostgreSQL/Supabase:
DATABASE_URL=postgresql://user:password@localhost:5432/intellmeet

# Authentication
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_EXPIRE=1h
REFRESH_TOKEN_EXPIRE=7d

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# AI/ML
GOOGLE_AI_API_KEY=your_google_ai_key

# Email
SENDGRID_API_KEY=your_sendgrid_key
SENDER_EMAIL=noreply@intellmeet.com

# Environment
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

### Step 5: Database Setup
```bash
# Run migrations (if using PostgreSQL)
npm run migrate

# Seed sample data (optional)
npm run seed
```

### Step 6: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

---

## ⚙️ Configuration

### Supabase Setup
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Run SQL migrations from `backend/sql/schema.sql`
4. Enable Row-Level Security (RLS) on all tables
5. Add credentials to `.env`

### Cloudinary Setup
1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get credentials from dashboard
3. Configure unsigned upload for frontend
4. Add to `.env`

### Google AI Setup
1. Visit [Google AI Studio](https://aistudio.google.com)
2. Create API key
3. Enable required APIs in Google Cloud Console
4. Add key to `.env`

---

## 📡 API Documentation

### Authentication Endpoints
```
POST   /api/auth/signup           - Register new user
POST   /api/auth/login            - Login with email/password
GET    /api/auth/me               - Get current user profile
POST   /api/auth/logout           - Logout (clear token)
POST   /api/auth/refresh-token    - Refresh JWT token
POST   /api/auth/google           - Google OAuth login
POST   /api/auth/2fa/setup        - Enable 2FA
POST   /api/auth/2fa/verify       - Verify 2FA token
```

### Meeting Endpoints
```
GET    /api/meetings              - List all meetings
POST   /api/meetings/create       - Create new meeting
GET    /api/meetings/:id          - Get meeting details
PATCH  /api/meetings/:id/start    - Start meeting
PATCH  /api/meetings/:id/end      - End meeting
POST   /api/meetings/join         - Join meeting by code
DELETE /api/meetings/:id          - Delete meeting
```

### Chat Endpoints
```
GET    /api/messages/:meetingId   - Get chat history
POST   /api/messages              - Send message (via WebSocket)
DELETE /api/messages/:id          - Delete message
```

### Task Endpoints
```
GET    /api/tasks                 - List all tasks
POST   /api/tasks                 - Create task
PATCH  /api/tasks/:id             - Update task
PATCH  /api/tasks/:id/status      - Change task status
DELETE /api/tasks/:id             - Delete task
```

### AI Endpoints
```
POST   /api/ai/summarize          - Generate meeting summary
GET    /api/ai/analytics          - Get analytics dashboard
POST   /api/ai/extract-actions    - Extract action items
```

### WebSocket Events (Real-Time)
```
join-room              - User joins meeting room
leave-room             - User leaves meeting room
participant-joined     - Broadcast new participant
participant-left       - Broadcast participant left
message                - New chat message
typing                 - User is typing
video-offer            - WebRTC offer
video-answer           - WebRTC answer
ice-candidate          - ICE candidate for WebRTC
```

---

## 🚀 Development

### Project Structure
```
Intellmeet/
├── backend/
│   ├── controllers/      # Business logic handlers
│   ├── models/          # Database schemas (Mongoose/Sequelize)
│   ├── routes/          # API endpoint definitions
│   ├── middleware/      # Auth, validation, error handling
│   ├── config/          # Database & external service config
│   ├── utils/           # Helper functions
│   ├── server.js        # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Page components (routes)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API client
│   │   ├── store/       # Zustand state stores
│   │   ├── lib/         # Utilities
│   │   ├── App.tsx      # Root component
│   │   └── main.tsx     # Entry point
│   ├── public/          # Static assets
│   ├── vite.config.ts   # Vite configuration
│   ├── tsconfig.json    # TypeScript configuration
│   └── package.json
└── README.md
```

### Running Tests
```bash
# Backend unit tests
cd backend
npm run test

# Backend integration tests
npm run test:integration

# Frontend component tests
cd frontend
npm run test

# Frontend e2e tests
npm run test:e2e

# Code coverage
npm run coverage
```

### Code Style & Linting
```bash
# Backend
cd backend
npm run lint          # ESLint
npm run format        # Prettier

# Frontend
cd frontend
npm run lint          # ESLint
npm run format        # Prettier
```

### Building for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
# Output: dist/
```

---

## 🐳 Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -f backend/Dockerfile -t intellmeet-backend:latest ./backend

# Run container
docker run -d \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://... \
  -p 5000:5000 \
  intellmeet-backend:latest

# Or use docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment
```bash
# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=jwt-secret=your_secret

# Deploy
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Check status
kubectl get pods
kubectl logs pod-name
```

### Cloud Platforms

**Heroku**
```bash
heroku login
heroku create intellmeet-app
git push heroku main
heroku config:set JWT_SECRET=...
```

**Vercel (Frontend)**
```bash
npm i -g vercel
vercel
# Follow prompts
```

**AWS EC2**
1. Launch t3.medium instance
2. Install Node.js & PostgreSQL
3. Clone repository
4. Configure environment variables
5. Start with PM2: `pm2 start server.js`

**Render/Railway/Fly.io**
- Connect GitHub repository
- Set environment variables
- Deploy

---

## 🤝 Contributing

### Development Workflow
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "Add feature X"`
3. Push to branch: `git push origin feature/your-feature`
4. Create Pull Request with description
5. Request code review
6. Merge after approval

### Coding Standards
- **TypeScript:** Strict mode enabled
- **Components:** Functional components with hooks
- **Naming:** camelCase for variables, PascalCase for components
- **Comments:** JSDoc for complex logic
- **Testing:** Write unit tests for business logic
- **Commits:** Clear, descriptive commit messages

### Reporting Issues
Use GitHub Issues template:
- Clear title
- Description of problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment info

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file

---

## 📞 Support & Community

- **Discord:** [Join Community](https://discord.gg/intellmeet)
- **Email:** support@intellmeet.com
- **Documentation:** [docs.intellmeet.com](https://docs.intellmeet.com)
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions

---

## 🎯 Roadmap

### Q2 2026
- [ ] Smart meeting scheduling assistant
- [ ] Advanced analytics dashboard
- [ ] Multi-language real-time translation
- [ ] Whiteboarding feature

### Q3 2026
- [ ] Mobile app (React Native)
- [ ] Meeting recording & playback
- [ ] Custom branding for enterprises
- [ ] Advanced role-based access

### Q4 2026
- [ ] AI-powered meeting summaries (GPT-4 integration)
- [ ] Calendar integrations (Google, Outlook)
- [ ] Zapier integration
- [ ] API for third-party apps

---

**Last Updated:** May 17, 2026  
**Version:** 1.0.0-beta
