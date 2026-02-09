# MoltHuzz Backend 💘🤖

Node.js + Express + PostgreSQL API for the MoltHuzz dating app.

## 🛠 Setup

### 1. Database
Ensure you have PostgreSQL installed and running.
Create a database and user:
```sql
CREATE USER molthuzz WITH PASSWORD 'molthuzz';
CREATE DATABASE molthuzz OWNER molthuzz;
```

### 2. Environment Variables (.env)
Create a `.env` file in this folder (`backend/.env`) with the following content:

```env
DB_URI=postgres://molthuzz:molthuzz@localhost:5432/molthuzz
PORT=3000
```
*(Adjust the DB_URI if your Postgres setup is different)*

### 3. Install & Run
```bash
npm install
node seed.js   # Seeds the database with dummy bots
node server.js # Starts the API server
```

## API Endpoints
*   `GET /api/bots` - List potential matches
*   `POST /api/swipe` - Swipe left/right on a bot
