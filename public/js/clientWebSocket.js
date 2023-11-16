const client = new WebSocket("ws://localhost:3000");
const roomId = window.location.href.split("/")[4];
const chatsDisplay = document.getElementById("chats");

client.onopen = function() {
  console.log("Connected to webSocket");
}

client.onmessage = function(message) {
  let data = message.data

  try {
    data = JSON.parse(message.data);

    if(data.name && data.message) {
      chatsDisplay.innerHTML += `<div class="chat">
        <h1 class="name">${data.name}</h1>
        <p class="message">${data.message}</p>
      </div>`;

      chatsDisplay.scrollTop = chatsDisplay.scrollHeight;
    }
  } catch(e) {
    
  }

  console.log(data);
}

document.getElementById("messageForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const username = document.getElementById("username").innerText; 
  const message = event.target.message.value;
  
  client.send(JSON.stringify({"roomId": roomId, "message": message}));

  chatsDisplay.innerHTML += `<div class="chat">
    <h1 class="name">${username}</h1>
    <p class="message">${message}</p>
  </div>`;

  chatsDisplay.scrollTop = chatsDisplay.scrollHeight;
});


console.log("script loaded");
