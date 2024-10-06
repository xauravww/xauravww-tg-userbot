import { LocalStorage } from "node-localstorage";
const localStorage = new LocalStorage("./scratch");


export function setvalueData(key, value) {
  localStorage.setItem(key, value);  
}


export function getvalueData(key) {
  return localStorage.getItem(key); 
}


export function deletevalueData(key) {
  localStorage.removeItem(key);  
}
