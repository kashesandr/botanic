import dotenv from 'dotenv';
dotenv.config({ path: process.cwd()+'/.env' });

import app from "./src/index.js";

app.start()