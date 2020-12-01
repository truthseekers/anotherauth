const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const cors = require("cors");
const { User } = require("./models/user.model");
const { response } = require("express");
const jwt = require("jsonwebtoken");
const APP_SECRET = "a92hqajerignve030vba";

const corsOptions = {
  origin: "http://localhost:3000",
  optionSuccessStatus: 200,
};

app.use(express.json());

app.use(cors(corsOptions));

const users = [];

app.get("/users", (req, res) => {
  res.json(users);
  // res.send("uggh");
});

//connect to mongodb
mongoose
  .connect(
    "mongodb+srv://john:john@cluster0.vwte8.mongodb.net/auth?retryWrites=true&w=majority",
    { useNewUrlParser: true }
  )
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB..."));

const db = mongoose.connection;

app.post("/users", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.query.password, salt);
    const user = { name: req.query.name, password: hashedPassword };
    users.push(user);
    res.status(201).send();
  } catch {
    res.status(500).send("Stupid thing");
  }
});

app.get("/bootstrap", async (req, res) => {
  // console.log("in bootstrap. req: ", req);
  const token = req.headers.authorization.replace("Bearer ", "");
  console.log("token in bootstrap: ", "|" + token + "|");
  const { _id } = jwt.verify(token, APP_SECRET);

  // console.log(": ", jwtResult);
  const user = await User.findById(_id); //User.find({ _id });
  console.log("user NOT tojson: ", user);
  console.log("user (toJSON) is: ", user.toJSON());

  user.id = user._id;
  user.token = token;
  // console.log("received back from jwt after verification: ", jwtResult);
  console.log("token: ", token);
  console.log("users token: ", user.token);

  const returnObj = {
    listItems: [],
    user: {
      id: user.id,
      token: token,
      username: user.username,
    },
  };
  // console.log("returning hardcoded Bob");
  res.send(JSON.stringify(returnObj));
});

app.post("/register", async (req, res) => {
  // console.log("regist HIT YO");

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const newUser = new User({
    username: req.body.username,
    password: hashedPassword,
    email: req.body.username + "@" + req.body.username + ".com",
  });

  // console.log("newUser: ", newUser);

  const token = jwt.sign({ _id: newUser._id }, APP_SECRET);
  console.log("token from jwt.sign: ", "|" + token + "|");
  const responseObject = {
    user: {
      _id: newUser._id,
      username: newUser.username,
      token: token,
    },
  };

  newUser.save(function (err, user) {
    if (err) {
      // console.log("There was an error: ", err);
      return err;
    } else {
      // console.log("No error. check db for user");
    }
  });

  res.send(JSON.stringify(responseObject));

  // res.send(JSON.stringify(sentData));
  // const user = users.find((user) => (user.name = req.query.name));
  // if (user == null) {
  //   return res.status(400).send("cannot find user");
  // }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      res.send("success");
    } else {
      res.send("not allowed");
    }
  } catch {
    res.status(500).send();
  }
});

app.post("/users/login", async (req, res) => {
  const user = users.find((user) => (user.name = req.query.name));
  if (user == null) {
    return res.status(400).send("cannot find user");
  }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      res.send("success");
    } else {
      res.send("not allowed");
    }
  } catch {
    res.status(500).send();
  }
});

app.listen(3001);
