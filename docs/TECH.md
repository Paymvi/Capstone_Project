# Technical Document

## Overview
Roamie is a web based game where players connect with their local area and with other players by turning nearby places into interactive item drops. Players collect and trade personalized collectibles for their chosen animal avatar through real-world exploration. Roamie combines geolocation, gamification, and secure backend design to create an interactive exploration platform.

Roamie relies on the implementation of geolocation using the leaflet api to deliver an accurate portrayal of the player relative to the world. Our map feature is perhaps one of the most important features to our project because it's the backbone for all of the interactions that take place during gameplay.

Players can log into Roamie via 2 methods, JWT and Google OAuth. JWT is an account registration method where the user enters and submits a username and password credentials. While Google OAuth offers a streamlined approach to handling the registration of users; only requiring a user to sign up with their Google account. 

Roamie also contains admin functionality to control and manage item drops within the world map. Admins are only specified by the developers throughout the code. 

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
### Frontend (React + Vite)
The frontend of Roamie is built using React with Vite as the build tool. Vite was chosen for its fast development server startup times and minimal configuration, allowing for efficient iteration during development.

The frontend is responsible for handling user interactions such as map navigation, item collection, and authentication. These interactions trigger HTTP requests (e.g., GET, POST) to the backend API, where business logic and validation are performed.

### Express API (Node.js)
The backend is implemented using Express on top of Node.js, providing a lightweight and structured framework for defining RESTful API endpoints.

Express was chosen for its simplicity and flexibility in handling HTTP methods such as GET, POST, PUT, and DELETE. This makes it well-suited for managing application logic such as authentication, item collection, and marker management.

Additionally, Node.js’s event-driven, non-blocking I/O model allows the server to efficiently handle multiple concurrent requests, which is important for a system that processes frequent user interactions.

The backend acts as the central layer that:
* Validates incoming requests
* Handles authentication (JWT, Google OAuth)
* Interacts with the database
* Returns structured responses to the frontend

### PostgreSQL Database (Docker)
Roamie uses a PostgreSQL database to store and manage application data, including users, items, markers, and inventory.

PostgreSQL was chosen for its strong support for relational data and constraints, which are important for maintaining data integrity (e.g., preventing duplicate item collection per user).

The database is containerized using Docker, ensuring a consistent and reproducible development environment across different machines. This allows all team members to run the same database setup without manual configuration.

### Request Flow Example
User collects an item:
1. Frontend detects proximity using Leaflet
2. POST /items/collect is sent to backend
3. Backend validates JWT and request
4. Database updates user_inventory
5. Response returned to frontend
6. UI updates with confirmation message

## Database Design
Roamie uses a relational database powered by PostgreSQL to store and manage application data. A relational design was chosen to enforce data integrity and maintain clear relationships between users, items, and game state. 

### Core Tables

> users

Stores user account information.
| Column        | Type    | Description              |
| ------------- | ------- | ------------------------ |
| id            | SERIAL  | Primary key              |
| username      | TEXT    | Unique username          |
| password_hash | TEXT    | Hashed password (bcrypt) |
| google_sub    | TEXT    | Google OAuth identifier  |
| is_admin      | BOOLEAN | Admin privilege flag     |

> items

Stores all collectible items in the game.
| Column      | Type   | Description                         |
| ----------- | ------ | ----------------------------------- |
| id          | SERIAL | Primary key                         |
| name        | TEXT   | Item name                           |
| description | TEXT   | Item description                    |
| type        | TEXT   | Category (`hat`, `body`, `outside`) |
| image_url   | TEXT   | Asset path for rendering            |

> markers

Represents item drop locations on the map. 
| Column  | Type   | Description            |
| ------- | ------ | ---------------------- |
| id      | SERIAL | Primary key            |
| item_id | INT    | References `items(id)` |
| lat     | FLOAT  | Latitude               |
| lng     | FLOAT  | Longitude              |

> user_inventory

Tracks which items a user has collected.
| Column  | Type | Description            |
| ------- | ---- | ---------------------- |
| user_id | INT  | References `users(id)` |
| item_id | INT  | References `items(id)` |

#### Constraints:
* (user_id, item_id) is unique → prevents duplicate collection

> user_equipment 

Stores currently equipped items per user. 
| Column  | Type | Description           |
| ------- | ---- | --------------------- |
| user_id | INT  | Primary key           |
| hat     | INT  | Equipped hat item     |
| body    | INT  | Equipped body item    |
| outside | INT  | Equipped outside item |

### Relationships 
* A user can collect many items → users ↔ items (via user_inventory)
* Each marker is related to a single item → markers.item_id → items.id
* Each user has one equipment record → users.id → user_equipment.user_id

### Design Decisions

#### Why PostgreSQL?
PostgreSQL was chosen for its strong support for relational data and constraints. This is important for ensuring: 
* Users cannot collect duplicate items
* Data relationships remain consistent 
* Queries remain efficient and structured

#### Separation of Items and Markers
Items and markers are stored in separate tables: 
* Items defines what the item is
* Markers defines where the item exists

This separation allows: 
* Reusing items across multiple locations
* Flexibility in adding/removing map drops without duplicating item data

#### Inventory as a Join Table
The user_inventory table is portrayed as a join table between users and items. 

This design: 
* Supports many-to-many relationships
* Enables efficient querying of collected items
* Prevents duplicate entries through constraints

#### Equipment System Design
Rather than storing equipment in the inventory table, a separate user_equipment table is used. 

Offering: 
* Fast lookup of currently equipped items
* Enforcing one item per category (hat/body/outside)
* Cleaner separation of "owned" vs "equipped" state

## Security
Roamie has two project versions, one that has integrated security and one insecure version. Our security version is the current production build. While our insecure version is intended for demonstration purposes.

### Secure Version
Roamie's secure version incorporates secure practices such as parameterized queries, password hashing, JWT authentication, role-based access and input validation. We want to ensure the protection of game data at all times within Roamie, so instead of implementing one security method we combined many distinct methods to strengthen data protection. In the future, we plan to implement damage control and containment in the scenario that our data is breached.

#### Parameterized Queries
Parameterized queries is our are primary defense against SQL attacks.
* 
* 
* 

#### Hashed Passwords
To prevent passwords from being read plaintext, passwords are stored hash values.
* 
* 
* 

#### Input Validation
In limiting length of characters in input for username and password, the system would be reducing the attack surface  

#### Least Privileged


### Additional Security Measures
To further strengthen Roamie's security, multiple defensive layers are implementeted to protect against abuse, unauthorized access, and system compromise. These controls complement core protections such as paramterized queries, authentication and role-based access, encompassing a defense-depth security model for Roamie. 

#### Login Rate Limiting
To prevent brute-force attacks, login attempts are designed to be rate-limited.
* Limits the number of login requests (5) within a time window of 60 seconds
* Temporarily blocks repeated faued attempts
* Reduces risk of credential stuffiing attacks

#### Account Lockouts
Accounts are temporarily locked after a set number of failed login attempts. 
* Prevents the event of a threat actor guessing credentials
* Adds an additional layer beond rate limiting

#### Abnormal Query Detection
Abnormal or suspicious database queries are monitored within the system.
* Detects abnormal query patterns or  excessive requests
* Helps identify potential SQL injection or exploitation attempts
* Can trigger alerts or defensive actions

#### JWT Token Invalidation
JWT Tokens can be invalidated to prevent unathorized reuse. 
* Tokens may be blacklisted after logout or suspicious activity
* Prevents threat actors from reusing compromised tokens
* Supports session control despite JWT being stateless

#### Logging and Monitoring
Security-related events are logged for auditing and analysis. 
* Tracks login attempts, failed authentication, and sensitive action
* Enables detection of suspicious behavior 
* Supports incident response and debugging

### Insecure Version
Even in the insecure version, monitoring and recovery mechanisms were explored to handle the breach of data by unauthorized users. Emphasizing the importance of quality and secure code creation. While also reinforcing the measures that need to be set in place in the scenario data is breached to prevent potential business losses. 

### Security Comparison

| Feature           | Insecure Version       | Secure Version              |
|-------------------|------------------------|-----------------------------|
| SQL Queries       | Raw queries            | Parameterized queries       |
| Password Storage  | Plaintext              | Hashed (bcrypt)             |
| Authentication    | None / weak            | JWT-based                   |
| Authorization     | None                   | Role-based access           |
| Input Validation  | Minimal                | Validated inputs            |

## Map and Geolocation Logic
Roamie uses a map-based interface powered by Leaflet to enable real-time interaction between the player and the environment.

### Geolocation
Upon loading the map, the application requests the user's location through the browser's geolocation API. 

This location is used to: 
* Center the map on the player
* Continuously track player movement
* Enable proximity-based item collection

### Map Rendering 
The map is rendered using React-Leaflet, which provides React components for working with Leaflet. 

Key components include: 
* MapContainer for initializing the map
* TileLayer for map tiles 
* Marker and Popup for item drops

### Marker System 
Item drops are represented as markers on the map. 

Each marker contains: 
* Latitude and longitude
* Item metadata
* Collection radius

Markers are fetched from the backend and dynamically rendered on the map. 

### Distance Calculation
To determine whether a player can collect an item, Roamie calculates the distance between: 
* The player's current position
* The item's coordinates

This is done using Leaflet's utility:
```
L.latLng(playerLat, playerLng).distanceTo(itemLatLng)
```
If the distance is within a predefined radius (e.g., 30 meters), the item becomes collectible. 

## Game Logic/State Management 
Roamie's game logic is dependent on player interactivity within the map. Upon login, the application requests the user’s location through the browser. This location is used to position the player on the map and enable interaction with nearby item drops. 

The system continuously compares the player’s position with item locations to determine whether an item can be collected.

### How Items Are Collected
Item drops are collected when a player is within a defined proximity radius (measured in meters) of the item’s coordinates.

Distance is calculated using Leaflet’s built-in utilities:

* L.latLng(...).distanceTo(...) 

When the player obtains the item, a request is sent to the backend to be validated. After the item has been validated, the item is recorded in the user_inventory table. When this occurs, feedback is given to the player through the use of displaying a message

Example frontend feedback: 

```
setTimeout(() => setMessage(`🎉 You've collected the ${markers.name}!!`), 2000);
```

### How Inventory Is Stored
Collected items are stored in the user_inventory table in the database. This establishes the relationship between the player (user_id) and the item (item_id). Ensuring that users cannot collect the same item multiple times and the inventory persists across sessions. The frontend retrieves this data via API calls and renders collected items in the inventory screen.

### Equipment System
Each in-game item is classified as either the type: hat, body, outside. This is defined in the seed.sql file to populate the item table upon starting up Roamie. Types are needed to properly place items on the player's avatar accordingly. 

### Local State vs Backend State
Roamie uses a combination of local state and backend state to balance performance and persistence.

#### Local State (Frontend)

* Stores temporary UI data (e.g., messages, selected items)
* Uses useState and localStorage
* Enables fast, responsive interactions

#### Backend State (Database)

* Stores persistent data such as:
        * collected items
        * equipped items
        * user authentication
* Ensures data consistency across sessions and devices

This hybrid approach allows Roamie to remain responsive while maintaining reliable long-term data storage.

## API Design
Roamie uses a RESTful API built with Express to handle communication between the frontend and backend.

### Authentication
#### POST /auth/register
Creates a new user account.

Request Body:
```
{
  "username": "user",
  "password": "password"
}
```
Response: 
```
{
  "token": "jwt_token",
  "user": { "id": 1, "username": "user" }
}
```

#### POST /auth/login
Authenticates a user and returns a JWT.

Request Body:
```
{
  "username": "user",
  "password": "password"
}
```
Response: 
```
{
  "token": "jwt_token",
  "user": { "id": 1, "username": "user" }
}
```

#### POST /auth/google 
Authenticates a user using a Google OAuth token. 

Request Body:
```
{
  "token": "token"
}
```
Response: 
```
{
  "token": "google_token",
  "user": { "id": 1, "email": "email", "is_admin": true }
}
``` 

### User State
#### GET /me/state
Returns the current user's data, including: 
* Collected items
* Equipped items

* Authentication: Required (JWT).

### Items & Markers 
#### GET /items
Returns all item drop locations.

#### POST /items/collect
Records that a user has collected an item. 
* Authentication: Required (JWT).

Request Body:
```
{
  "itemId": 5
}
```
### Equipment 
#### PUT /equip
Updates the user's equipped items.
* Authentication: Required (JWT)

### Admin 
#### POST /markers
 Creates a new item drop.
* Authentication: Required (Admin only).

### Health / Debug Endpoints
#### GET /health/db
Checks database connectivity.

#### GET /test-db
Test endpoint for database queries.

| Method | Endpoint         | Description                  | Auth |
|--------|------------------|------------------------------|------|
| POST   | /auth/register   | Register user                | ❌   |
| POST   | /auth/login      | Login user                   | ❌   |
| POST   | /auth/google     | Google OAuth login           | ❌   |
| GET    | /me/state        | Get user state               | ✅   |
| POST   | /items/collect   | Collect item                 | ✅   |
| PUT    | /equip           | Equip item                   | ✅   |
| POST   | /markers         | Create marker (admin)        | 🔒   |

## Development Environment 

### Requirements
* Node
* Docker
* PostgreSQL

### Setup Steps
* git clone ...
* cd roamie

### Start DB
* docker compose up

### Backend
* cd backend
* npm install
* node server.js

### Frontend
* cd frontend
* npm install
* npm run dev

### .env (Frontend)
The .env in the frontend stores configuration for Google OAuth authentication. 

```
VITE_GOOGLE_CLIENT_ID=167049612356-r14p57se5j7sjouc7ovlgadkcfiosbj3.apps.googleusercontent.com
```

### .env (Backend)
The .env in the backend stores sensitive configuration values used by the server. 

```
PORT=5000
DATABASE_URL=postgresql://db_user:db_pass@localhost:5433/roamie
JWT_SECRET=YOUR_SECRET_KEY
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```

These variables are used for:
* The TCP port number for the Express API backend 
* The database url to connect with PostgreSQL database
* The JWT_SECRET is included to sign and verify JWT tokens
* The Google Client ID is used to verify Google OAuth tokens for Google sign-in

### TCP Port Table
| Port | Usage                          |
|------|--------------------------------|
| 5173 | Frontend (Vite dev server)     |
| 5000 | Backend (Express API)          |
| 5433 | PostgreSQL database (Docker)   |

> Note: .env files are not committed to version control. Example values are provided for reference only.


## Testing
Unit testing for Roamie is yet to be implemented. However, when unit testing arises, we plan to use Jest and Postman as our testing frameworks. 

Jest will be used for unit testing and component tests. Jest is integral to our testing environment because it offers snapshot testing for capturing the outcome of tests. Allowing developers to compare them to previous tests and detect abnormal changes. Jest also offers descriptive error messages and strong community support. 

While testing with Postman it will be significant for testing API routes because it provides a user-friendly UI. Enabling developers to comfortably write test scripts for their desired API. In addition, Postman allows developers to set up their own mock server to simulate their API endpoints, without directly editing their established or in-progress servers. 

## Authentication & Validation

The authentication system includes secure user registration and login using hashed passwords and JWT-based session management.

Enhancements include:

* Validation of user input using Zod schemas
* Prevention of duplicate usernames at both application and database levels
* Secure password storage using bcrypt hashing
* Token-based authentication for protected routes

Testing revealed and resolved an issue where duplicate usernames were not properly handled due to incorrect variable initialization order. This was corrected by validating and normalizing input before performing database checks.


## Testing

The backend was tested using Jest and Supertest. Test cases were designed to validate authentication, security protections, and system robustness.

Key areas tested include:
- SQL injection protection
- Authentication validation
- Rate limiting and abuse prevention
- Account lockout mechanisms
- Secure password hashing

## Engineering Decisions

### Why PostgreSQL over NoSQL?
PostgreSQL was chosen for its strong relational integrity, which is important for enforcing constraints such as unique item collection per user. 

This supports: 
* Strong ACID compliance
* Hybrid capabilities
* Rich extensibility


### Why JWT instead of sessions
JWT tokens are integral for Roamie because distributed servers can instantly verify requests without querying the central database.  

Primarily:
* Scale horizontally across multiple servers effortlessly
* Reduced latency and improved speed in high traffic
* Microservices for the generation of a token and other services can trust and verify it, without validating with the original authentication server 

### Why Docker for Roamie's Database? 
Docker offered significant benefits for our development:
* Environment consistency across all developer machines
* Rapid setup and portability for automation
* Resource efficiency as containers are lightweight, versus the use of a virtual machine

### Why Leaflet instead of Google Maps?
Leaflet was chosen over Google Maps for Roamie because it offers: 
* A free open-source library
* High degree of customization
* Strong and smooth performance 
* Flexible in adding advanced functionality through community-developed plugins