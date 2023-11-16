# About Chatio
Chatio is a chat application made using plain javascript websockets. The application lets you add friends and chat with them. Chatio utilizes the plain javascript websockets for real time communication between the clients.

# Setup Guide

Make sure you have Node >= 18

## Step 1

Clone the repo and run the following command to install the required dependencies.
` npm install `

**_NOTE:_**  Make sure you have MySQL installed on your system if you haven't already.

## Step 2

Run MySQL and create a database called chatio and create the following table inside of it with the given schema.

### "users" table
| Field       | Type         | Null | Key | Default | Extra |
|-------------|--------------|------|-----|---------|-------|
| email       | varchar(30)  | NO   | PRI | NULL    |       |
| username    | varchar(20)  | YES  |     | NULL    |       |
| password    | varchar(100) | YES  |     | NULL    |       |
| date        | date         | YES  |     | NULL    |       |
| friend_list | json         | YES  |     | NULL    |       |

### "friends" table
| Field  | Type         | Null | Key | Default | Extra |
|--------|--------------|------|-----|---------|-------|
| rel_id | varchar(100) | YES  |     | NULL    |       |
| email1 | varchar(40)  | YES  |     | NULL    |       |
| email2 | varchar(40)  | YES  |     | NULL    |       |
| date   | date         | YES  |     | NULL    |       |

### "friend_requests" table
| Field    | Type        | Null | Key | Default | Extra |
|----------|-------------|------|-----|---------|-------|
| sender   | varchar(40) | YES  |     | NULL    |       |
| receiver | varchar(40) | YES  |     | NULL    |       |
| date     | date        | YES  |     | NULL    |       |

### "chat_rooms" table
| Field       | Type         | Null | Key | Default | Extra |
|-------------|--------------|------|-----|---------|-------|
| roomid      | varchar(100) | NO   | PRI | NULL    |       |
| member_list | json         | YES  |     | NULL    |       |
| chats       | json         | YES  |     | NULL    |       |

## Step 3 (Additional Configurations)
Go into the dbConnection.js file in the utils folder and change the host, user or password if needed. Make sure the value of database is same as the database you created in MySQL.

Keep the value of multipleStatements set to true always in order to not run into any issues.

## Step 4
Run the following command in your terminal to run the server.
` npx nodemon index.js `

It will ask you to confirm installation of nodemon, simply confirm and the server will be running.
