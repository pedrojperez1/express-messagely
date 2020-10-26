const express = require("express");
const { DB_URI } = require("../config");
const ExpressError = require("../expressError");
const User = require("../models/user");
const Message = require("../models/message");
const { ensureLoggedIn } = require("../middleware/auth");

const router = new express.Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async (req, res, next) => {
    try {
        console.log(`finding message with id ${req.params.id}`)
        const m = await Message.get(req.params.id);
        if (m.to_user === req.user.username || m.from_user === req.user.username) {
            return res.json({message});
        } else {
            throw new ExpressError("Unauthorized.", 400)
        }
    } catch (e) {
        next(e);
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async (req, res, next) => {
    try {
        const { to_username, body } = req.body;
        if (!to_username || !body) {
            throw new ExpressError("Please provide a username and message body to send message.", 400);
        }
        console.log(`from: ${req.user.username}, to: ${to_username}`);
        const message = await Message.create(req.user.username, to_username, body);
        return res.json({message})
    } catch (e) {
        next(e);
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureLoggedIn, async (req, res, next) => {
    try {
        const toUser = await Message.get(req.params.id).to_user;
        if (toUser !== req.user.username) {
            throw new ExpressError("Unauthorized.", 400);
        }
        const message = await Message.markRead(req.params.id);
        return res.json({message})
    } catch (e) {
        next(e);
    }
})

module.exports = router;