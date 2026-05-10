import { config } from "dotenv";

config();

export const env = {
  port: Number(process.env.PORT ?? 4000)
};
