# MindBloom - Online Courses Platform

A full-stack web application for managing online courses with user registration, authentication, course browsing, and enrollment.

## 🏗️ Project Structure

```
MindBloom/
├── backend/              # Express.js server (port 5000)
│   ├── app.js           # Main application file
│   ├── config/          # Database configuration
│   ├── public/          # Static assets (CSS, JS)
│   ├── views/           # EJS templates
│   ├── scripts/         # Database seeding
│   ├── utils/           # Helper functions
│   ├── .env             # Local backend environment variables
│   ├── .env.example     # Template for backend environment variables
│   └── package.json     # Backend dependencies
│
├── frontend/            # Static frontend assets (port 3000)
│   ├── index.html       # Landing page
│   ├── package.json     # Frontend dependencies
│
├── Dockerfile           # Backend container config
├── docker-compose.yml   # Multi-container orchestration
├── Jenkinsfile          # CI/CD pipeline
├── schema.sql           # Database schema
└── README.md            # This file
```

## 🚀 Quick Start

### With Docker (Recommended)

```bash
docker-compose up --build
```

This starts:
- **Backend Server**: http://localhost:5000/mindbloom
- **Frontend**: http://localhost:3000

The backend now expects a Supabase PostgreSQL connection in `backend/.env` through `DATABASE_URL`.

### Local Development

#### Prerequisites
- Node.js 20+
- Supabase PostgreSQL database or another PostgreSQL instance

#### Setup

1. **Create the tables in PostgreSQL**:
Use `schema.sql` as the base for your Supabase SQL editor or any PostgreSQL client.

2. **Backend**:
```bash
cd backend
npm install
npm run seed      # Seed sample data
npm start         # Runs on port 5000
```

3. **Frontend**:
```bash
cd frontend
npm install
npm start         # Runs on port 3000
```

## 🔧 Configuration

Create a `backend/.env` file with:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

DATABASE_URL=postgresql://postgres:your-supabase-password@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
SUPABASE_DB_HOST=db.<project-ref>.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-supabase-password
SUPABASE_DB_NAME=postgres
DB_SSL=true
SESSION_SECRET=your-secret-key
COOKIE_SECRET=your-cookie-secret
COOKIE_SECURE=false
```

If you want a clean template, copy `backend/.env.example` to `backend/.env` and adjust the values for your environment.

If you already have old MySQL variables exported in your shell, start Docker from a clean terminal so they do not override the Supabase env file.

## ✨ Features

- **User Authentication**: Registration, login, and session management
- **Admin Panel**: Course creation, editing, and deletion
- **Course Management**: Browse, search, and enroll in courses
- **User Profiles**: View enrolled courses and user information
- **Teacher Profiles**: View teacher details and their courses

## 📚 Database Schema

- **USER**: Student accounts
- **TEACHER**: Instructor information
- **COURSE**: Course details
- **ENROLLMENT**: Student course enrollments
- **ADMINS**: Administrator accounts

## 🐳 Docker Services

The `docker-compose.yml` orchestrates three services:

1. **backend**: Express.js API server connected to Supabase PostgreSQL
2. **frontend**: Node-based static file server

All services are connected via the `mindbloom-network` bridge.

## 🔐 Security Notes

- Never commit the `.env` file
- Change secrets in production
- Set `COOKIE_SECURE=true` in production
- Use HTTPS in production environments

## 📝 License

ISC
