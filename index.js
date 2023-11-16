const fs = require("fs");
const path = require("path");
const url = require("url");
const server = require("./utils/serverConfig");
const wsServer = require("./utils/websocketServerConfig");

server.on("request", (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const urlSegment = req.url.split("/");
  if(pathname == "/login") {
    const loginRouter = require("./routes/login");
    loginRouter(req, res);
  } else if(pathname == "/friends") {
    const { friendsRouter } = require("./routes/friends");
    friendsRouter(req, res);
  } else if(pathname == "/friendrequest" && req.method == "POST") {
    const { friendRequest } = require("./routes/friends");
    friendRequest(req, res);
  } else if(pathname == "/signup") {
    const signupRouter = require("./routes/signup");
    signupRouter(req, res);
  } else if(pathname == "/logout" && req.method == "GET") {
    const logout = require("./routes/logout");
    logout(req, res);
  } else if(pathname == "/acceptrequest" && req.method == "POST") {
    const { acceptRequest } = require("./routes/friends");
    acceptRequest(req, res);
  } else if(pathname == "/unfriend" && req.method == "PATCH") {
    const {unfriend} = require("./routes/friends");
    unfriend(req, res);
  } else if(urlSegment[1] == "chat") {
    if(urlSegment[2]) {
      const {chatsRouter} = require("./routes/chats");
      chatsRouter(req, res, urlSegment[2]);
    } else {
      res.writeHead(301, {
        Location: "/"
      });
      res.end();
    }
  } else if(pathname == "/") {
    const homeRouter = require("./routes/home");
    homeRouter(req, res);
  } else if(req.url.match("\.css$")) {
    const cssPath = path.join(__dirname, 'public', req.url);
    const cssFile = fs.readFileSync(cssPath);
    res.writeHead(200, {"Content-Type": "text/css"});
    res.write(cssFile); 
    res.end();
  } else if(req.url.match("\.js$")) {
    const jsPath = path.join(__dirname, 'public', req.url);
    const jsFile = fs.readFileSync(jsPath);
    res.writeHead(200, {"Content-Type": "text/javascript"});
    res.write(jsFile); 
    res.end();
  } else {
    res.writeHead(404, {"Content-Typ": "text/plain"});
    res.end("Error Occured");
  }
})

