import * as dotenv from "dotenv";

let path;
switch (process.env.NODE_ENV) {
  case "test":
    path = `.env.test`;
    break;
  case "production":
    path = `.env`;
    break;
  default:
    path = `.env.development`;
}

dotenv.config({ path: path });

export const API_PORT = parseInt(process.env.API_PORT || "3000");
export const NODE_ENV = process.env.NODE_ENV;
