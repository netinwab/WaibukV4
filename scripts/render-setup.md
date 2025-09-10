# Render Deployment Setup

This document explains how to deploy your yearbook application to Render with automatic database setup.

## Render Configuration

### Build Command
```bash
npm install && npm run build
```
This will:
1. Install all dependencies
2. Run `npm run db:push` to create database tables
3. Build the frontend and backend

### Start Command
```bash
npm start
```

### Environment Variables
Make sure these are set in your Render dashboard:
- `DATABASE_URL` - Your PostgreSQL connection string (automatically provided by Render)
- `NODE_ENV=production`

## What Happens on Deployment

1. **Database Tables**: Automatically created via `npm run db:push` during build
2. **Super Admin Account**: Created automatically on first startup
3. **Application**: Serves on the port specified by Render

## Default Super Admin Credentials

After deployment, you can login with:
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change this password immediately after first login!

## Troubleshooting

If you get errors during deployment:

1. **Database Connection Issues**: 
   - Ensure your PostgreSQL service is connected to your web service in Render
   - Check that DATABASE_URL environment variable is set

2. **Table Creation Issues**:
   - The build command includes `npm run db:push` which creates all tables
   - If this fails, check your database connection

3. **Super Admin Not Created**:
   - Check the deployment logs for database initialization messages
   - The app will try to create a super admin on startup

## Manual Database Setup (if needed)

If automatic setup fails, you can manually run:
```bash
npm run db:push
```

This creates all the required tables in your database.