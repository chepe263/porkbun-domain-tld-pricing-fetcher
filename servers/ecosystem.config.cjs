const dataPath = process.env.PORKBUN_DATA_PATH || "../../core/porkbun-domains-filtered.json";
const host = process.env.HOST || "0.0.0.0";
const port = process.env.PORT || "3000";

module.exports = {
  apps: [
    {
      name: "porkbun-rest-api",
      script: "./src/restServer.js",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "250M",
      env: {
        NODE_ENV: "production",
        HOST: host,
        PORT: port,
        PORKBUN_DATA_PATH: dataPath
      }
    },
    {
      name: "porkbun-mcp-stdio",
      script: "./src/server.js",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "250M",
      env: {
        NODE_ENV: "production",
        PORKBUN_DATA_PATH: dataPath
      }
    }
  ]
};
