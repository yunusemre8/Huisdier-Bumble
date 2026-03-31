const express = require("express");
const session = require('express-session')
const dotenv = require("dotenv");
const multer = require("multer");
const { MongoClient, ObjectId } = require("mongodb");
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const upload = multer({ dest: 'static/upload/' })

const bcrypt = require("bcrypt")

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

        const passwordHash = await createPasswordHash(req.body.isPassword, 10)

        const newUser = {
            userEmail: req.body.userEmail,
            // passwordHash: '',
            userName: req.body.userName,
            userAge: req.body.userAge,
            userCity: req.body.userCity,
            petName: req.body.petName,
            cover: req.file ? req.file.filename : null,
            isFrequency: req.body.isFrequency,
            preferPlace: req.body.preferPlace,
            createdAt: new Date(),
            location: null,

        };
        const result = await db.collection('users').insertOne(newUser)
        const userId = result.insertedId.toString()
        req.session.userId = userId
        res.redirect(`/matches/${userId}`)
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred during registration")

    }
});


app.get('/', home)
app.get('/register', register)
app.get('/profile/:id', profile)
app.get('/matches/:id', matchesPage);


function home(req, res) {
    res.send('Welcome to the club!')
}
function register(req, res) {
    res.render('register')
}


app.post('/save-location', async (req, res) => {
    try {
        const { id, lat, lng } = req.body;
        if (!id || lat == null || lng == null) {
            return res.status(400).json({
                success: false,
                message: 'id, lat en lng zijn verplicht'
            })
        }
        const result = await db.collection('users').updateOne(
            { id: id.toLowerCase() },
            {
                $set: {
                    location: {
                        type: "Point",
                        coordinates: [Number(lng), Number(lat)]
                    }
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'user doesnt exist'
            });
        }

        res.json({
            success: true,
            message: 'Location saved'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

app.post("/swipe", async (req, res) => {
  try {
    const { fromUserId, toUserId, action } = req.body;

    console.log("Nieuwe swipe ontvangen:", { fromUserId, toUserId, action });

    if (!fromUserId || !toUserId || !action) {
      return res.status(400).json({
        success: false,
        message: "fromUserId, toUserId en action zijn verplicht"
      });
    }

    if (!["like", "dislike"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Ongeldige action"
      });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({
        success: false,
        message: "Je kunt niet op jezelf swipen"
      });
    }

    const fromObjectId = new ObjectId(fromUserId);
    const toObjectId = new ObjectId(toUserId);

    const result = await db.collection("swipes").updateOne(
      {
        fromUserId: fromObjectId,
        toUserId: toObjectId
      },
      {
        $set: {
          fromUserId: fromObjectId,
          toUserId: toObjectId,
          action: action,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log("Swipe opgeslagen in MongoDB:", result);

    const savedSwipe = await db.collection("swipes").findOne({
      fromUserId: fromObjectId,
      toUserId: toObjectId
    });

    console.log("Opgeslagen document:", savedSwipe);

    let isMatch = false;

    if (action === "like") {
      const reverseLike = await db.collection("swipes").findOne({
        fromUserId: toObjectId,
        toUserId: fromObjectId,
        action: "like"
      });

      if (reverseLike) {
        isMatch = true;

        const existingMatch = await db.collection("matches").findOne({
          users: { $all: [fromObjectId, toObjectId] }
        });

        if (!existingMatch) {
          await db.collection("matches").insertOne({
            users: [fromObjectId, toObjectId],
            createdAt: new Date()
          });
        }
      }
    }

    res.json({
      success: true,
      isMatch
    });
  } catch (error) {
    console.error("Fout in /swipe route:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

async function profile(req, res) {
    try {
        const user = await db.collection("users").findOne({
            id: req.params.id,
        });
        if (!user) return res.redirect("/register");
        res.render("profile", { user });
    } catch (error) {
        console.error(error);
        res.status(500).send("Profile couldn't be loaded")
    }
}

async function matchesPage(req, res) {
  try {
    const currentUserId = new ObjectId(req.params.id);

    const currentUser = await db.collection("users").findOne({
      _id: currentUserId,
    });

    if (!currentUser) {
      return res.redirect("/register");
    }

    const mySwipes = await db.collection("swipes").find({
      fromUserId: currentUserId
    }).toArray();

    console.log("mySwipes:", mySwipes);

    const swipedUserIds = mySwipes
      .map((swipe) => {
        if (!swipe.toUserId) return null;

        if (swipe.toUserId instanceof ObjectId) {
          return swipe.toUserId;
        }

        try {
          return new ObjectId(swipe.toUserId);
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean);

    swipedUserIds.push(currentUserId);

    console.log("swipedUserIds:", swipedUserIds);

    const animals = await db.collection("users").find({
      _id: { $nin: swipedUserIds }
    }).toArray();

    console.log("animals left:", animals.map(animal => animal._id.toString()));

    res.render("matchesPage", { user: currentUser, animals });
  } catch (error) {
    console.error("matchesPage error:", error);
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