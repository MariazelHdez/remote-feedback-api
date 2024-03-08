import * as dotenv from "dotenv";

const envPaths = {
  "test": ".env.test",
  "production": ".env",
  "development": ".env.development"
};

const path = envPaths[process.env.NODE_ENV] || ".env.development";

dotenv.config({ path });

export const API_PORT = parseInt(process.env.API_PORT || "3000");
export const NODE_ENV = process.env.NODE_ENV;