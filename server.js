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
  console.log("hit books");
  // console.log("req obj: req.body: ", req.query);
  let searchQuery = req.query.query;
  if (searchQuery) {
    searchQuery = searchQuery.replace(" ", "+");
    // console.log("searchQuery: ", searchQuery);
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
        console.log("needed id: ", elem.id);
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

app.get("/list-items", async (req, res) => {
  // console.log("in list-items server");
  let booksList = [];
  const token = req.headers.authorization.replace("Bearer ", "");
  // console.log("token: ", "|" + token + "|");
  const { _id } = jwt.verify(token, APP_SECRET);

  const user = await User.findById(_id); //User.find({ _id });

  // console.log("users book with dynamic data: ", user.books[0]);

  user.books.forEach(function (elem) {
    let listItem = {
      book: {
        title: "Lord of the rings",
        author: "J R Tolkien",
        coverImageUrl:
          "https://images-na.ssl-images-amazon.com/images/I/51r6XIPWmoL._SX331_BO1,204,203,200_.jpg",
        id: "618645616",
        pageCount: 1178,
        publisher: "Houghton Mifflen Harcourt",
        synopsis: "everyone wants a ring",
      },
      bookId: elem.bookId,
      finishDate: elem.finishDate,
      // id: "26023228424",
      notes: elem.notes,
      ownerId: elem.ownerId,
      rating: elem.rating,
      startDate: elem.startDate,
    };
    // console.log("list item here: ", listItem);
    booksList.push(listItem);
  });

  console.log("length of array: ", booksList.length);

  // let myReq = await axios.get(
  //   // "https://www.googleapis.com/books/v1/volumes?q=poop"
  //   "https://www.googleapis.com/books/v1/volumes/2jtvmYDrhoQC"
  // );

  // console.log("my reading list yup: ", myReq.data);

  // const currentBook = await axios.get(
  //   `https://www.googleapis.com/books/v1/volumes/${user.books[0].bookId}`
  // );

  // console.log("currentBook: ", currentBook);

  const listItems = {
    listItems: booksList,
  };

  res.send(JSON.stringify(listItems));
});

// book: {
//   title: "Lord of the rings",
//   author: "J R Tolkien",
//   coverImageUrl:
//     "https://images-na.ssl-images-amazon.com/images/I/51r6XIPWmoL._SX331_BO1,204,203,200_.jpg",
//   id: "618645616",
//   pageCount: 1178,
//   publisher: "Houghton Mifflen Harcourt",
//   synopsis: "everyone wants a ring",
// },

app.post("/list-items", async (req, res) => {
  // console.log("in list-items server hello?");

  const token = req.headers.authorization.replace("Bearer ", "");
  // console.log("token: ", "|" + token + "|");
  const { _id } = jwt.verify(token, APP_SECRET);
  // console.log("users _id is: ", _id);
  const user = await User.findById(_id); //User.find({ _id });

  let newListItem = {
    bookId: "618645616",
    finishDate: null,
    id: "26023228424",
    notes: "Cool book yo",
    ownerId: "5fc6aca2355c5920ccb210c7",
    rating: -1,
    startDate: 1606932788305,
  };

  user.books.push(newListItem);
  user.save();
  // console.log("User saved!");
  const listItems = {
    listItems: [
      {
        bookId: "618645616",
        finishDate: null,
        id: "26023228424",
        notes: "Cool book yo",
        ownerId: "5fc6aca2355c5920ccb210c7",
        rating: -1,
        startDate: 1606932788305,
      },
    ],
  };

  res.send(JSON.stringify(listItems));
});

app.get("/bootstrap", async (req, res) => {
  // console.log("top of /bootstrap");
  const token = req.headers.authorization.replace("Bearer ", "");
  // console.log("token in bootstrap: ", "|" + token + "|");
  const { _id } = jwt.verify(token, APP_SECRET);
  // console.log("id of user: ", _id);
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
  // console.log("Ready to send er back!");
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
