const express = require("express");
const router = express.Router();

// // Require controller modules.
const user_controller = require("../controllers/userController.js");
const message_controller = require("../controllers/messageController.js");

const passport = require("passport");


//TODO
router.get('/', function(req, res, next) {
    res.send("hello welcome");
});

router.post("/users", user_controller.user_create_post);

router.get("/users/username/:username", user_controller.user_get_username);

//gets all chats user is apart of
//maybe authenticate this too
router.get("/users/:userid/chats", user_controller.user_get_interaction);

router.get("/users/:userid", user_controller.user_get_data);

router.patch("/users/:userid", passport.authenticate("jwt",{session:false}), user_controller.user_edit);

//Authenticate 
//creates a message  
router.post("/messages",passport.authenticate("jwt",{session:false}) ,message_controller.message_create_post);

//gets all messages with authenticated user and selected chatter 
router.get("/users/:userid/messages",passport.authenticate("jwt",{session:false}), message_controller.message_get);


module.exports = router;