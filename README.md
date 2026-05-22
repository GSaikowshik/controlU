# controlU Monorepo 🚀

Welcome to **controlU**, the ultimate gamified habit tracker and urge locker designed for Millennials, Gen Z, and Gen Alpha. Build extreme discipline, complete focus sessions, and stack your **Aura Points**!

---

## Tech Stack 🛠️

- **Backend**: Python 3.10+ & **FastAPI**
- **Frontend**: React (Vite) & **Tailwind CSS v4**
- **Database**: **Supabase (PostgreSQL)**
- **Authentication**: JWT & secure `bcrypt` hashing
- **Icons**: Lucide React

---

## Directory Structure 📂

```
controlU/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── config.py         # Settings & environment parser
│   │   ├── database.py       # Async SQLAlchemy session mapping
│   │   ├── models.py         # DB models (users, urges, logs)
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── security.py       # Password bcrypt hashing & JWT tokens
│   │   └── routers/
│   │       ├── auth.py       # Register & login paths
│   │       └── dashboard.py  # Gamified statistics & urge categories
│   ├── requirements.txt      # Backend Python dependencies
│   └── test_api.py           # Automated test suite runner
├── frontend/                 # React Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.jsx      # Glassmorphic Login/Register screen
│   │   │   └── Dashboard.jsx # Premium interactive control panel
│   │   ├── App.jsx           # App state & login router
│   │   ├── main.jsx          # Vite React entry mount
│   │   └── index.css         # Tailwind v4 import & brand overrides
│   ├── index.html            # Core document & premium Google fonts
│   ├── vite.config.js        # Vite config with backend proxy and Tailwind CSS v4 compiler
│   └── package.json          # Node dependencies
└── supabase/                 # Database Schema & Migrations
    └── migrations/
        └── 01_init.sql       # Initial tables creation script
```

---

## Getting Started ⚡

### 1. Database Setup (Supabase)
1. Go to your [Supabase Dashboard](https://supabase.com) and spin up a new PostgreSQL project.
2. In the **SQL Editor**, paste and run the contents of [`supabase/migrations/01_init.sql`](file:///c:/Users/KOWSHIK/OneDrive/Desktop/projects/vibecoding/controlU/supabase/migrations/01_init.sql) to build the required `users`, `urge_categories`, and `intervention_logs` tables.

### 2. Backend Setup
1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On MacOS/Linux:
   source venv/bin/activate
   ```
3. Install package dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Define your Supabase PostgreSQL connection string in `.env` file (copied from `.env.example`):
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   ```
5. Launch the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`. You can test it directly via the interactive swagger documentation at `http://localhost:8000/docs`.

### 3. Frontend Setup
1. In a separate terminal tab, navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`. The Vite server is configured with an automatic proxy to route `/api` calls straight to your FastAPI backend!

---

## Running Automated Tests 🧪

To verify the logic, generation classification, JWT utilities, and database integrity:
1. Navigate to the `backend/` directory.
2. Run the test suite using standard Python:
   ```bash
   python test_api.py
   ```
This script initializes an isolated memory-based SQLite database and verifies the entire system natively, printing a detailed test completion report!
