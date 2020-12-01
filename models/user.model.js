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
  //give different access rights if admin or not
  //   isAdmin: Boolean,
});

//custom method to generate authToken
// UserSchema.methods.generateAuthToken = function () {
//   const token = jwt.sign({ _id: this._id }, config.get("myprivatekey")); //get the private key from the config file -> environment variable
//   console.log("when does this happen?");
//   return token;
// };

// *************************** help with the _id to id thing **************
// Duplicate the ID field.
// UserSchema.virtual("id").get(function () {
//   console.log("hello pleaseo");
//   return this._id.toHexString();
// });

// Ensure virtual fields are serialised.
UserSchema.set("toJSON", {
  virtuals: true,
});

const User = mongoose.model("User", UserSchema);

exports.User = User;
