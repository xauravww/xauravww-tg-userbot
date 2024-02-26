import { createRequire } from "module"
const require = createRequire(import.meta.url)

const { NewMessage } = require("telegram/events")
import "./client.js"
import { client, connectClient } from "./client.js"
import { eventPrint } from "./controllers/msgs.js"
const express = require("express")
const app = express()

import { job } from "./cron.js"
job.start()
  

  
;(async function run() {
  connectClient()

  // Add an event handler for new messages
  client.addEventHandler(async (event) => {
    await eventPrint(event)
  }, new NewMessage({}))

  console.log("Listening for new messages...")
  // Keep the program running indefinitely
  // await new Promise(() => {})
})()

app.get("/", (req, res) => {
  res.send("I am working properly")
})

app.listen(3000, () => {
  console.log("Server started on port 3000")
})
