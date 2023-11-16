const mysql = require("mysql");

const dbConfig = {
        host: "localhost",
        user: "root",
        password: "root",
        database: "chatio",
        multipleStatements: true
}

const connection = mysql.createPool(dbConfig);

module.exports = connection;
