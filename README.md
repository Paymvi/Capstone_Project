# Roamie

> *Roam together*

Our capstone project is called "Roamie" and it is a web based game where players connect with their local area and each other by turning nearby places into interactive item drops, allowing players to collect and trade personalized collectibles for their animal avatar through real-world exploration.

## Stack
* Frontend: Vite + React

* Backend: Express.js (Node.js)

* Mapping: React-Leaflet

* Database: JSON-based persistent storage (for demo)

## Setup

### Prerequistes
Make sure you have the following installed:

* Node.js (v18+ recommended, tested with v20.19.6)

* npm (comes with Node)

* Git

* Check your versions:
```
node -v
npm -v
git --version
```

### Clone the repoistory 

1. Clone this repository: 
```
https://github.com/Paymvi/Capstone_Project.git
```

### Client Setup

2. Install dependencies: 
```
npm install
```

3. Start the development server: 
```
"npm run dev"
```

4. By default, the app will run at:
```
http://localhost:5173
```

### Server Setup

5. Navigate to the backend directory:
```
cd backend
```

6. Install backend dependencies:
```
 "npm install"
```

7. Start the server: 
```
node server.js
```

8. The backend will run on: 
```
http://localhost:5000
```

### Entering Roamie
9. Now that both: 
    * Once both:

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
* Both client and server must be running simultaneously.
* Persistent state is stored locally for demo purposes.
* If ports are already in use, stop the conflicting process or change the port configuration.