
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
        console.log('insertOne result:', userResult)  
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
        req.session.save(() => {
          res.redirect(`/matches/${userId}`)
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred during registration")

    }
});

router.get('/', home)
router.get('/register', register)
router.get('/profile/:id', profile)
// router.get('/matches/:id', uservalidate, matchesPage)
router.get('/matches/:id', matchesPage)
router.get('/edit-profile/:id', editProfilePage)
router.post('/edit-profile/:id', upload.single('cover'), editProfilePost)
router.get('/add-pet/:id', addPetPage)
router.post('/add-pet/:id', upload.single('cover'), addPetPost)
router.post('/delete-account/:id', deleteAccount)

app.use('/', router);

// app.use('/', uservalidate, register, profile, matchesPage)

// app.get('/', home)
// app.get('/register', register)
// app.get('/profile/:id', profile)
// app.get('/matches/:id', matchesPage);


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
          { _id: new ObjectId(req.body.id) },
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
      if (!fromUserId || !toUserId || !action) {
          return res.status(400).json({ success: false, message: "fromUserId, toUserId en action zijn verplicht" });
      }
      if (!["like", "dislike"].includes(action)) {
          return res.status(400).json({ success: false, message: "Ongeldige action" });
      }
      if (fromUserId === toUserId) {
          return res.status(400).json({ success: false, message: "Je kunt niet op jezelf swipen" });
      }

      const fromObjectId = new ObjectId(fromUserId);
      const toObjectId = new ObjectId(toUserId);

      const result = await db.collection("swipes").updateOne(
          { fromUserId: fromObjectId, toUserId: toObjectId },
          { $set: { fromUserId: fromObjectId, toUserId: toObjectId, action: action, createdAt: new Date() } },
          { upsert: true }
      );

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
      res.json({ success: true, isMatch });
  } catch (error) {
      console.error("Fout in /swipe route:", error);
      res.status(500).json({ success: false, message: "Server error" });
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

// eski matchesPage fonksiyonunu bununla değiştir
async function matchesPage(req, res) {
  try {
      const currentUserId = new ObjectId(req.params.id);
      const currentUser = await db.collection("users").findOne({ _id: currentUserId });
      if (!currentUser) return res.redirect("/register");

      const mySwipes = await db.collection("swipes").find({ fromUserId: currentUserId }).toArray();

      const swipedUserIds = mySwipes
          .map((swipe) => {
              if (!swipe.toUserId) return null;
              if (swipe.toUserId instanceof ObjectId) return swipe.toUserId;
              try { return new ObjectId(swipe.toUserId); } catch (error) { return null; }
          })
          .filter(Boolean);

      swipedUserIds.push(currentUserId);

      const animals = await db.collection("animals").find({
          ownerId: { $nin: swipedUserIds }
      }).toArray();

      res.render("matchesPage", { user: currentUser, animals, dogBreeds, catBreeds });
  } catch (error) {
      console.error("matchesPage error:", error);
      res.status(500).send("Matches page couldn't be loaded");
  }
}

const dogBreeds = ['Labrador', 'Golden Retriever', 'Poodle', 'Border Collie', 'Beagle', 'French Bulldog'];
const catBreeds = ['Persian', 'Maine Coon', 'Siamese', 'Ragdoll', 'Bengal', 'Scottish Fold'];

router.get('/filter', filterPage);



app.get('/api/pets', async (req, res) => {
  try {
      const { petType, breeds, size, frequency, place, city } = req.query;

      const matchAnimal = {};
      const matchOwner = {};

      if (petType) matchAnimal.petType = petType;
      if (breeds) matchAnimal.petBreed = { $in: breeds.split(',') };
      if (size) {
          const ranges = { small: [0, 10], medium: [10, 25], large: [25, 999] };
          const [min, max] = ranges[size];
          matchAnimal.petWeight = { $gte: min, $lt: max };
      }

      if (frequency) matchOwner['owner.isFrequency'] = frequency;
      if (place) matchOwner['owner.preferPlace'] = place;
      if (city) matchOwner['owner.userCity'] = { $regex: city, $options: 'i' };

      const pets = await db.collection('animals').aggregate([
          { $match: matchAnimal },
          {
              $lookup: {
                  from: 'users',
                  localField: 'ownerId',
                  foreignField: '_id',
                  as: 'owner'
              }
          },
          { $unwind: '$owner' },
          { $match: matchOwner }
      ]).toArray();

      res.json(pets);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
  }
});

function filterPage(req, res) {
    res.render('filter', {
        isPageTitle: 'Huisdier Bumble',
        dogBreeds,
        catBreeds
    });
}

async function editProfilePage(req, res) {
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) })
  const animal = await db.collection('animals').findOne({ ownerId: user._id })
  res.render('edit-profile', { user, animal })
}

async function editProfilePost(req, res) {
  const userId = new ObjectId(req.params.id)

  await db.collection('users').updateOne({ _id: userId }, {
      $set: {
          userName: req.body.userName,
          userCity: req.body.userCity,
          userPhone: req.body.userPhone || null,
          isFrequency: req.body.isFrequency,
          preferPlace: req.body.preferPlace,
      }
  })

  await db.collection('animals').updateOne({ ownerId: userId }, {
      $set: {
          petName: req.body.petName,
          petType: req.body.petType,
          petBreed: req.body.isBreed,
          petWeight: Number(req.body.isKilo),
          ...(req.file && { cover: req.file.filename })
      }
  })

  res.redirect(`/profile/${req.params.id}`)
}

async function addPetPage(req, res) {
  res.render('add-pet', { userId: req.params.id })
}

async function addPetPost(req, res) {
  const userId = new ObjectId(req.params.id)

  const newAnimal = {
      ownerId: userId,
      petName: req.body.petName,
      petType: req.body.petType,
      petBreed: req.body.isBreed,
      petWeight: Number(req.body.isKilo),
      cover: req.file ? req.file.filename : null,
      createdAt: new Date()
  }

  await db.collection('animals').insertOne(newAnimal)
  res.redirect(`/profile/${req.params.id}`)
}

async function startServer() {
    await connectMongo();

    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

async function deleteAccount(req, res) {
  const userId = new ObjectId(req.params.id)

  await db.collection('animals').deleteMany({ ownerId: userId })
  await db.collection('users').deleteOne({ _id: userId })

  req.session.destroy(() => {
      res.redirect('/register')
  })
}


startServer();


//https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/routes


// edit profile: register sorularini defistir
// another pet/delete your pet
// delete youyr account
// locatie opslaan