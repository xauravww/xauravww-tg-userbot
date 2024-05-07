import { createRequire } from "module"
const require = createRequire(import.meta.url)



const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const router = express.Router();
import {getFromWebhook,postToWebHook} from "../controllers/graph-api.js"



// Endpoint to handle verification requests
router.get("/webhook", getFromWebhook);

// Endpoint to handle webhook notifications
router.post("/webhook",postToWebHook);

export default router

// Middleware to verify request signature
// function verifyRequestSignature(req, res, buf) {
//     var signature = req.headers["x-hub-signature-256"];

//     if (!signature) {
//         console.warn(`Couldn't find "x-hub-signature-256" in headers.`);
//     } else {
//         var elements = signature.split("=");
//         var signatureHash = elements[1];
//         var expectedHash = crypto
//             .createHmac("sha256", "your_route_secret")
//             .update(buf)
//             .digest("hex");
//         if (signatureHash != expectedHash) {
//             throw new Error("Couldn't validate the request signature.");
//         }
//     }
// }

