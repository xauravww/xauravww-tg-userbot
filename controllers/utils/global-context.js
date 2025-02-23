import { setvalueData, getvalueData, deletevalueData } from "./localStorageUtils.js";
import dotenv from "dotenv"
dotenv.config({path:'.env'})

// // console.log(process.env.MODEL_NAME_GEMINI)
const ownerId = process.env.OWNER_USERID ? process.env.OWNER_USERID.split(" ") : [];

function setGlobalValue( globalchat, userid, item, value) {
  if (ownerId != userid) {
    // // console.log("no owner found for message")
    return;
  }

  const global_object = JSON.parse(getvalueData("global_object")) || {};
  
  // Dynamically set the new key-value pair
  // // console.log(global_object)
  global_object[item] = value;

  // // console.log(global_object)

  setvalueData("global_object", JSON.stringify(global_object));
}

function setGlobalObject() {
  const global = {
    textModel: process.env.MODEL_NAME_GEMINI.split(" ")[0]  || "model-unknown",
  };
  setvalueData("global_object", JSON.stringify(global));
}

// New function to retrieve a specific value from global_object
function getGlobalValue(item) {
  const global_object = JSON.parse(getvalueData("global_object")) || {};

  // Return the requested item, or undefined if it doesn't exist
  return global_object[item];
}

export { getGlobalValue , setGlobalObject , setGlobalValue}