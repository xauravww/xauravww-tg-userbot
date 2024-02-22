const { NewMessage } = require("telegram/events")
require("./client")
const { client, connectClient } = require("./client")
const { eventPrint } = require("./controllers/msgs")

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
