import { createRequire } from "module"
const require = createRequire(import.meta.url)

const { spawn } = require("child_process")

function getPingTime() {
  return new Promise((resolve, reject) => {
    const command = "ping"
    const args = ["www.google.com"]

    const pingProcess = spawn(command, args)

    let avgPingTime

    pingProcess.stdout.on("data", (data) => {
      const output = data.toString()
      const matches = output.match(/Average = (\d+)ms/)
      if (matches && matches.length > 1) {
        avgPingTime = parseInt(matches[1])
        console.log(`Average ping time: ${avgPingTime}ms`)
        resolve(avgPingTime)
      }
    })

    pingProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`)
      reject(data.toString())
    })

    pingProcess.on("close", (code) => {
      console.log(`child process exited with code ${code}`)
    })
  })
}

// getPingTime()

export { getPingTime }
