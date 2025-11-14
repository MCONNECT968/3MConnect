# 3Mconnect Real Estate CRM

A comprehensive CRM system for real estate agencies to manage properties, clients, and business operations.

## Features

- Property management
- Client database
- Needs forms and matching
- Calendar and visit scheduling
- Rental management
- Maintenance tracking
- Document management
- WhatsApp marketing

## Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- React Router
- Axios
- Lucide React (icons)

### Backend
- Node.js
- Express
- MySQL
- JWT Authentication

## Installation and Setup

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8 or higher)

### Database Setup
1. Create a new MySQL database:
```sql
CREATE DATABASE 3mconnect_crm;
```

2. Create a database user (or use an existing one):
```sql
CREATE USER 'crm_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON 3mconnect_crm.* TO 'crm_user'@'localhost';
FLUSH PRIVILEGES;
```

### Backend Setup
1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Edit the `.env` file with your database credentials and other settings.

5. Run database migrations:
```bash
npm run migrate
```

6. Seed the database with initial data:
```bash
npm run seed
```

7. Start the server:
```bash
npm start
```

### Frontend Setup
1. Navigate to the project root directory.

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Edit the `.env` file with your API URL.

5. Start the development server:
```bash
npm run dev
```

## Production Deployment

### Backend Deployment
1. Set up a production MySQL database.
2. Configure the `.env` file with production settings.
3. Build and deploy the Node.js application to your server.
4. Set up a process manager like PM2:
```bash
npm install -g pm2
pm2 start server.js --name 3mconnect-api
```

### Frontend Deployment
1. Build the frontend:
```bash
npm run build
```

2. Deploy the contents of the `dist` directory to your web server.

3. Configure your web server (Apache/Nginx) to serve the static files and handle client-side routing.

### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Default Login Credentials

After running the seed script, you can log in with:

- Admin: admin@3mconnect.com / admin123
- Agent: agent@3mconnect.com / agent123

## License

This project is proprietary and confidential.