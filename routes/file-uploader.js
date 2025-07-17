const { Router } = require("express");
const router = Router();
const passport = require("passport");
const controller = require("../controllers/file-uploader-Controller");

router.get("/", async (req, res) => {
    res.render("home");
})

// Sign up
router.get("/sign-up", (req, res) => {
    res.render("sign-up-form", { data: {} });
});

router.post("/sign-up", async (req, res, next) => {
    // Retrieve form data from body
    const { name, email, password } = req.body;
    try{
        // Create new with using form data
        const newUser = await controller.createUser(name, email, password);
        console.log(`New user ${newUser.username} successfully added.`);
         
        // Automatically log in the new user
        req.login(newUser, function(err) {
            if (err) return next(err);
            return res.redirect("/");
        });
    }
    catch(err) { return next(err) }
});

// Log in
router.get("/log-in", (req, res) => {
    res.render("log-in-form", { error: null });
});

router.post("/log-in", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      // Login failed — show error message
      return res.status(401).render("log-in-form", { error: info.message });
    }

    // Login succeeded
    req.login(user, (err) => {
      if (err) return next(err);
      return res.redirect("/");
    });
  })(req, res, next);
});


// Log out
router.get("/log-out", (req, res, next) => {
    req.logout(function(err) {
        if (err) return next(err);
        res.redirect("/");
    });
});

module.exports = router;