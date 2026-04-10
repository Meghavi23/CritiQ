const mongoose = require('mongoose');
const config = require('./config');
const cluster = require('cluster');

const {
    server: { mongoHost, mongoPort, dbName, poolSize, nodeEnv, prodDbUrl }
} = config;

function buildMongoUrl() {
    // Prefer explicit full URI (recommended)
    if (process.env.MONGO_DB_URI) return process.env.MONGO_DB_URI;
    if (process.env.MONGODB_PROD_URL) return process.env.MONGODB_PROD_URL;

    // Fallback: use config value if it looks like a URI
    if (typeof prodDbUrl === "string" && prodDbUrl.startsWith("mongodb")) return prodDbUrl;

    // Default local Mongo
    return `mongodb://${mongoHost}:${mongoPort}/${dbName}`;
}

const mongoUrl = buildMongoUrl();

// Making MongoDB Connection using mongoose
exports.connect = () => {
    mongoose.set('strictQuery', true);
    mongoose
        .connect(mongoUrl)
        .then(() => {

            if (cluster.isMaster) {
                console.log(`=============== 🚀🚀🚀 Successfully connected to ${nodeEnv} mongo database 🚀🚀🚀 ===============`);
                console.log(`=============== 🚀🚀🚀 Database name: ${dbName} 🚀🚀🚀 =============== \n`);
            }
        })
        .catch((error) => {
            console.log('Mongo connection failed. Server will keep running; retrying in 5s...');
            console.error(error);
            setTimeout(() => {
                try {
                    exports.connect();
                } catch (e) {
                    console.error(e);
                }
            }, 5000);
        });
};
