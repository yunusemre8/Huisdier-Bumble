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

app.set("view engine", "ejs");
app.set("views", "views");

async function connectDB() {
    try {
        await client.connect();
        console.log("Database is connected");
    } catch (error) {
        console.error("DB couldn't be connected", error.message);
    }
}

app.get("/", home);
app.get("/register", register);
app.get("/profile/:id", profile);
app.get("/contact/:ownerId", contact);
app.get("/yourmatches", yourmatches);

app.post("/register", upload.single("cover"), async (req, res) => {
    try {
        const db = client.db(dbName);
        const usersCollection = db.collection("users");

        const newUser = {
            userNickname: req.body.userNickname,
            petName: req.body.petName,
            email: req.body.email || "",
            phone: req.body.phone || "",
            cover: req.file ? req.file.filename : null,
        };

        const result = await usersCollection.insertOne(newUser);

        res.redirect(`/profile/${result.insertedId}`);
    } catch (error) {
        console.error("Fout bij registreren:", error.message);
        res.status(500).send("Er ging iets mis bij het registreren.");
    }
});

function home(req, res) {
    res.send("Welcome to the club!");
}

function register(req, res) {
    res.render("register");
}

async function profile(req, res) {
    try {
        const userId = req.params.id;

        if (!ObjectId.isValid(userId)) {
            return res.status(400).send("Ongeldige gebruiker-id.");
        }

        const db = client.db(dbName);
        const usersCollection = db.collection("users");

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

async function contact(req, res) {
    try {
        const ownerId = req.params.ownerId;

        if (!ObjectId.isValid(ownerId)) {
            return res.status(400).send("Ongeldige gebruiker-id.");
        }

        const db = client.db(dbName);
        const usersCollection = db.collection("users");

        const matchUser = await usersCollection.findOne({
            _id: new ObjectId(ownerId),
        });

        if (!matchUser) {
            return res.status(404).send("Match gebruiker niet gevonden");
        }

        res.render("contact", { matchUser });
    } catch (error) {
        console.error("Fout in contact route:", error.message);
        res.status(500).send("Er ging iets mis bij het ophalen van de contactgegevens.");
    }
}

async function yourmatches(req, res) {
    try {
        const db = client.db(dbName);
        const usersCollection = db.collection("users");

        const matches = await usersCollection.find().toArray();

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