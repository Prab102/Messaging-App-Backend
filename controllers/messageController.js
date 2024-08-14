const Message = require("../models/message");
const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const {body, validationResult} = require("express-validator");


exports.message_get = asyncHandler(async (req,res,next) => {


  const user = await User.findOne({_id: req.params.userid}).select("-password").exec()

  const allmessages = await Message.find({$or:[ {$and:[{outgoing_user: user._id},{incoming_user: req.user} ]}, {$and:[{outgoing_user: req.user},{incoming_user: user._id} ]} ]} );  

  res.json({
    messages: allmessages,
    }
  );

})

exports.message_create_post = [

    // Validate and sanitize fields.
  body("messagecontent", " message cant be empty")
  .trim()
  .isLength({ min: 1 })
  .escape(),
  
 asyncHandler(async (req, res, next) => {
  // Extract the validation errors from a request.
        const errors = validationResult(req);     
                    //get user from database with provided usernames
                    const recepient = await User.findOne({_id: req.body.incoming_user}).select("-password").exec()

                    const sender = await User.findOne({_id: req.user}).select("-password").exec()  //for postman only

                    const message = new Message({
                        messagecontent: req.body.messagecontent,
                        outgoing_user: req.user, //req.user, //the signed in user  for postman only i added sender
                        incoming_user: recepient, //the selected user
                    });

                    if (!errors.isEmpty()) {
                        // There are errors. Render form again with sanitized values/error messages.
                        res.send("there was an error");
                      }else{
                        // console.log("makes it here");
                        await message.save();
                        res.send("message was added to database");

                      }
  
 }),
];