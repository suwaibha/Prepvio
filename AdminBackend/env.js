import dotenv from "dotenv";
import dns from "dns";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const result = dotenv.config({ path: path.resolve(__dirname, ".env") });
console.log("DEBUG: env.js - dotenv loading:", result.error ? "FAILED" : "SUCCESS");
console.log("DEBUG: env.js - .env path used:", path.resolve(__dirname, ".env"));
console.log("DEBUG: env.js - JWT_SECRET loaded:", process.env.JWT_SECRET ? "Yes" : "No");

const configuredDnsServers = (process.env.MONGO_DNS_SERVERS || "")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (configuredDnsServers.length > 0) {
  dns.setServers(configuredDnsServers);
} else if (dns.getServers().length > 0 && dns.getServers().every((server) => server.startsWith("127."))) {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
}
