const WebSocketServer = require("websocket").server;
const server = require("./serverConfig");
const redisClient = require("./cacheDb");
const connection = require("./dbConnection");
const wsServer = new WebSocketServer({
  httpServer: server,
});

let clientMap = new Map();

wsServer.on("request", async function(request) {
  const connection = request.accept(null, request.origin); 
  
  await redisClient.connect();
  const userEmail = await redisClient.get(request.cookies[0].value);
  await redisClient.disconnect();

  clientMap.set(userEmail, connection);
  
  connection.send("hello from server");
  
  connection.on("message", async (message) => {
    const data = JSON.parse(message.utf8Data).message;
    const roomId = JSON.parse(message.utf8Data).roomId;

    await authorizeUser(request.cookies[0].value, roomId, data);
  })
});

async function authorizeUser(sessionId, roomId, message) {
  await redisClient.connect();
  let userEmail = await redisClient.get(sessionId);
  await redisClient.disconnect();

  connection.query("select * from chat_rooms where roomid=?;", [roomId], async (error, results) => {
    if(error) {
      console.log(error);
      return;
    }

    if(results.length > 0) {
      let members = results[0] && results[0].member_list ? JSON.parse(results[0].member_list).members : [];
      let chats = results[0] && results[0].chats ? JSON.parse(results[0].chats).chats : [];
      let isMember = false;
      let messageReceiver;
      let senderName;
      members.forEach(member => {
        if(member.email == userEmail) {
          senderName = member.username;
          isMember = true;
        } else {
          messageReceiver = member.email;
        }
      })

      
      if(isMember) {
        sendMessage(message, messageReceiver, senderName, chats, roomId);
      }
    }
  })
}

function sendMessage(message, receiver, sender, chats, roomId) {
  const receiverConnection = clientMap.get(receiver) || undefined;
  if(!receiverConnection) {
    return;
  }

  receiverConnection.send(JSON.stringify({"name": sender, "message": message}));
  
  chats.push({"name": sender, "message": message}); 
  let newChats = JSON.stringify({"chats": chats});
  connection.query("update chat_rooms set chats=? where roomid=?;", [newChats, roomId], (error, results) => {
    if(error) {
      console.log(error);
    }
  })
}

module.exports = wsServer;
