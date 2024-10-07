import { createRequire } from "module"
const require = createRequire(import.meta.url)



const express = require("express");

const router = express.Router();
import {sendMessage} from "../controllers/google-auth.js"



// Endpoint to handle verification requests
router.get("/google/callback", sendMessage);

export default router