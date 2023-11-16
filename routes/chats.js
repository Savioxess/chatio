const connection = require("../utils/dbConnection");
const client = require("../utils/cacheDb");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");

const chatsRouter = async (req, res, roomId) => {
  if(req.method == "GET") {
    const sessionId = req.headers.cookie && req.headers.cookie.split("=")[1];

    if(sessionId) {
      await client.connect();

      const userDetails = await client.get(sessionId);

      await client.disconnect();

      if(!userDetails) {
        res.writeHead(403, {"Content-Type": "text/plain"});
        return res.end("User not authorized");
      }
      
      connection.query("select * from users where email=?;", [userDetails], (error, results) => {
        if(error) {
          res.writeHead(500, {"Content-Type": "text/plain"});
          return res.end("Internal server error");
        }

        connection.query("select * from chat_rooms where roomid=?;", [roomId], (error, room) => {
          if(error) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            return res.end("Internal server error");
          }

          const roomMembers = room[0] && room[0].member_list ? JSON.parse(room[0].member_list).members : [];
          const roomChats = room[0] && room[0].chats ? JSON.parse(room[0].chats).chats : [];
          const friends = results[0] && (results[0].friend_list ? JSON.parse(results[0].friend_list).friends : []);

          let isMember = false;
          let otherMember;

          for(let i = 0; i < roomMembers.length; i++) {
            if(roomMembers[i].email == userDetails) {
              isMember = true;
            } else {
              otherMember = {"username": roomMembers[i].username, "email": roomMembers[i].email};
            }
          }

          if(!isMember) {
            res.writeHead(400, {"Content-Type": "text/plain"});
            return res.end("Not a member of room");
          }

          let template = fs.readFileSync(path.join(__dirname, "../view/chat.ejs"), "utf8");
          let chatPage = ejs.render(template, {"username": results[0].username, "friend": otherMember, "friends": friends, "chats": roomChats});

          res.writeHead(200, {"Content-Type": "text/html"});
          res.end(chatPage);
        })
      })
    } else {
      res.writeHead(301, {Location: "/login"});
      res.end();
    }
  }
}

module.exports = {chatsRouter};
