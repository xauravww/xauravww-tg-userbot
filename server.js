import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { fileURLToPath } from "url";
const { NewMessage } = require("telegram/events");

import graphApiRouters from "./routers/graph-api.js";
import path from "path";
import "./client-init.js";
import { client, connectClient } from "./client-init.js";
import { eventPrint } from "./controllers/msgs.js";
const express = require("express");
const app = express();
import bodyParser from "body-parser";
app.use(bodyParser.json());
app.use("/", graphApiRouters);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/img", express.static(path.join(__dirname, "img_for_handler")));

import { job } from "./cron.js";
import { inlineQueryHandler } from "./controllers/Functions/inline-query.js";


job.start();

inlineQueryHandler()



;(async function run() {
  connectClient();

  client.addEventHandler(async (event) => {
    await eventPrint(event);
  }, new NewMessage({}));


  console.log("Listening for new messages...");
})();

app.get("/", (req, res) => {
  res.send("I am working properly");
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
