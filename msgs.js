const { NewMessage } = require("telegram/events")
require("./client")
const { client, connectClient } = require("./client")
const { eventPrint } = require("./controllers/msgs")
const express = require("express")
const app = express()
;(async function run() {
  connectClient()

  // Add an event handler for new messages
  client.addEventHandler(async (event) => {
    await eventPrint(event)
  }, new NewMessage({}))

  console.log("Listening for new messages...")
  // Keep the program running indefinitely
  await new Promise(() => {})
})()

app.get("/", (req, res) => {
  res.send("I am working properly")
})

app.listen(3000, () => {
  console.log("Server started on port 3000")
})
