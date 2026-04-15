const config = {
    server: {
        // Mongo DB Credentials
        // Prefer a full Mongo URI when provided (Atlas/local)
        prodDbUrl: process.env.MONGO_DB_URI || process.env.MONGODB_PROD_URL || process.env.MONGO_DB_HOST,
        mongoHost: process.env.MONGO_DB_HOST || '127.0.0.1',
        mongoPort: parseInt(process.env.MONGO_DB_PORT || '27017'),
        poolSize: process.env.MONGO_POOL_SIZE || '100',
        dbName: process.env.MONGO_DB || "template",

        // Environment Settings
        route: (() => {
            const raw = process.env.ROUTE || '/api';
            return raw.startsWith('/') ? raw : `/${raw}`;
        })(),
        port: process.env.PORT || '8000',
        nodeEnv: (process.env.NODE_ENV || 'DEV').toUpperCase(),

        // URL Links
        backendLink: process.env.BACKEND_LINK || '',
        frontendLink: process.env.FRONTEND_LINK || '',

        // Secrets
        jwtSecretKey: process.env.JWT_SECRET,

        // Mail Keys
        smtpMail: process.env.SMTP_MAIL || '',
        smtpPassword: process.env.SMTP_PASS || '',

        // Default Super User Credentials
        email: 'super_admin@critiq.com',
        password: 'Admin@123',

        isProdOnly: process.env.IS_PROD_ONLY === "true"
    }
};

module.exports = config;
