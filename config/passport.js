const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const fileUploaderController = require("../controllers/file-uploader-controller");

// Set up passport local strategy
passport.use(
  new LocalStrategy({ usernameField: "email", passwordField: "password" } ,
    async (email, password, done) => {
    try {
      const user = await fileUploaderController.findUserByEmail(email);
      if (!user) return done(null, false, { message: "Incorrect email" });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return done(null, false, { message: "Incorrect password" });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// Serialize  user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await fileUploaderController.findUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;