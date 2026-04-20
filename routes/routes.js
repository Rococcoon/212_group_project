const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

let User = require('../models/user');
let Movie = require('../models/movie');

const loginCheck = (req, res, next) => {
  if (!req.session.loggedInUser) {
    return res.redirect('/login');
  } else {
    return next();
  }
};

router.get("/", (req, res) => {
  if (req.session.loggedInUser) {
    res.redirect("/movies");
  } else {
    res.render("home", {
      user: req.session.loggedInUser || null
    });
  }
});

router.get("/createAccount", (req, res) => {
  if (!req.session.loggedInUser) {
    res.render("createAccount", { user: null });
  } else {
    res.redirect("/");
  }
});


router.post("/createAccount", async (req, res) => {
  await check('fname', 'First name is required').notEmpty().run(req);
  await check('lname', 'Last name is required').notEmpty().run(req);
  await check('email', 'Valid email is required').notEmpty().isEmail().run(req);
  await check('password', 'Password is required').notEmpty().run(req);

  const errors = validationResult(req);

  if (errors.isEmpty() && !req.session.loggedInUser) {
    try {
      const userToCreate = new User({
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email
      });

      bcrypt.genSalt(12, (err, salt) => {
        bcrypt.hash(req.body.password, salt, async (err, hashed_password) => {
          userToCreate.password = hashed_password;
          await userToCreate.save();
          res.redirect('/login');
        });
      });
    } catch (error) {
      res.status(500).send("Error creating account");
    }
  } else {
    res.send("Validation errors occurred.");
  }
});

router.get("/login", (req, res) => {
  if (!req.session.loggedInUser) {
    res.render("login", { user: null });
  } else {
    res.redirect("/");
  }
});


router.post("/login", async (req, res) => {
  const result = await User.findOne({ email: req.body.email });
  if (result) {
    bcrypt.compare(req.body.password, result.password, (err, success) => {
      if (success) {
        req.session.loggedInUser = result;
        req.session.save((err) => {
          if (err) return res.send("Session save error");
          res.redirect('/movies');
        });
      } else {
        res.redirect('/login');
      }
    });
  } else {
    res.send("User not found");
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

router.get("/movies", loginCheck, async (req, res) => {
  const userMovies = await Movie.find({ user: req.session.loggedInUser._id });
  res.render("movies", {
    movies: userMovies,
    user: req.session.loggedInUser
  });
});

router.post("/movies", loginCheck, async (req, res) => {
  await Movie.create({
    title: req.body.mtitle,
    year: req.body.myear,
    user: req.session.loggedInUser._id
  });
  res.redirect('/movies');
});

router.post("/deleteMovie/:id", loginCheck, async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.redirect("/movies");
});

router.get("/editMovie/:id", loginCheck, async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  res.render("editMovie", {
    movie: movie,
    user: req.session.loggedInUser
  });
});

router.post("/editMovie/:id", loginCheck, async (req, res) => {
  await Movie.findByIdAndUpdate(req.params.id, {
    title: req.body.mname,
    year: req.body.myear
  });
  res.redirect("/movies");
});

module.exports = router;
