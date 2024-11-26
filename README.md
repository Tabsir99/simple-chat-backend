# Simple Chat Backend

## Description
An Express.js backend for a real-time chat application built with TypeScript, Prisma, PostgreSQL, and various integrations.

## Prerequisites
- Node.js (v18+ recommended)
- npm (v9+)
- PostgreSQL (v12+)
- Redis (for caching and WebSocket support)

## Tech Stack
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Socket.IO
- Firebase Cloud Storage
- Nodemailer
- Redis
- JWT Authentication

## Installation

### 1. Clone the Repository
```bash
git clone [your-repo-url]
cd simple-chat-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
PGUSER=your_postgres_username
PGPASSWORD=your_postgres_password
PGHOST=localhost
PGDATABASE=simplechat
PGPORT=5432
DATABASE_URL="postgresql://username:password@localhost:5432/simplechat?schema=public"

# JWT Secrets (generate your own secure secrets)
JWT_SECRET_MAGIC_LINK=your_magic_link_secret
JWT_SECRET_ACCESS=your_access_token_secret
JWT_SECRET_REFRESH=your_refresh_token_secret

# Server Configuration
BASE_URL=https://localhost:3001
BASE_URL_FRONTEND=https://localhost:5000
HOSTNAME=localhost
NODE_ENV=development

# Email Configuration
NODEMAILER_USER=your_email@example.com
NODEMAILER_PASS=your_email_password

# Google OAuth (Optional)
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CLIENT_ID=your_google_client_id

# Firebase Cloud Storage
FIREBASE_CLOUD_STORAGE_KEY=your_firebase_service_account_key_json
```

### 4. Database Setup
```bash
# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
# Build TypeScript to JavaScript
npm run build

# Start the production server
npm start
```

### Testing
```bash
npm test
```

## Project Structure
```
src/
├── common/
│   ├── config/       # Configuration files
│   ├── errors/       # Custom error handling
│   ├── middlewares/  # Express middlewares
│   └── utils/        # Utility functions
├── modules/
│   ├── authentication/
│   ├── chats/
│   ├── friendship/
│   ├── media/
│   ├── messages/
│   └── users/
└── server.ts
```

## Key Features
- JWT Authentication (Magic Link, Access, Refresh Tokens)
- WebSocket Support
- PostgreSQL Database with Prisma ORM
- Google OAuth Integration
- Firebase Cloud Storage
- Email Verification
- All core features needed in a chat app


## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



## Contact
hello@tabsircg.com