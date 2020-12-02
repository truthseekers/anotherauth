const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const cors = require("cors");
const { User } = require("./models/user.model");
const { response } = require("express");
const jwt = require("jsonwebtoken");
const APP_SECRET = "a92hqajerignve030vba";
const axios = require("axios");

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

//https: //www.googleapis.com/books/v1/volumes?q=search+terms

// title
// coverImageURL
// author
// id
// pageCount
// publisher
// synopsis

app.get("/books", (req, res) => {
  console.log("req obj: req.body: ", req.query);
  let searchQuery = req.query.query;
  if (searchQuery) {
    searchQuery = searchQuery.replace(" ", "+");
    console.log("searchQuery: ", searchQuery);
  } else {
    let random = [
      "love",
      "war",
      "hate",
      "economics",
      "sea",
      "murder",
      "physics",
      "film",
      "environment",
      "collapse",
      "space",
    ];
    const randomItem = random[Math.floor(Math.random() * random.length)];
    searchQuery = randomItem;
  }

  axios
    .get(`https://www.googleapis.com/books/v1/volumes?q=${searchQuery}`)
    .then(function (response) {
      // console.log("repsonse from google books: ", response.data.items);
      const volumeList = response.data.items;

      const responseObj = {
        books: [],
      };

      volumeList.forEach(function (elem) {
        // console.log(elem);
        // console.log("title: ", elem.volumeInfo.title);
        // console.log("thumbnail: ", elem.volumeInfo.imageLinks.thumbnail);
        // console.log("author: ", elem.volumeInfo.authors);
        // console.log("id: ", elem.id);
        // console.log("pageCount: ", elem.volumeInfo.pageCount);
        // console.log("publisher: ", elem.volumeInfo.publisher);
        // console.log("synopsis: ", elem.volumeInfo.description);
        let newBook = {
          title: elem.volumeInfo.title,
          coverImageUrl: elem.volumeInfo.imageLinks.thumbnail,
          author: elem.volumeInfo.authors,
          id: elem.id,
          pageCount: elem.volumeInfo.pageCount,
          publisher: elem.volumeInfo.publisher,
          synopsis: elem.volumeInfo.description,
        };
        responseObj.books.push(newBook);
      });

      res.send(JSON.stringify(responseObj));
    });

  // res.send(JSON.stringify(books));
});

app.get("/list-items", (req, res) => {
  console.log("in list-items server");
  const listItems = {
    listItems: ["yeah buddy"],
  };
  res.send(JSON.stringify(listItems));
});

app.get("/bootstrap", async (req, res) => {
  console.log("top of /bootstrap");
  const token = req.headers.authorization.replace("Bearer ", "");
  console.log("token in bootstrap: ", "|" + token + "|");
  const { _id } = jwt.verify(token, APP_SECRET);

  const user = await User.findById(_id); //User.find({ _id });

  user.id = user._id;
  user.token = token;

  const returnObj = {
    listItems: [],
    user: {
      id: user.id,
      token: token,
      username: user.username,
    },
  };
  console.log("Ready to send er back!");
  res.send(JSON.stringify(returnObj));
});

app.post("/register", async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const newUser = new User({
    username: req.body.username,
    password: hashedPassword,
    email: req.body.username + "@" + req.body.username + ".com",
  });

  const token = jwt.sign({ _id: newUser._id }, APP_SECRET);
  const responseObject = {
    user: {
      _id: newUser._id,
      username: newUser.username,
      token: token,
    },
  };

  newUser.save(function (err, user) {
    if (err) {
      return err;
    } else {
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

app.post("/login", async (req, res) => {
  // const hashedPassword = await bcrypt.hash(req.body.password, 10);
  //  const user = users.find((user) => (user.name = req.query.name));
  const user = await User.findOne({ username: req.body.username });
  if (user == null) {
    return res.status(400).send("cannot find user");
  }

  if (await bcrypt.compare(req.body.password, user.password)) {
    const token = jwt.sign({ _id: user._id }, APP_SECRET);
    const responseObject = {
      user: {
        _id: user._id,
        username: user.username,
        token: token,
      },
    };

    res.send(JSON.stringify(responseObject));
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
