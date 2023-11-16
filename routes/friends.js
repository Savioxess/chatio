const path = require("path");
const fs = require("fs");
const connection = require("../utils/dbConnection");
const client = require("../utils/cacheDb");
const ejs = require("ejs");
const url = require("url");
const {v4: uuidv4} = require("uuid");
const { argv0 } = require("process");

const friendsRouter = async (req, res) => {
  if(req.method == "GET") {
    const sid = req.headers.cookie && req.headers.cookie.split("=")[1];

    if(sid) {
      await client.connect();
      const userDetails = await client.get(sid);

      let user;

      connection.query("select username, email, friend_list from users where email=?;", [userDetails], (error, results) => {
        if(error) {

          res.writeHead(500, {"Content-Type": "text/plain"});
          res.end("Internal Server Error");
          return;
        }

        if(results.length < 1) {
          res.writeHead(500, {"Content-Type": "text/plain"});
          res.end("Internal Server Error");
          return;
        }

        connection.query("select * from friend_requests where receiver=?;", [results[0].email], (error, friendRequests) => {    
          let friendRequestsArray = [];

          if(friendRequests.length > 0) {
            friendRequestsArray = friendRequests;
          }
          
          const parsedUrl = url.parse(req.url, true);
          const queryParams = parsedUrl.query;

          let friends = results[0] && (results[0].friend_list ? JSON.parse(results[0].friend_list).friends : []);
          const nameParameter = queryParams && queryParams.name;

          const template = fs.readFileSync(path.join(__dirname, "../view/friends.ejs"), "utf8");
          let friendsPage;
          if(nameParameter) {
            connection.query("select email, username from users where username=? and not username=?;", [nameParameter, results[0].username], (error, results2) => {
              let search = [];

              if(results2.length < 1) {
                friendsPage = ejs.render(template, {username: results[0].username, email: results[0].email , friends: friends, searchResults: search, friendRequests: friendRequestsArray});
                res.writeHead(200, {"Content-Type": "text/html"});
                return res.end(friendsPage);
              }

              connection.query("select * from friend_requests where sender=? or sender=? and receiver=? or receiver=?;", [results[0].email, results2[0].email, results[0].email, results2[0].email], (error, results3) => {
                if(error) {
                  res.writeHead(500, {"Content-Type": "text/plain"});
                  res.end("Internal Server Error");
                  return;
                }

                if(results3.length > 0) {
                  friendsPage = ejs.render(template, {username: results[0].username, email: results[0].email , friends: friends, searchResults: search, friendRequests: friendRequestsArray});
                  res.writeHead(200, {"Content-Type": "text/html"});
                  return res.end(friendsPage);
                }

                for(let i = 0; i < results2.length; i++) {
                  let friendsSet = new Set(friends);
                  let isFriend = false;

                  if(friendsSet.has(results2[0].email)) isFriend = true; 
                  search.push({"email": results2[i].email, "username": results2[i].username, "isFriend": isFriend});  
                }

                friendsPage = ejs.render(template, {username: results[0].username, email: results[0].email , friends: friends, searchResults: search, friendRequests: friendRequestsArray});
                res.writeHead(200, {"Content-Type": "text/html"});
                return res.end(friendsPage);
              });
            })
          } else {
            friendsPage = ejs.render(template, {username: results[0].username, email: results[0].email ,friends: friends, searchResults: [], friendRequests: friendRequestsArray});

            res.writeHead(200, {"Content-Type": "text/html"});
            res.end(friendsPage);
          }
        });
      })

      client.disconnect();
    } else {
      res.writeHead(301, { Location: "/"});
      res.end();
      return;
    }
  }
}

const friendRequest = (req, res) => {
  let body;

  req.on("data", async (chunk) => {
    body = JSON.parse(chunk);
  });

  req.on("end", () => {
    connection.query("select friend_list from users where email=?;", [body.from], (error, results) => {
      let friends =  results[0] && (results[0].friend_list ? JSON.parse(results[0].friend_list).friends : []);

      for(let i = 0; i < friends.length; i++) {
        if(friends[i].friendEmail == body.to) {
          res.writeHead(408, {"Content-Type": "application/json"});
          return res.end('{"error": "User already a friend"}');
        }
      }

      connection.query("select * from friend_requests where sender=? and receiver=?", [body.from, body.to], (error, results2) => {
        if(results2.length > 0) {
          res.writeHead(408, {"Content-Type": "application/json"});
          return res.end('{"error": "Request already sent to user"}');
        }

        const dateToday = new Date();
        const friendRequestSentOn = `${dateToday.getFullYear()}-${dateToday.getMonth()}-${dateToday.getDate()}`;

        connection.query("insert into friend_requests values(?, ?, ?);", [body.from, body.to, friendRequestSentOn], (error, results3) => {
          if(error) {
            res.writeHead(500, {"Content-Type": "application/json"});
            return res.end('{"error": "Internal Server Error"}');
          }

          res.writeHead(201, {"Content-Type": "application/json"});
          res.end('{"success": "Friend Request Sent"}');
        })
      })
    })
  });
}

const acceptRequest = (req, res) => {
  let body;
  req.on("data", (chunk) => {
    body = JSON.parse(chunk);
  })

  req.on("end", async () => {
    connection.query("select friend_list as sender, username as sender_name from users where email=?; select friend_list as receiver, username as receiver_name from users where email=?;", [body.sender, body.receiver], (error, results) => {
      if(error) {
        res.writeHead(500, {"Content-Type": "application/json"});
        return res.end('{"error": "Internal server error"}');
      }
      
      let rel_id = uuidv4();
      let senderFriends = new Set(results[0][0].sender.friends);
      let receiverFriends = new Set(results[1][0].receiver.friends);

      senderFriends.add({"rel_id": rel_id, "friendName": results[1][0].receiver_name, "friendEmail": body.receiver});
      receiverFriends.add({"rel_id": rel_id, "friendName": results[0][0].sender_name, "friendEmail": body.sender});

      senderFriends = Array.from(senderFriends);
      receiverFriends = Array.from(receiverFriends);


      const dateToday = new Date();
      const dateAdded = `${dateToday.getFullYear()}-${dateToday.getMonth()}-${dateToday.getDate()}`;

      let senderList = JSON.stringify({"friends": senderFriends});
      let receiverList = JSON.stringify({"friends": receiverFriends});
      let chatRoomMemberList = JSON.stringify({"members": [{"username": results[0][0].sender_name, "email": body.sender},{"username": results[1][0].receiver_name, "email": body.receiver}]});


      connection.query("update users set friend_list=? where email=?; update users set friend_list=? where email=?; delete from friend_requests where sender=? and receiver=?; insert into chat_rooms values(?, ?, ?); insert into friends values(?, ?, ?, ?)", [senderList, body.sender, receiverList, body.receiver, body.sender, body.receiver, rel_id, chatRoomMemberList, '{"chats": []}', rel_id, body.sender, body.receiver, dateAdded], (error, resultOfUpdate) => {
        if(error) {
          res.writeHead(500, {"Content-Type": "application/json"});
          return res.end('{"error": "Internal server error"}');
        }
        
        res.writeHead(201, {"Content-Type": "application/json"});
        return res.end('{"success": "Works till here"}');
      })
    })
  })
}

const unfriend = (req, res) => {
  let body;
  req.on("data", (chunk) => {
    body = JSON.parse(chunk); 
  })

  req.on("end", async () => {
    const sid = req.headers.cookie && req.headers.cookie.split("=")[1]; 

    if(sid) {
      await client.connect();
      let userEmail = await client.get(sid);
      await client.disconnect();

      connection.query("select * from users where email=?; select * from users where email=?", [userEmail, body.email], (error, results) => {
        if(error) {
          console.log(error);
          res.writeHead(500, {"Content-Type": "application/json"});
          return res.end('{"error": "Internal Server Error"}');
        }

        let friendToRemove;
        let userFriends = results[0][0] && results[0][0].friend_list ? JSON.parse(results[0][0].friend_list).friends : [];
        let otherUserFriends = results[1][0] && results[1][0].friend_list ? JSON.parse(results[1][0].friend_list).friends : [];

        for(let i = 0; i < userFriends.length; i++) {
          if(userFriends[i].rel_id == body.rel_id) {
            friendToRemove = userFriends[i];
            userFriends.splice(i, 1);
            break;
          }
        }

        for(let i = 0; i < otherUserFriends.length; i++) {
          if(otherUserFriends[i].rel_id == body.rel_id) {
            friendToRemove = otherUserFriends[i];
            otherUserFriends.splice(i, 1);
            break;
          }
        }
        
        userFriends = JSON.stringify({"friends": userFriends}); 
        otherUserFriends = JSON.stringify({"friends": otherUserFriends}); 

        connection.query("update users set friend_list=? where email=?; update users set friend_list=? where email=?; delete from chat_rooms where roomid=?; delete from friends where rel_id=?;", [userFriends, userEmail, otherUserFriends, body.email, body.rel_id, body.rel_id], (error, results2) => {
          if(error) {
            console.log(error);
            res.writeHead(500, {"Content-Type": "application/json"});
            return res.end('{"error": "Internal Server Error"}');
          }

          res.writeHead(200, {"Content-Type": "application/json"});
          res.end('{"success": "Friend removed"}');
        })
      })
    }
  })
}

module.exports = { friendsRouter, friendRequest, acceptRequest, unfriend };
