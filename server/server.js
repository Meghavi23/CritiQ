const dotenv = require('dotenv').config();
const http = require("http");
const cluster = require("cluster");
const os = require("os");
const app = require("./app");
const config = require("./config/config");

// DB import
require("./config/mongoose").connect();

const port = config.server.port;

const isProd = config.server.nodeEnv === "PROD";

// ✅ DEV: simple single-process server (no cluster involvement)
if (!isProd) {
  const server = http.createServer(app);

  server.listen(port, () => {
    const addr = server.address();
    const host = addr?.address === "::" ? "localhost" : addr?.address;

    console.log(
      `\n=============== 🚀🚀🚀 Server running on port ${port} 🚀🚀🚀 ===============`,
    );
    console.log(
      `=============== 🚀🚀🚀 Current time: ${new Date().toString()} 🚀🚀🚀 ===============`,
    );
  });

  server.on("error", (err) => {
    console.error(`Handling server error: ${err.message}`);
    server.close(() => process.exit(1));
  });

  return; // important: stop here
}

// ✅ PROD: cluster mode
if (cluster.isMaster) {
  const numWorkers = os.cpus().length;
  console.log(`Master ${process.pid} starting ${numWorkers} workers...`);

  let hasLoggedListening = false;

  for (let i = 0; i < numWorkers; i++) {
    const worker = cluster.fork();

    worker.on("message", (message) => {
      if (!hasLoggedListening && message?.type === "LISTENING") {
        hasLoggedListening = true;

        const addr = message.address;
        const host = addr?.address === "::" ? "localhost" : addr?.address;

        console.log(
          `Server running on port ${port}.  http://${host}:${addr.port} at  on ${config.server.nodeEnv} environment (master PID ${process.pid})`,
        );
      }
    });
  }

  cluster.on("exit", (worker, code, signal) => {
    console.error(
      `Worker ${worker.process.pid} died (code ${code}, signal ${signal}). Restarting...`,
    );
    cluster.fork();
  });
} else {
  const server = http.createServer(app);

  server.listen(port, () => {
    if (process.send) {
      process.send({ type: "LISTENING", address: server.address() });
    }
  });

  server.on("error", (err) => {
    console.error(`Handling server error: ${err.message}`);
    server.close(() => process.exit(1));
  });
}
