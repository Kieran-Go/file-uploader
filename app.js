require("dotenv").config();
const prisma = require('./db/pool');
const path = require("node:path");

// ---------- EXPRESS ----------
const express = require("express"); // Web framework for building server-side apps
const app = express(); // Initialize express
app.set("views", path.join(__dirname, "views")); // Direct views to the "views" folder
app.set("view engine", "ejs"); // Set view engine to ejs
app.use(express.urlencoded({ extended: false })); // Parses URL-encoded bodies (such as HTML forms) into req.body

// ---------- SESSIONS ----------
// Initialize session
const session = require("express-session");

// Connect session to db using prisma session store
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");

// Use session
app.use(session({
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new PrismaSessionStore(
    prisma,
    {
      checkPeriod: 2 * 60 * 1000, // optional — cleanup expired sessions every 2 min
      dbRecordIdIsSessionId: true
    }
  )
}));


// Passport integration with session
const passport = require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());

// Custom middleware: make the logged-in user available in all views
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// ----- USE ROUTES -----
const fileUploaderRouter = require("./routes/file-uploader");
app.use("/", fileUploaderRouter);

// ----- START APP -----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`App listening on port ${PORT}`));

// ----- DISCONNECT FROM DB ON APP CLOSE -----
const shutdown = async () => {
  console.log("\nShutting down...");
  try {
    await prisma.$disconnect();
    console.log("Disconnected from database.");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
};
process.on("SIGINT", shutdown);   // Ctrl+C
process.on("SIGTERM", shutdown);  // kill command