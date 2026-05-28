# StudyFlow: AI-Powered Study Planner Dashboard

StudyFlow is a premium, feature-rich study planner dashboard application designed to organize subjects, tasks, and calendar events. It incorporates a pomodoro focus timer, AI study planning assistance, and daily completion metrics.

This project is structured as a full-stack JavaScript application with an **Express/MongoDB** backend and a **React/Vite** frontend.

---

## 📂 Project Structure

```
project-3-for-internship-2/
├── study-planner/          # Frontend Web Application (React + Vite)
│   ├── src/                # React components and pages
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies (Recharts, Lucide, Vite)
├── server/                 # Backend REST API (Node.js + Express)
│   ├── config/             # DB configuration (Mongoose connection setup)
│   ├── models/             # Mongoose schemas (User, StudyData)
│   ├── middleware/         # Security & authorization middleware (JWT validation)
│   ├── routes/             # API routes (Auth, Dashboard CRUD)
│   ├── .env.example        # Environment variables template
│   └── server.js           # Server entry point
├── .gitignore              # Workspace-wide Git exclusion rules
└── README.md               # Main project documentation
```

---

## ⚙️ Backend REST API (Express & Mongoose)

The backend provides secure user registration, token-based login, and isolated storage of study planner data.

### Dependencies
* **mongoose**: Integrates with MongoDB Atlas.
* **jsonwebtoken**: Signs and validates security credentials.
* **bcryptjs**: Hashes user passwords using cryptographically secure algorithms.
* **dotenv**: Loads environment configurations.
* **cors**: Configured to safely permit cross-origin calls from the frontend.

### Schemas
1. **User Schema (`User.js`)**:
   - `email` (string, unique, lowercase, required)
   - `password` (hashed string, required)
2. **StudyData Schema (`StudyData.js`)**:
   - `userId` (references the `User` document)
   - `tasks` (array of individual user-added tasks: title, priority, deadline, subject, completion state)
   - `pomodoroSettings` (work duration, break duration)

### API Endpoint Reference

| HTTP Method | Route | Description | Auth Required? |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register a new user and retrieve a JWT | No |
| **POST** | `/api/auth/login` | Authenticate credentials and retrieve a JWT | No |
| **GET** | `/api/dashboard` | Fetch current user's tasks & Pomodoro configurations | **Yes** (Bearer Token) |
| **POST** | `/api/dashboard` | Store or update current user's tasks & settings | **Yes** (Bearer Token) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Set Up the Backend
1. Open your terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install the server dependencies:
   ```bash
   npm install
   ```
3. Create your local environment configuration file:
   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and fill in your connection strings and secret token keys:
     ```env
     PORT=5000
     MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/studyPlannerDB?retryWrites=true&w=majority
     JWT_SECRET=your_super_secret_jwt_string
     ```
4. Start the backend server:
   ```bash
   npm start
   ```
   *The server should output:*
   `Server is running in development mode on port 5000`
   `MongoDB Connected: ...`

### 3. Set Up the Frontend
1. Open a new terminal and navigate to the `study-planner` directory:
   ```bash
   cd study-planner
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the displayed URL (typically `http://localhost:5173`) in your browser to view the interface.

---

## 🔒 Security Best Practices Implemented
* **Password Hashing**: User passwords are never saved in plain text. They are hashed using a 10-round blowfish salt via `bcryptjs`.
* **Data Isolation**: The StudyData database model links items directly to the `userId` MongoDB ObjectId. Queries verify authentication token contexts and ensure requests cannot cross-read or mutate other users' records.
* **Environment Protection**: Git repositories are configured to ignore local environment files (`.env`) preventing secret keys from leaking to public remote servers.
