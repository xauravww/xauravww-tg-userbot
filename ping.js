import { createRequire } from "module"
const require = createRequire(import.meta.url)

const { exec } = require("child_process")
exec("ping -c 10 google.com", (error, stdout, stderr) => {
  if (error) {
    console.log(`error: ${error.message}`)
    return
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`)
    return
  }
  console.log(`stdout: ${stdout}`)
})
