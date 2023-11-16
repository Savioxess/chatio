const path = require("path");
const ejs = require("ejs");
const {createClient} = require("redis");
const fs = require("fs");
const connection = require("../utils/dbConnection");

const client = createClient();

const homeRouter = async (req, res) => {
  if(req.method == "GET") {
    const sessionId = req.headers.cookie && req.headers.cookie.split("=")[1];
    if(sessionId) {
      await client.connect();

      const userDetails = await client.get(sessionId);
      let user;

      connection.query("select * from users where email=?;", [userDetails], async (error, results) => {
        if (error) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Internal Server Error");
          return;
        }

        user = results[0] && results[0].username;
        if(!user) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Internal Server Error");
          return;
        }

        let friends = results[0] && (results[0].friend_list ? JSON.parse(results[0].friend_list).friends : []);

        fs.readFile(path.join(__dirname, "../view/home.ejs"), "utf8", (err, template) => {
          if(err) {
            console.log(err);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Internal Server Error");
            return;
          }

          const homePage = ejs.render(template, {username: user, friends: friends});
          res.setHeader("Content-Type", "text/html");
          res.end(homePage);
        })
      })

      await client.disconnect();
    } else {
      res.writeHead(301, { Location: "/login"});
      res.end();
    }
  }
}

module.exports = homeRouter;
