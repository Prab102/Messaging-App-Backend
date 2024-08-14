const User = require("../models/user");
const Message = require("../models/message");
const asyncHandler = require("express-async-handler");
const {body, validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");


exports.user_get_data = asyncHandler(async (req,res,next) => {

  const user = await User.findOne({_id: req.params.userid}).select("-password").exec()
  res.json(user);

})
exports.user_get_username = asyncHandler(async (req,res,next) => {

  const user = await User.findOne({username: req.params.username}).select("-password").exec()
  res.json(user);

})

exports.user_edit = asyncHandler(async(req,res,next) => {

  const updatedUser= await User.findByIdAndUpdate(req.user._id, {profilecolor: req.body.profilecolor, statusmessage: req.body.statusmessage}, {});

  res.json("patched");

})
exports.user_get_interaction = asyncHandler(async (req,res,next) => {

  const sentmessages = await Message.find({outgoing_user: req.params.userid}).select("incoming_user timecreated").sort({timecreated:1}).exec();

  const receivedmessages = await Message.find({incoming_user: req.params.userid}).select("outgoing_user timecreated").sort({timecreated:1}).exec();

  //this is array of time and incoming_user
  var keyArray = sentmessages.map( function(item) { 
    
    return {
      // incoming_user : item["incoming_user"].toString(),
      userid : item["incoming_user"].toString(),
      _id: item["incoming_user"],
      timecreated : item["timecreated"]
    }
  
  });

  //recieved array fixed
  var keyArrayR = receivedmessages.map( function(item) { 
    
    return {
      userid : item["outgoing_user"].toString(),
      _id: item["outgoing_user"],
      timecreated : item["timecreated"]
    }
  
  });

  const mergedArray = keyArray.concat(keyArrayR);
  console.log("this is merged array", mergedArray.sort((a, b) => a.timecreated - b.timecreated));

  //gets most recent message (NEEDS TO BE SORTED SO THE MOST RECENT COME SFIRST MAYBE JUST HAVE TO REVERSE ARRAY)
  let uniqueArray = Array.from(
    new Map(mergedArray.map(obj => [obj.userid, obj])).values() //chenged from keyArray to merged array
  );
  console.log("this is unique array", uniqueArray);

  //THIS IS CAUSING ISSUES
  const documents = await User.find({
    _id: { $in: uniqueArray }
  }).select("-password").exec();

  const newArray = uniqueArray.map((item,index) => ({
    ...item, // Spread the existing properties
    user: documents[documents.findIndex(obj => obj.id === item._id.toString())], // Add the new property
  
  }));

  console.log("this is new array", newArray.sort((a, b) => a.timecreated - b.timecreated));

  res.json( 
    newArray
    // "works"
  );

})



//creating a user
exports.user_create_post = [

    // Validate and sanitize fields.
  body("first_name", "First name must not be empty.")
  .trim()
  .isLength({ min: 1 })
  .escape(),
  body("last_name", "Last name must not be empty.")
  .trim()
  .isLength({ min: 1 })
  .escape(),
  body("username", "Username must not be empty.")
  .trim()
  .isLength({ min: 1 })
  .custom(async value => {
    const user = await User.findOne({username: value});
    if(user){
        throw new Error('Username already taken');    
    }
  })
  .escape(),
  body("password", "Password must not be empty.")
  .trim()
  .isLength({ min: 1 })
  .escape(),

 asyncHandler(async (req, res, next) => {
  // Extract the validation errors from a request.
  const errors = validationResult(req);

        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
            
                try{
                    const user = new User({
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        username: req.body.username,
                        password: hashedPassword,
                    });

                    if (!errors.isEmpty()) {
                        // There are errors. Render form again with sanitized values/error messages.
                        console.log(errors.errors[0].msg);
                        res.statusMessage = errors.errors[0].msg;
                        res.send(errors.errors[0].msg);
                        // res.responseText(errors.errors[0].msg);
                      }else{
                        await user.save();
                        res.send("user was added to database");
                      }
                }catch(err){
                    return next(err);
                }
        });
 }),
];