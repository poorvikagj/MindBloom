# MindBloom - Online Courses Platform

A full-stack web application for managing online courses with user registration, authentication, course browsing, and enrollment.

## 🏗️ Project Structure

```
MindBloom/
├── app.js               # Main Express application
├── config/              # Database configuration
├── public/              # Static assets (CSS, JS)
├── views/               # EJS templates
├── scripts/             # Database seeding
├── utils/               # Helper functions
├── .env                 # Local backend environment variables
├── .env.example         # Template for backend environment variables
├── api/                 # Vercel serverless entrypoint
├── package.json         # Root deployment dependencies
├── vercel.json          # Vercel routing config
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

This starts the backend-rendered site directly from the repository root.

For Vercel, the root `api/index.js` file exposes the same Express app as a serverless function.

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

## 🔧 Configuration

Create a `.env` file at the repository root with:

```env
NODE_ENV=development
PORT=5000
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

If you want a clean template, copy `.env.example` to `.env` and adjust the values for your environment.

If you already have old MySQL variables exported in your shell, start Docker from a clean terminal so they do not override the Supabase env file.

## 🚀 Vercel Deploy

This repository is now structured for backend-only deployment on Vercel:

1. The Express app lives in `app.js`.
2. Vercel enters through `api/index.js`.
3. `vercel.json` rewrites every route to the serverless app.
4. Static files still come from `public/`, and EJS templates still render from `views/`.

## ✨ Features

- **User Authentication**: Registration, login, and session management
- **Admin Panel**: Course creation, editing, and deletion
- **Course Management**: Browse, search, and enroll in courses
- **User Profiles**: View enrolled courses and user information
- **Teacher Profiles**: View teacher details and their courses

## 📚 Database Schema

- **users**: Student accounts
- **teachers**: Instructor information
- **courses**: Course details
- **enrollments**: Student course enrollments
- **admins**: Administrator accounts

## 🐳 Docker Services

The `docker-compose.yml` now orchestrates a single backend service:

1. **backend**: Express.js API server connected to Supabase PostgreSQL

It uses the `mindbloom-network` bridge only for the backend container.

## 🔐 Security Notes

- Never commit the `.env` file
- Change secrets in production
- Set `COOKIE_SECURE=true` in production
- Use HTTPS in production environments

## 📝 License

ISC
