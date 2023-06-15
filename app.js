require('dotenv').config();
const express = require('express');
const app = express();
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static("public")); //use the public directory to store our static files such as images and CSS code.

mongoose.connect(process.env.MONGODB_CONNECTION_STRING);

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

var secret = process.env.SECRET;
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] }); //model 생성전에 만들기

const User = new mongoose.model('User', userSchema)

app.get("/", (req, res) => {
    res.render('home');
});

app.get("/login", (req, res) => {
    res.render('login');
});

app.get("/register", (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    await newUser.save().then((user) => {
        console.log(user);
        res.render("secrets");
    }).catch((err) => console.log(err));


});

app.post('/login', async (req, res) =>
    await User.findOne({ email: req.body.username }).then((foundUser) => {
        if (foundUser) {
            if (foundUser.password === req.body.password) {
                res.render('secrets');
            } else
                res.send('not correct password');
        } else {
            res.send('no user found');
        }
    }).catch((err) => console.log(err)));

app.listen(3000, () => {
    console.log("Server started on port 3000");
});