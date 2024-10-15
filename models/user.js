const mongoose = require("mongoose");
const { createTokenForUser } = require("../authentication.js");
const { createHmac, randomBytes } = require("crypto");
const UserSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    url:String,
    filename:String,
  },
  salt: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "user",
  },
  reports: [{
    imageURL: { url:String,filename:String },
    complain: { type: String },
    address: { type: String },
    date: { type: Date },
    category: {
      type: String,
    },
    weight: {
      type: String,
    }
  }]
});

UserSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) return next();

  const salt = randomBytes(16).toString("hex");
  const hashedPassword = createHmac("sha256", salt)
    .update(user.password)
    .digest("hex");

  user.salt = salt;
  user.password = hashedPassword;
  next();
});

UserSchema.statics.matchPassword = async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) throw new Error("Invalid email or password");

  const hashedPassword = createHmac("sha256", user.salt)
    .update(password)
    .digest("hex");
  if (user.password !== hashedPassword)
    throw new Error("Invalid email or password");

  const token = createTokenForUser(user);
  return token;
};

const User = mongoose.model("User", UserSchema);
module.exports = User;
