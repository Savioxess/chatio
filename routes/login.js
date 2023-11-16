const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const connection = require("../utils/dbConnection");
const client = require("../utils/cacheDb");
const {v4: uuidv4} = require("uuid");


const loginRouter = (req, res) => {
  if(req.method == "GET") {
    const loginPage = fs.readFileSync(path.join(__dirname, "../view/login.html"));
    res.setHeader("Content-Type", "text/html");
    res.write(loginPage);
    return res.end();
  } else if(req.method == "POST") {
    let body = "";
    let formData = {};
    req.on("data", (chunk) => {
      console.log("data: " + chunk);
      body += chunk;
    })

    req.on("end", async () => {
      body = decodeURIComponent(body);
      body = body.split("&");

      body.forEach(element => {
        let prop = element.split("=");
        formData[prop[0]] = prop[1];
      })

      const values = [formData.email];

      const query = connection.query(`select email, username, password from users where email=?;`, values, async (error, results) => {
        if(error) {
          console.error(error);
          res.writeHead(301, { Location: "/login"});
          return res.end();
        }

        const isPasswordValid = await bcrypt.compare(formData.password, results[0].password);

        if(!isPasswordValid) {
          res.writeHead(301, { Location: "/login"});
          return res.end();
        } else {
          const sessionId = uuidv4();
          const expiraionDate = new Date();
          expiraionDate.setDate(expiraionDate.getDate() + 2);
          const expires = expiraionDate.toUTCString();
          const sessionCookie = `sid=${sessionId}; Expires=${expires}; Path=/; HttpOnly`;

          await client.connect();

          await client.set(`${sessionId}`, results[0].email, {
            EX: 172800,
            NX: true
          });

          await client.disconnect();
          res.setHeader("Set-Cookie", sessionCookie);
          res.writeHead(301, { Location: "/"});
          return res.end();
        }
      })
    })

  }
}

module.exports = loginRouter;
