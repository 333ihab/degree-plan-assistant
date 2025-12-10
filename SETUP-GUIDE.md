# How to Run the Degree Plan Assistant Project

This guide will help you set up and run both the backend and frontend of the application.

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** (comes with Node.js)

## Step 1: Environment Variables Setup

### Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/degree-plan-assistant
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/degree-plan-assistant

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Email Configuration (choose one method)
# Option 1: Resend API (recommended)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Option 2: SMTP (alternative)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# SMTP_SECURE=false
# SMTP_FROM_EMAIL=noreply@yourdomain.com

# Fallback email address
EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# Optional: Voiceflow API (for AI features)
# VOICEFLOW_API_KEY=your-voiceflow-api-key
```

### Frontend Environment Variables

The frontend doesn't require a `.env` file for basic setup. The API base URL is hardcoded to `http://localhost:4000/api` in `frontend/lib/api.ts`.

If you need to change it, you can create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Step 2: Install Dependencies

### Backend Dependencies

```bash
cd backend
npm install
```

### Frontend Dependencies

```bash
cd frontend
npm install
```

## Step 3: Start MongoDB

### Option A: Local MongoDB

If you have MongoDB installed locally, start the MongoDB service:

**Windows:**
```bash
# MongoDB should start automatically as a service
# Or start it manually:
net start MongoDB
```

**macOS (using Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### Option B: MongoDB Atlas (Cloud)

If you're using MongoDB Atlas, make sure your connection string is correct in the `.env` file. No local setup needed.

## Step 4: Create Admin User (Optional)

To create an admin user for testing:

```bash
cd backend
npm run seed:admin
```

Follow the prompts to create an admin account.

## Step 5: Run the Application

### Terminal 1: Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
✅ MongoDB connected successfully!
Server running on http://localhost:4000
Socket.io server ready
```

### Terminal 2: Start Frontend Server

```bash
cd frontend
npm run dev
```

You should see:
```
- ready started server on 0.0.0.0:3000
- Local: http://localhost:3000
```

## Step 6: Access the Application

1. **Frontend**: Open [http://localhost:3000](http://localhost:3000) in your browser
2. **Backend API**: Available at [http://localhost:4000/api](http://localhost:4000)
3. **Health Check**: Test backend at [http://localhost:4000/api/test](http://localhost:4000/api/test)

## Features Available

### Chat System
- Real-time messaging between students and advisors
- Socket.io for instant message delivery
- REST API fallback for message sending
- Typing indicators
- Unread message counts

### User Roles
- **Student**: Can chat with assigned advisors/mentors
- **Advisor**: Can chat with assigned students
- **Peer Mentor**: Can chat with assigned students
- **FYE Teacher**: Can chat with assigned students
- **Admin**: Full system access

## Troubleshooting

### Backend Issues

1. **MongoDB Connection Error**
   - Verify MongoDB is running
   - Check `MONGO_URI` in `.env` file
   - Ensure MongoDB is accessible from your network

2. **Port Already in Use**
   - Change `PORT` in `.env` file
   - Or stop the process using port 4000

3. **JWT Secret Missing**
   - Add `JWT_SECRET` to `.env` file
   - Use a strong random string

### Frontend Issues

1. **Cannot Connect to Backend**
   - Verify backend is running on port 4000
   - Check CORS settings in `backend/src/server.js`
   - Ensure API URL in `frontend/lib/api.ts` is correct

2. **Socket.io Connection Failed**
   - Verify backend Socket.io server is running
   - Check browser console for connection errors
   - Ensure token is stored in localStorage

### Common Commands

```bash
# Backend
cd backend
npm run dev          # Start development server
npm start            # Start production server
npm run seed:admin   # Create admin user

# Frontend
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
```

## Project Structure

```
degree-plan-assistant/
├── backend/
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth middleware
│   │   ├── utils/          # Utilities (socket, email, etc.)
│   │   └── server.js       # Main server file
│   ├── scripts/            # Utility scripts
│   └── package.json
├── frontend/
│   ├── app/                # Next.js pages
│   ├── components/         # React components
│   ├── lib/                # API client, socket client
│   └── package.json
└── docs/                   # Documentation
```

## Next Steps

1. Create user accounts through the signup flow
2. Assign advisors to students (admin feature)
3. Start chatting between students and advisors
4. Test real-time messaging features

For more detailed documentation, check the `docs/` directory.

