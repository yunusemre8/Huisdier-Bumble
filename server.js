
const express = require("express");
const session = require('express-session')
const dotenv = require("dotenv");
const multer = require("multer");
const { MongoClient, ObjectId } = require("mongodb");
dotenv.config();

const app = express();
const router = express.Router();

const port = process.env.PORT || 3000;

const upload = multer({ dest: 'static/upload/' })

const bcrypt = require("bcrypt")

const uservalidate = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.redirect('/register');
    }
};

let db;

function add(req, res) {
    console.log(req.file.filename)
}

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}))


async function connectMongo() {
    try {
        const client = new MongoClient(process.env.MONGO_URI);
        await client.connect();

        db = client.db(process.env.DB_NAME);

        await db.collection("users").createIndex({ location: "2dsphere" });

        console.log("Database is connected");
    } catch (error) {
        console.error("DB couldn't be connected", error.message);
        process.exit(1);
    }
}

async function createPasswordHash(password){
    try{
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        return hashedPassword
    } catch (error){
        console.log('Error hashingpassword', error)
    }
}

function calculateAge(userBirthDate) {
  const today = new Date()
  let age = today.getFullYear() - userBirthDate.getFullYear()

  const calculateMonth = today.getMonth() - userBirthDate.getMonth()

  if (calculateMonth < 0 ||
    (calculateMonth === 0 && today.getDate() < userBirthDate.getDate())
  ) {
    age--;
  }
  return age
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json())

app.set('view engine', 'ejs')
app.set('views', 'views')

app.use(express.static("static")); //user's images

app.post('/register', upload.single('cover'), async (req, res) => {
    try {
        const existingUser = await db.collection('users').findOne({
            userEmail: req.body.userEmail
        })
        if(existingUser){
            return res.send("Email already registered")
        }

        const userBirthDate = new Date(req.body.userAge)
        const age = calculateAge(userBirthDate)
        if (age < 18) {
            return res.status(400).send("Pet Playdates is for users aged 18+ only.");
        }
        const passwordHash = await createPasswordHash(req.body.isPassword)

        const newUser = {
            userEmail: req.body.userEmail,
            passwordHash: passwordHash,
            userName: req.body.userName,
            userBirthDate: userBirthDate,
            userAge: age,
            userCity: req.body.userCity,
            userPhone: req.body.userPhone || null,
            isFrequency: req.body.isFrequency,
            preferPlace: req.body.preferPlace,
            createdAt: new Date(),
            location: null,
        };
        const userResult = await db.collection('users').insertOne(newUser)
        const userId = userResult.insertedId

        const newAnimal = {
            ownerId: userId,
            petName: req.body.petName,
            petType: req.body.petType,
            petBreed: req.body.isBreed,
            petWeight: Number(req.body.isKilo),
            cover: req.file ? req.file.filename : null,
            createdAt: new Date()
        }

        await db.collection("animals").insertOne(newAnimal)


        req.session.userId = userId.toString()
        res.redirect(`/profile/${userId}`)
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred during registration")


    }
});

router.get('/', home)
router.get('/login', login)
router.get('/register', register)
router.get('/profile/:id', uservalidate, profile)
router.get('/matches/:id', uservalidate, matchesPage)

app.use('/', router);

function home(req, res) {
    res.send('Welcome to the club!')
}
function register(req, res) {
    res.render('register')
}

function contact(req, res){
    res.render('contact')
}


function login(req,res){
    res.render('login',
    { error: null,
        oldEmail: ''
    })
}
app.post('/login', async (req, res) => {
    try {
        const { userEmail, isPassword } = req.body
        const user = await db.collection('users').findOne({ userEmail })

        if (!user) {
            return res.render('login', {
                error: 'Email or password is incorrect', //user couldnt find, email enumeration
                oldEmail: userEmail
            })
        }

        const isMatch = await bcrypt.compare(isPassword, user.passwordHash)

        if (!isMatch) {
            return res.render('login', {
                error: 'Email or password is incorrect',
                oldEmail: userEmail
            })
        }

        req.session.userId = user._id.toString()
        res.redirect(`/profile/${user._id}`)
    } catch (error) {
        console.error(error)
        res.status(500).send('Login error')
    }})
    
app.post("/save-location", async (req, res) => {
    try {
        const { id, lat, lng } = req.body;

        if (!id || lat == null || lng == null) {
            return res.status(400).json({
                success: false,
                message: "id, lat en lng zijn verplicht",
            });
        }

        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    location: {
                        type: "Point",
                        coordinates: [Number(lng), Number(lat)],
                    },
                },
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "user doesnt exist",
            });
        }

        res.json({
            success: true,
            message: "Location saved",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

async function profile(req, res) {
    try {
        const user = await db.collection("users").findOne({
            _id: new ObjectId(req.params.id),
        });

        if (!user) return res.redirect("/register");

        const animal = await db.collection("animals").findOne({
            ownerId: user._id
        });

        res.render("profile", { user, animal });
    } catch (error) {
        console.error(error);
        res.status(500).send("Profile couldn't be loaded");
    }
}


// app.use(session({
//     resave = false,
//     saveUninitialized: true,
//     secret = process.env.SESSION_SECRET
// }))



async function matchesPage(req, res) {
    try {
        const user = await db.collection("users").findOne({
            _id: new ObjectId (req.params.id),
        });

        if (!user) return res.redirect("/register");

        res.render("matches", { user });
    } catch (error) {
        console.error(error);
        res.status(500).send("Matches page couldn't be loaded");
    }
}

async function startServer() {
    await connectMongo();

    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

startServer();

// https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/routes