const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  outgoing_user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  incoming_user: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

// Virtual for URL
ChatSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/chat/${this._id}`;
});

// Export model
module.exports = mongoose.model("Chat", ChatSchema);