require("dotenv").config();

const express = require("express");
const session = require("express-session");
const { MongoClient, ObjectId } = require("mongodb");
const multer = require("multer");

const app = express();
const port = process.env.PORT || 3000;

const upload = multer({ dest: "static/upload/" });

const dbUri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

if (!dbUri) {
  throw new Error("MONGO_URI ontbreekt in je .env bestand");
}

const client = new MongoClient(dbUri);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "geheim123",
    resave: false,
    saveUninitialized: false,
  })
);

app.set("view engine", "ejs");
app.set("views", "views");

function getUsersCollection() {
  return client.db(dbName).collection("users");
}

function isValidId(id) {
  return ObjectId.isValid(id);
}

async function connectDB() {
  try {
    await client.connect();
    console.log("Database is connected");
  } catch (error) {
    console.error("DB couldn't be connected", error.message);
  }
}

app.get("/", home);
app.get("/register", showRegister);
app.post("/register", upload.single("cover"), createRegister);
app.get("/profile/:id", showProfile);
app.get("/contact/:ownerId", showContact);
app.get("/yourmatches", showYourMatches);

function home(req, res) {
  res.send("Welcome to the club!");
}

function showRegister(req, res) {
  res.render("register");
}

async function createRegister(req, res) {
  try {
    const usersCollection = getUsersCollection();

    const newUser = {
      userNickname: req.body.userNickname,
      petName: req.body.petName,
      email: req.body.email || "",
      phone: req.body.phone || "",
      cover: req.file ? req.file.filename : null,
    };

    const result = await usersCollection.insertOne(newUser);

    req.session.userId = result.insertedId.toString();

    res.redirect(`/profile/${result.insertedId}`);
  } catch (error) {
    console.error("Fout bij registreren:", error.message);
    res.status(500).send("Er ging iets mis bij het registreren.");
  }
}

async function showProfile(req, res) {
  try {
    const userId = req.params.id;

    if (!isValidId(userId)) {
      return res.status(400).send("Ongeldige gebruiker-id.");
    }

    const usersCollection = getUsersCollection();
    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      return res.redirect("/register");
    }

    res.render("profile", { user });
  } catch (error) {
    console.error("Fout in profile route:", error.message);
    res.status(500).send("Er ging iets mis bij het ophalen van het profiel.");
  }
}

async function showContact(req, res) {
  try {
    const ownerId = req.params.ownerId;

    if (!isValidId(ownerId)) {
      return res.status(400).send("Ongeldige gebruiker-id.");
    }

    const usersCollection = getUsersCollection();

    const matchUser = await usersCollection.findOne({
      _id: new ObjectId(ownerId),
    });

    if (!matchUser) {
      return res.status(404).send("Match gebruiker niet gevonden");
    }

    let currentUser = null;

    if (req.session.userId && isValidId(req.session.userId)) {
      currentUser = await usersCollection.findOne({
        _id: new ObjectId(req.session.userId),
      });
    }

    if (!currentUser) {
      currentUser = matchUser;
    }

    res.render("contact", { matchUser, currentUser });
  } catch (error) {
    console.error("Fout in contact route:", error.message);
    res.status(500).send("Er ging iets mis bij het ophalen van de contactgegevens.");
  }
}

async function showYourMatches(req, res) {
  try {
    const usersCollection = getUsersCollection();
    const currentUserId = req.session.userId;

    let matches = await usersCollection.find().toArray();

    if (currentUserId && isValidId(currentUserId)) {
      matches = matches.filter(
        (user) => user._id.toString() !== currentUserId.toString()
      );
    }

    res.render("yourmatches", { matches });
  } catch (error) {
    console.error("Fout in yourmatches route:", error.message);
    res.status(500).send("Er ging iets mis bij het ophalen van de matches.");
  }
}

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});