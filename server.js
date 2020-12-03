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

app.put("/list-items/:bookId", async (req, res) => {
  console.log("****************** BEGIN *****************");
  const token = req.headers.authorization.replace("Bearer ", "");
  const { _id } = jwt.verify(token, APP_SECRET);

  const user = await User.findById(_id); //User.find({ _id });
  // console.log("req.params in mark as read: ", req.params);
  console.log("req.body: ", req.body);
  console.log("req.params: ", req.params);
  // edit the books array elem. then save the user.
  let foundIndex = user.books.findIndex(
    (elem) => elem.bookId == req.params.bookId
  );
  // console.log("user.books elem BEFORE: ", user.books[foundIndex].finishDate);

  user.books[foundIndex].finishDate = user.books[foundIndex].finishDate
    ? null
    : Date.now();
  if (req.body.notes) {
    user.books[foundIndex].notes = req.body.notes;
  }
  // console.log("user.books elem AFTER: ", user.books[foundIndex].finishDate);

  // I only need the rating stuff. I might even get away with just sending an empty object.
  user.save();
  res.send(
    JSON.stringify({
      listItem: {
        ...user.books[foundIndex],
      },
    })
  );
  console.log("****************** END *****************");

  // console.log("book to mark as read: ", user.books[foundIndex]);
});

app.delete("/list-items/:bookId", async (req, res) => {
  const token = req.headers.authorization.replace("Bearer ", "");
  const { _id } = jwt.verify(token, APP_SECRET);

  const user = await User.findById(_id); //User.find({ _id });

  const newBooks = user.books.filter((elem) => {
    return elem.bookId !== req.params.bookId;
  });

  // console.log("currentBooks: ", user.books);
  // console.log("NEW books: ", newBooks);

  user.books = newBooks;
  user.save();

  // console.log("user to delete a book for: ", user);

  // console.log("req.params in delete: ", req.params);
  let emptyObj = { yup: "needs something" };
  res.send(JSON.stringify(emptyObj));
});

app.get("/books/:bookId", async (req, res) => {
  // const token = req.headers.authorization.replace("Bearer ", "");
  // const { _id } = jwt.verify(token, APP_SECRET);

  // const user = await User.findById(_id); //User.find({ _id });

  // let currentBook = user.books.find((elem) => {
  //   return elem.bookId == req.params.bookId;
  // });

  axios
    .get(`https://www.googleapis.com/books/v1/volumes/${req.params.bookId}`)
    .then(({ data }) => {
      // console.log("data from axios: ", data);
      res.send(
        JSON.stringify({
          book: {
            author: data.volumeInfo.authors
              ? data.volumeInfo.authors[0]
              : "unknown author",
            coverImageUrl: data.volumeInfo.imageLinks.thumbnail,
            id: data.id,
            pageCount: data.volumeInfo.pageCount,
            publisher: data.volumeInfo.publisher,
            synopsis: data.volumeInfo.description,
            title: data.volumeInfo.title,
          },
        })
      );
    });
});
/*
Messy code inside. I'm running a separate request for each book to the Google api to get the list of all the books in the users list.
Because I have additional information like "rating" and "notes" that are app-specific and not part of the api, we put that information on
the promise object so we can easily access that info when it's time to add that info to the object that gets returned in the "then" of the promise.
*/
app.get("/list-items", async (req, res) => {
  // console.log("one ");
  const token = req.headers.authorization.replace("Bearer ", "");
  const { _id } = jwt.verify(token, APP_SECRET);

  const user = await User.findById(_id); //User.find({ _id });
  // console.log("user books: ", user.books);
  // console.log("number of books for user: ", user.books.length);
  // console.log("first book: ", user?.books[0]);
  let promiseArray = [];
  if (!user.books) {
    res.send(JSON.stringify({ nobooks: true }));
  }
  user.books.forEach((elem) => {
    // console.log(elem.bookId);
    let promiseObj = axios.get(
      `https://www.googleapis.com/books/v1/volumes/${elem.bookId}`
    );
    promiseObj.bookInfo = {
      bookId: elem.bookId,
      finishDate: elem.finishDate,
      notes: elem.notes,
      id: elem.bookId, // this might break something.
      ownerId: elem.ownerId,
      rating: elem.rating,
      startDate: elem.startDate,
    };
    promiseArray.push(promiseObj);
  });

  // console.log("promiseArray.length: ", promiseArray.length);

  Promise.all(promiseArray).then((values) => {
    let booksList = [];
    values.forEach((elem, index) => {
      // console.log(`title: ${elem.data.volumeInfo.title}`);
      // console.log(`author: ${elem.data.volumeInfo.author}`);
      // console.log("authors?: ", elem.data.volumeInfo.authors);
      let listItem = {
        book: {
          title: elem.data.volumeInfo.title,
          author: elem.data.volumeInfo.authors
            ? elem.data.volumeInfo.authors[0]
            : "author unknown",
          coverImageUrl: elem.data.volumeInfo.imageLinks.thumbnail,
          id: elem.data.id,
          pageCount: elem.data.volumeInfo.pageCount,
          publisher: elem.data.volumeInfo.publisher,
          synopsis: elem.data.volumeInfo.description,
        },
        ...promiseArray[index].bookInfo,
      };
      booksList.push(listItem);
    });

    const listItems = {
      listItems: booksList,
    };

    res.send(JSON.stringify(listItems));
  });
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
    startDate: Date.now(),
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
