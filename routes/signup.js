const fs = require("fs");
const bcrypt = require("bcryptjs");
const path = require("path");
const connection = require("../utils/dbConnection");

const signupRouter = (req, res) => {
  if(req.method == "GET") {
    const signupPage = fs.readFileSync(path.join(__dirname, "../view/signup.html"));
    res.setHeader("Content-Type", "text/html");
    res.write(signupPage);
    res.end();
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

      const salt = await bcrypt.genSalt(5);
      const hashedPassword = await bcrypt.hash(formData.password, salt);
      const dateToday = new Date();
      const accountCreatedOn = `${dateToday.getFullYear()}-${dateToday.getMonth()}-${dateToday.getDate()}`;
      const values = [formData.email, formData.username, hashedPassword, accountCreatedOn, '{"friends": []}'];
      connection.query(`insert into users values(?, ?, ?, ?, ?);`, values, (error, result) => {
        if(error) {
          res.writeHead(301, { Location: "/signup" }); 
          return res.end();
        } 

        res.writeHead(301, {
          Location: "/login"
        });
        res.end();
      });

    })
  }
}

module.exports = signupRouter;
