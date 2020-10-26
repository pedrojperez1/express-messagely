const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const ExpressError = require("../expressError");
const User = require("../models/user");
const Message = require("../models/message");
const { ensureLoggedIn } = require("../middleware/auth");

const router = new express.Router();

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async (req, res, next) => {
    try {
        const {username, password} = req.body;
        if (!username || !password) {
            throw new ExpressError("Must provide username and password.", 400);
        }
        if (User.authenticate(username, password)) {
            User.updateLoginTimestamp(username);
            const token = jwt.sign({ username }, SECRET_KEY)
            return res.json({token});
        } else {
            throw new ExpressError("Wrong username or password.", 400);
        }
    } catch (e) {

    }
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", (req, res, next) => {
    try {
        const { username, password, first_name, last_name, phone } = req.body;
        if (!username || !password || !first_name || !last_name || !phone) {
            throw new ExpressError("Please provide all required fields.", 400);
        }
        const newUser = User.register(
            req.body.username,
            req.body.password,
            req.body.first_name,
            req.body.last_name,
            req.body.phone
        );
        const token = jwt.sign({ username }, SECRET_KEY)
        return res.json({token});
    } catch (e) {
        if (e.code === '23505') {
            return next(new ExpressError("Username taken. Please pick another!", 400));
        }
        next(e);
    }
})

module.exports = router;