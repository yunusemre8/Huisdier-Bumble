const express = require('express')
const multer = require('multer')
const bcrypt = require('bcrypt')
const { MongoClient, ObjectId } = require("mongodb");

const upload = multer({ dest: 'static/upload/' })
const app = express()
const port = 3000

const session = require('express-session')
const userValidate = require('./middleware/userValidate')
const messageMiddleware = require('./middleware/message')

let db
require('dotenv').config()

app.use(express.static('static'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2,
    },
  })
)
app.use(messageMiddleware)

app.set('view engine', 'ejs')


app.get('/', home)

app.get('/register', register)
app.post("/register", upload.single("cover"), async (req, res) => {
  const existingUser = await db.collection('users').findOne({
    userEmail: req.body.userEmail
  })
  if (existingUser) {
    return res.send('Email already registered')
  }

  if (req.body.isPassword !== req.body.checkPassword) {
    return res.status(400).send("Passwords do not match");
  }

  //age warning
  const userBirthDate = new Date(req.body.userAge)
  const age = calculateAge(userBirthDate)

  if (age < 18) {
    return res.status(400).send('Pet Playdates is for users aged 18+ only.');
  }

  const passwordHash = await createPasswordHash(req.body.isPassword)
  const newUser = {
    userName: req.body.userName,
    userBirthDate: userBirthDate,
    userAge: age,
    userCity: req.body.userCity,
    userEmail: req.body.userEmail,
    passwordHash: passwordHash,
    userPhone: req.body.userPhone || null,
    preferContact: req.body.preferContact,
    isFrequency: req.body.isFrequency,
    preferPlace: req.body.preferPlace,
    createdAt: new Date(),
    location: null,
  }

  const userResult = await db.collection('users').insertOne(newUser)
  const userId = userResult.insertedId

  const newAnimal = {
    ownerId: userId,
    petName: req.body.petName,
    petType: req.body.petType,
    petBreed: req.body.isBreed,
    petWeight: Number(req.body.isKilo),
    petBirthYear: Number(req.body.petBirthYear),
    petBirthMonth: Number(req.body.petBirthMonth),
    isVaccinated: req.body.isVaccinated,
    isCastrated: req.body.isCastrated,
    cover: req.file ? req.file.filename : null,
    createdAt: new Date(),
  }
  await db.collection('animals').insertOne(newAnimal)

  res.redirect(`/profile/${userId}`)

});
app.get('/login', login)
app.post("/login", async (req, res) => {
  try {
    const { userEmail, isPassword } = req.body;
    const user = await db.collection("users").findOne({ userEmail });

    if (!user) {
      return res.render('login', {
        message: {
          type: error,
          text: 'User couldnt be found'
        },
        oldEmail: userEmail
      })
    }

    const isMatch = await bcrypt.compare(isPassword, user.passwordHash);

    if (!isMatch) {
      return res.render("login", {
        message: {
          type: 'error',
          text: 'Email or password is incorrect'
        },
        oldEmail: userEmail,
      });
    }
    req.session.userId = user._id.toString();
    return res.redirect(`/matchesPage/${user._id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Login error");
  }

})


app.get('/resetPassword', resetPassword)
app.post('/resetPassword', async (req, res) => {
  try {
    const { resetUserEmail, resetPetName, resetPetWeight, resetNewPassword, confirmResetNewPassword } = req.body
    
    if (!resetUserEmail ||
      !resetPetName ||
      !resetPetWeight ||
      !resetNewPassword ||
      !confirmResetNewPassword) {
      req.session.message = {
        type: 'error',
        text: 'Please fill in all fields'
      };
      return res.redirect('/resetPassword')
    }

    if(resetNewPassword !== confirmResetNewPassword){
      req.session.message={
        type: 'error',
        text: 'Passwords do not match.'
      }
    }

    const user = await db.collection("users").findOne({ userEmail: resetUserEmail })
    if (!user) {
      req.session.message = {
        type: 'error',
        text: 'User could not be found.'
      }
      return res.redirect('/resetPassword')
    }
    const animal = await db.collection('animals').findOne({ ownerId: user._id })
    if (!animal) {
      req.session.message = {
        type: 'error',
        text: 'No pet found for this account.'
      }
      return res.redirect('resetPaswoord')
    }

    if (animal.petName.trim().toLowerCase() !== resetPetName.trim().toLowerCase()) {
      req.session.message = {
        type: 'error',
        text: 'Values do not match.'
      }
      return res.redirect('/resetPassword')
    }

    if (Number(animal.petWeight) !== Number(resetPetWeight)) {
      req.session.message = {
        type: 'error',
        text: 'Values do not match.'
      }
      return res.redirect('/resetPassword')
    }

    const newPassswordHash = await bcrypt.hash(resetNewPassword, 10)
    await db.collection('users').updateOne(
      {_id: user._id},
      {$set:{passwordHash: newPassswordHash}}
    )
    req.session.message={
      type: 'success',
      text: 'Password succesfully updated. You can now login.'
    }
    return res.redirect('/login')
  } catch (error) {
    console.error(error);
    res.status(500).send("Password reset failed");
  }
})

function home(req, res) {
  res.render('home')
}

async function connectMongo() {
  try {
    const client = new MongoClient(process.env.MONGO_URI)
    await client.connect()

    db = client.db(process.env.DB_NAME)

    console.log("Database is connected")
  } catch (error) {
    console.error("DB couldn't be connected", error.message)
    process.exit(1)
  }
}

function register(req, res) {
  res.render('register')
}

function login(req, res) {
  res.render('login', {
    message: null,
    oldEmail: '',
  })
}

function resetPassword(req,res){
  res.render('resetPassword',{
    message: null,
  })
}

// password hash
async function createPasswordHash(password) {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}
//age control
function calculateAge(userBirthDate) {
  const today = new Date()
  let age = today.getFullYear() - userBirthDate.getFullYear()

  const monthDifference = today.getDate() < userBirthDate.getDate()

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < userBirthDate.getDate())
  ) {
    age--
  }
  return age
}

//database
async function startServer() {
  await connectMongo()

  app.listen(port, () => {
    console.log('Server running')
  })
}

startServer()





