# PrepVio

The project is structured as four independent services that work together:

1. User Frontend

2. User Backend 

3. Admin Frontend

4. Admin Backend 

# Repository Structure

root/

- AdminBackend

- AdminFrontend

- Backend

- Frontend/prepvio

# Environment Variables

1. backened/.env

2. AdminBackend/.env

# MongoDB Atlas Access

The project connects to a MongoDB Atlas database.

To access the database data, update the MONGO_URI value in your local .env file using the database credentials assigned to you.

**Example:**

```js
MONGO_URI=mongodb+srv://<your_db_username>:<your_db_password>@<cluster_url>/<database_name>
```

## Usage Example

### 1. AdminBackend/.env

Replace

```js
MONGO_URI=mongodb://localhost:27017/PrepVioAdmin
```

with

```js
MONGO_URI=mongodb+srv://ameensyed244_db_user:MSc7gPV2IfSiHcvD@prepvio.lfpjat8.mongodb.net/PrepVioAdmin
```

### 2. Backened/.env

Replace

```js
MONGO_URI=mongodb://localhost:27017/Prepvio
```

with

```js
MONGO_URI=mongodb+srv://ameensyed244_db_user:MSc7gPV2IfSiHcvD@prepvio.lfpjat8.mongodb.net/Prepvio
```

# Installation & Running

**Step 1: Clone Repository**

**Step 2: Install dependencies**

```bash
cd adminbackend
npm install
```

```bash
cd ../adminfrontend
npm install
```

```bash
cd ../backened
npm install
```

```bash
cd ../frontend/prepvio
npm install
```

**Step 3: Start services**

```bash
AdminBackend      →   npm run dev   (Port 5000)
AdminFrontend     →   npm run dev   (Port 5174)
frontend/prepvio  →   npm run dev   (Port 5173)
Backened          →   npx nodemon server.js   (Port 8000)
