import axios from "axios";

var yourRequest = 'hey, do you work ?';
axios.get(`https://free-unoficial-gpt4o-mini-api-g70n.onrender.com/chat/?query=${yourRequest}`, {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
})
.then(response => console.log(response.data))
.catch(error => console.error('Error:', error));