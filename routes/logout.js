const client = require("../utils/cacheDb");

const logout = async (req, res) => {
  const sid = req.headers.cookie && req.headers.cookie.split("=")[1]; 
  console.log(sid);
  if(sid) {
    await client.connect();
    let user = await client.get(sid);
    console.log(user);

    if(user) {
      await client.del(sid);
      res.writeHead(200, {"Content-Type": "application/json"});
      res.end('{"success": "Logged out user"}');
    } else {
      res.writeHead(200, {"Content-Type": "application/json"});
      res.end('{"error": "Some error occured"}');
    }
    
    await client.disconnect();
    return;
  }
}

module.exports = logout;
