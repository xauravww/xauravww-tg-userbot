import { LocalStorage } from "node-localstorage";
const localStorage = new LocalStorage("./scratch");

// Function to set message data using userId as the key
export function setMessageData(userId, message) {
  localStorage.setItem(userId, message);  // Store message using userId as the key
}

// Function to get message data using userId as the key
export function getMessageData(userId) {
  return localStorage.getItem(userId);  // Retrieve message using userId
}

// Function to delete message data once the work is completed
export function deleteMessageData(userId) {
  localStorage.removeItem(userId);  // Delete the message from local storage
}
