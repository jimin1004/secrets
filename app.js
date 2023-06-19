require('dotenv').config();
const express = require('express');
const app = express();
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');


app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static("public")); //use the public directory to store our static files such as images and CSS code.

app.use(session({
    secret: '한국어지롱',
    resave: false, //Forces the session to be saved back to the session store 뭔말. 통상적으로 false
    saveUninitialized: false // Forces a session that is "uninitialized" to be saved to the store. 로그인 세션에는 false로
})); //세션 초기설정
app.use(passport.initialize()); // init passport on every route call.
app.use(passport.session()); // allow passport to use "express-session".

mongoose.connect(process.env.MONGODB_CONNECTION_STRING);

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose); //schema에 plugin 추가

const User = new mongoose.model('User', userSchema)

//passport-local-mongoose 설정. doc 참고
passport.use(User.createStrategy()); //passport-local의 LocalStrategy 생성
passport.serializeUser(User.serializeUser()); // 세션에 user 정보 attach. passpport-local-mongoose가 이 과정을 간단하게 처리
passport.deserializeUser(User.deserializeUser()); // 세션에 attach된 user object 얻기

app.get("/", (req, res) => {
    res.render('home');
});

app.get("/login", (req, res) => {
    res.render('login');
});

app.get("/register", (req, res) => {
    res.render('register');
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        res.render('secrets');
    } else {
        res.redirect('/login');
    }
});

app.post('/register', async (req, res) => {

    await User.register({ username: req.body.username, active: true }, req.body.password, async function (err, user) {
        if (err) {
            res.redirect('/register');
            console.log(err);
        } else {
            passport.authenticate('local', {
                successRedirect: '/secrets',
                failureRedirect: '/login',
                failureMessage: true
            })(req, res)
        };


        // redirect는 되는데 되자마자 인증 풀림
        // const authenticate = await User.authenticate();
        // await authenticate(req.body.username, req.body.password, function (err, result) {
        //     if (err) {
        //         res.redirect('/register');
        //         console.log(err);
        //     }
        //     res.redirect('/secrets');
        //     console.log('/secrets');
        //     console.log(result);
        // });


    });
}); // User.register는 passport-local-mongoose 에서 오는 메서드. 몽구스로 user 만드는거 대신에 사용.


app.post('/login', passport.authenticate('local', {
    successRedirect: '/secrets',
    failureRedirect: '/login',
    failureMessage: true
})); // (req,res) 콜백 안에 auth 함수를 넣게되면 auth가 invoke가 안된다고?

app.post('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});