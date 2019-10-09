const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const Strategy = require('passport-twitter').Strategy;
const logger = require('morgan');
const session = require('express-session');
const Twitter = require('twitter');

const indexRouter = require('./routes/index');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'h1D0gg1eh0wRY00', 
  resave: true, 
  saveUninitialized: true, 
  cookie: {
    secure: true,
    httpOnly: true,
    //expires: new Date(Date.now() + 900000),
    //keys: ['h1D0gg1eh0wRY00']
  }
}))

// passport
app.use(passport.initialize())
app.use(passport.session())

passport.use(new Strategy({
  consumerKey: 'aMazJwRzSWOkPSE7Xyx7xaMRm',
  consumerSecret: 'abFsgwUUhDhmeidy9BVhjQODJeabCkOrShtiVBRarFXtPk7um8',
  callbackURL: 'https://localhost:3000/login/return'
}, function (token, tokenSecret, profile, done) {
  const twitterClient = new Twitter({
    consumer_key: 'aMazJwRzSWOkPSE7Xyx7xaMRm',
    consumer_secret: 'abFsgwUUhDhmeidy9BVhjQODJeabCkOrShtiVBRarFXtPk7um8',
    access_token_key: token,
    access_token_secret: tokenSecret
  });

  // inject twitter client into user
  profile.twitterClient = twitterClient;

  return done(null, profile);
}));

passport.serializeUser(function (user, done) {
  done(null, user);
})

passport.deserializeUser(function (obj, done) {
  done(null, obj);
})

app.use(function (req, res, next) {
  console.log('Authenticated: ' + req.isAuthenticated());
  if (req.isAuthenticated()) {
    console.log('Tweets:');
    console.log(getTweets(req.session.passport.user));
  }
  
  next();
})

// main routes
app.use('/', indexRouter);

// login
app.get('/login', passport.authenticate('twitter'))

app.get('/login/return', passport.authenticate('twitter', {
  failureRedirect: '/'
}), function (req, res) {
  console.log(req);
  res.redirect('/')
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

function getTweets(user) {
  console.log('hey');
  const client = user.twitterClient;
  const screen_name = user._json.screen_name;

  client.get('statuses/user_timeline', {screen_name: screen_name}, function(err, tweets, res) {
    if (!err) {
     return tweets;
    } else {
      console.log(err);
    }
  })
}

module.exports = app;
