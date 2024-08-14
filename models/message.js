const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  messagecontent: {type:String, required: true},
  timecreated: {type:Date, default:Date.now},
  outgoing_user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  incoming_user: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

// Virtual for URL
MessageSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/message/${this._id}`;
});

// Export model
module.exports = mongoose.model("Message", MessageSchema);