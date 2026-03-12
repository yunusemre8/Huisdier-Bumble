
const express = require("express");
const session = require('express-session')
const dotenv = require("dotenv");
const multer = require("multer");
const { MongoClient } = require("mongodb");
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const upload = multer({ dest: 'static/upload/' })


function add(req, res) {
    console.log(req.file.filename)
}

async function connectMongo() {
    try {
        const client = new MongoClient(process.env.MONGO_URI);
        await client.connect();

        db = client.db(process.env.DB_NAME);

        console.log("Database is connected");
    } catch (error) {
        console.error("DB couldn't be connected", error.message);
        process.exit(1);
    }
}

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs')
app.set('views', 'views')

app.use(express.static("static")); //user's images

app.post('/register', upload.single('cover'), async(req, res) => {
    try {
        const id = req.body.userNickname.toLowerCase();

        const newUser = {
            id, userNickname: req.body.userNickname,
            petName: req.body.petName,
            cover: req.file ? req.file.filename : null,
            createdAt: new Date(),
        };
        await db.collection('users').insertOne(newUser);
        res.redirect(`/profile/${id}`)
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred during registration")

    }
});



app.get('/', home)
app.get('/register', register)
app.get('/profile/:id', profile)


function home(req, res) {
    res.send('Welcome to the club!')
}
function register(req, res) {
    res.render('register')
}

async function startServer() {
  await connectMongo();

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();

async function profile(req, res) {
    try{
        const user = await db.collection("users").findOne({
            id: req.params.id,
        });
        if(!user) return res.redirect("/register");
        res.render("profile", {user});
    } catch(error){
        console.error(error);
        res.status(500).send("Profile couldn't be loaded")
    }
} 

// app.use(session({
//     resave: false,
//     saveUninitialized: true,
//     secret: process.env.SESSION_SECRET
// }))