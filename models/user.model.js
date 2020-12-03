const config = require("config");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

//simple schema
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    // minlength: 3,
    // maxlength: 50,
  },
  username: {
    type: String,
    required: true,
    // minlength: 5,
    // maxlength: 255,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    // minlength: 3,
    // maxlength: 255,
  },
  books: [
    {
      bookId: String,
      finishDate: Date,
      notes: String,
      ownerId: String,
      rating: Number,
      startDate: String,
    },
  ],
  //give different access rights if admin or not
  //   isAdmin: Boolean,
});

// listItems: [
//   {
//     book: {
//       title: "Lord of the rings",
//       author: "J R Tolkien",
//       coverImageUrl:
//         "https://images-na.ssl-images-amazon.com/images/I/51r6XIPWmoL._SX331_BO1,204,203,200_.jpg",
//       id: "618645616",
//       pageCount: 1178,
//       publisher: "Houghton Mifflen Harcourt",
//       synopsis: "everyone wants a ring",
//     },
//     bookId: "618645616",
//     finishDate: null,
//     id: "26023228424",
//     notes: "Cool book yo",
//     ownerId: "5fc6aca2355c5920ccb210c7",
//     rating: -1,
//     startDate: 1606932788305,
//   },
// ],
//custom method to generate authToken
// UserSchema.methods.generateAuthToken = function () {
//   const token = jwt.sign({ _id: this._id }, config.get("myprivatekey")); //get the private key from the config file -> environment variable
//   return token;
// };

// *************************** help with the _id to id thing **************
// Duplicate the ID field.
// UserSchema.virtual("id").get(function () {
//   return this._id.toHexString();
// });

// Ensure virtual fields are serialised.
UserSchema.set("toJSON", {
  virtuals: true,
});

const User = mongoose.model("User", UserSchema);

exports.User = User;
