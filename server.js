const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const { MongoClient, ObjectId } = require("mongodb")

const userValidate = require('./middleware/userValidate');
const messageMiddleware = require('./middleware/message');
const authRoutes = require('./routes/authRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const homeRoutes = require('./routes/homeRoutes');
const profileRoutes = require("./routes/profileRoutes");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static("static"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2,
    },
  })
);

let db;
app.use((req, res, next) => {
  req.db = db;
  next();
});

app.use('/', homeRoutes);
app.use('/', authRoutes);
app.use('/', passwordRoutes);
app.use('/', profileRoutes);
app.use(messageMiddleware);

function isValidId(id) {
  return ObjectId.isValid(id)
}

app.get("/contact/:ownerId", async (req, res) => {
  try {
    const ownerId = req.params.ownerId

    if (!isValidId(ownerId)) {
      return res.status(400).send("Invalid user id.")
    }

    const matchUser = await req.db.collection("users").findOne({
      _id: new ObjectId(ownerId)
    })

    if (!matchUser) {
      return res.status(404).send("Match user not found.")
    }

    let currentUser = null

    if (req.session.userId && isValidId(req.session.userId)) {
      currentUser = await req.db.collection("users").findOne({
        _id: new ObjectId(req.session.userId)
      })
    }

    if (!currentUser) {
      currentUser = matchUser
    }

    res.render("contact", {
      matchUser,
      currentUser
    })
  } catch (error) {
    console.error(error)
    res.status(500).send("Contact page could not be loaded.")
  }
})

app.get("/yourmatches", async (req, res) => {
  try {
    const currentUserId = req.session.userId

    let matches = await req.db.collection("users").find().toArray()

    if (currentUserId && isValidId(currentUserId)) {
      matches = matches.filter(
        user => user._id.toString() !== currentUserId.toString()
      )
    }

    res.render("yourmatches", {
      matches
    })
  } catch (error) {
    console.error(error)
    res.status(500).send("Matches page could not be loaded.")
  }
})


async function startServer() {
  try {
    const client = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017/huisdier-bumble");
    await client.connect();
    
    db = client.db(process.env.DB_NAME || "huisdier-bumble");
    console.log("Database connected successfully 🐾");

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("DB connection error:", error.message);
    process.exit(1);
  }
}

startServer();