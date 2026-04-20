const express = require("express");
const app = express();
const path = require("path");
const mongoose = require('mongoose');
const session = require('express-session');
const routes = require('./routes/routes');

require('dotenv').config();

const PORT = process.env.PORT || 8000

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use(express.static(path.join(__dirname, "public")))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  }
}))

app.use('/', routes);

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log(`Connection to Mongo established`)
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})
