const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  last_name: { type: String, required: true, maxLength: 100 },
  username: {type: String, required: true, unique: true}, //test out the unique functionality
  password: {type:String, required: true},
  statusmessage: {type:String, default:"Hello!"},
  isactive: {type:Boolean, default:false },
  timejoined: {type:Date, default:Date.now},
  profilecolor: {type:String, default:"#b6fcd5" },

});

// Virtual for URL
UserSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/user/${this._id}`;
});

// Export model
module.exports = mongoose.model("User", UserSchema);