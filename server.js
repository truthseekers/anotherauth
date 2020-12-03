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

app.get("/books", async (req, res) => {
  let searchQuery = req.query.query;
  if (searchQuery) {
    searchQuery = searchQuery.replace(" ", "+");
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
      const volumeList = response.data.items;

      const responseObj = {
        books: [],
      };

      volumeList.forEach(function (elem) {
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

app.get("/list-items", async (req, res) => {
  // console.log("one ");
  const token = req.headers.authorization.replace("Bearer ", "");
  const { _id } = jwt.verify(token, APP_SECRET);

  const user = await User.findById(_id); //User.find({ _id });
  // console.log("user books: ", user.books);

  let [u1, u2, u3, u4] = await Promise.all([
    axios.get("https://www.googleapis.com/books/v1/volumes/gzqXdHXxxeAC"),
    axios.get("https://www.googleapis.com/books/v1/volumes/0n67AAAAIAAJ"),
    axios.get("https://www.googleapis.com/books/v1/volumes/BbTiwQEACAAJ"),
    axios.get("https://www.googleapis.com/books/v1/volumes/2jtvmYDrhoQC"),
  ]);

  let booksList = [];
  let promiseArray = [u1, u2, u3, u4];
  // top section comes from the promises.
  // bottom section comes from.... user.books??
  promiseArray.forEach((elem) => {
    let listItem = {
      book: {
        title: elem.data.volumeInfo.title,
        author: elem.data.volumeInfo.authors[0],
        coverImageUrl: elem.data.volumeInfo.imageLinks.thumbnail,
        id: elem.data.id,
        pageCount: elem.data.volumeInfo.pageCount,
        publisher: elem.data.volumeInfo.publisher,
        synopsis: elem.data.volumeInfo.description,
      }, /// these are different?
      bookId: user.books[0].bookId,
      finishDate: user.books[0].finishDate,
      ////// id: "26023228424",
      notes: user.books[0].notes,
      ownerId: user.books[0].ownerId,
      rating: user.books[0].rating,
      startDate: user.books[0].startDate,
    };
    booksList.push(listItem);
  });

  console.log("pushing to booksList");
  console.log("booksList: ", booksList.length);
  const listItems = {
    listItems: booksList,
  };

  res.send(JSON.stringify(listItems));
});

app.post("/list-items", async (req, res) => {
  const token = req.headers.authorization.replace("Bearer ", "");
  const { _id } = jwt.verify(token, APP_SECRET);
  const user = await User.findById(_id); //User.find({ _id });
  // console.log("req of post listItems: ", req.body);
  let newListItem = {
    bookId: req.body.bookId,
    finishDate: null,
    id: "26023228424",
    notes: "",
    ownerId: user.id,
    rating: -1,
    startDate: Date.now,
  };
  // console.log("pushing and saving book with id of: ", newListItem.bookId);
  user.books.push(newListItem);
  user.save();
  const listItems = {
    listItems: [newListItem],
    // listItems: [
    //   {
    //     bookId: "618645616",
    //     finishDate: null,
    //     id: "26023228424",
    //     notes: "Cool book yo",
    //     ownerId: "5fc6aca2355c5920ccb210c7",
    //     rating: -1,
    //     startDate: 1606932788305,
    //   },
    // ],
  };

  res.send(JSON.stringify(listItems));
});

app.get("/bootstrap", async (req, res) => {
  const token = req.headers.authorization.replace("Bearer ", "");
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
