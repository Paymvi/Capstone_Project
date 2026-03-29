# Roamie

> *Roam together*

Our capstone project is called "Roamie" and it is a web based game where players connect with their local area and each other by turning nearby places into interactive item drops, allowing players to collect and trade personalized collectibles for their animal avatar through real-world exploration.

## Architecture
```
Frontend (React + Vite)
        │
        ▼
Express API (Node.js)
        │
        ▼
PostgreSQL Database (Docker)
```

## Stack
* Frontend: Vite + React

* Backend: Express.js (Node.js)

* Mapping: React-Leaflet

* Database: PostgreSQL (Dockerized)

## Setup

### Prerequisites
Make sure you have the following installed:

* Node.js (v18+ recommended, tested with v20.19.6)

* npm (comes with Node)

* Git

* Docker Desktop

* Check your versions:
```
node -v
npm -v
git --version
docker --version
```

### Clone the repository 

1. Clone this repository: 
```
git clone https://github.com/Paymvi/Capstone_Project.git
cd Capstone_Project
```

### Create .env files
2. For this project, you want to create 2 .env files (client and server)

3. For client, create a new file titled: ".env"

4. Then paste this: 
```
GOOGLE_CLIENT_ID=167049612356-r14p57se5j7sjouc7ovlgadkcfiosbj3.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=167049612356-r14p57se5j7sjouc7ovlgadkcfiosbj3.apps.googleusercontent.com
```

5. Next, in the backend directory, create the ".env" file

6. Once created, add this and replace the dashes with your own password: 
```
PORT=3000
DATABASE_URL=postgres://postgres:--------------@localhost:5432/roamie
GOOGLE_CLIENT_ID=167049612356-r14p57se5j7sjouc7ovlgadkcfiosbj3.apps.googleusercontent.com
JWT_SECRET=replace_this_with_a_secret
```

### Docker Setup
7. Start the database: 

```
docker compose up
```

This will:

• Start the PostgreSQL database  
• Automatically create the Roamie database  
• Run the schema.sql file  
• Seed the default items  

If the database fails to start, reset it with:

```
docker compose down -v
docker compose up
```

### Client Setup

8. In a second terminal, install dependencies in the root directory: 
```
npm install
```

9. Start the development server: 
```
npm run dev
```

10. By default, the app will run at:
```
http://localhost:5173
```

### Server Setup

11. In a third terminal, navigate to the backend directory:
```
cd backend
```

12. Install backend dependencies:
```
npm install
```

13. Start the server: 
```
node server.js
```

14. The backend will run on: 
```
http://localhost:3000
```

### Entering Roamie
15. Now that both: 
    * Once both are running:

        * ✅ Client (npm run dev)
        * ✅ Server (node server.js)

    are running, open:

```
http://localhost:5173
```

You should now be able to interact with the Roamie map, place markers, and collect items.

## Vertical Slice
Our vertical slice implements interactive map markers that persist across sessions. When a user clicks on the map, the frontend sends the coordinates to the Express backend for storage, and the client re-fetches and renders those markers on reload; thus demonstrating the full-stack functionality of Roamie across the UI, API, and persistence layers.

## Notes
* Docker, client and server must be running simultaneously.
* Persistent game data is stored in a PostgreSQL database running inside Docker.
* If ports are already in use, stop the conflicting process or change the port configuration.

## Security Notes
* Environment variables such as database credentials and JWT secrets are stored in `.env` files and are not committed to the repository.