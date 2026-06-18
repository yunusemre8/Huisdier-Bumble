const express = require('express')
const router = express.Router()
const multer = require('multer')
const upload = multer({ dest: 'static/upload/' })
const bcrypt = require('bcrypt')

const {getDb} = require('../database')

router.get('/register', register)
router.post("/register", upload.single("cover"), async (req, res) => {
  const db = getDb()
  const existingUser = await db.collection('users').findOne({
    userEmail: req.body.userEmail
  })
  if (existingUser) {
    req.session.message={
      type:'error',
      text: 'Email already registered. Please log in.'
    }

    return res.redirect('/login')
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

  res.redirect('/login')
});



router.get('/login', login)
router.post("/login", async (req, res) => {
  const db = getDb()
  try {
    const { userEmail, isPassword } = req.body;
    const user = await db.collection("users").findOne({ userEmail });

    if (!user) {
      return res.render('login', {
        message: {
          type: error,
          text: 'User could not be found'
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

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("An error occurred while logging out.");
    }
    res.redirect("/login?logout=true");
  });
});

function register(req, res) {
  res.render('register')
}

function login(req, res) {
  res.render('login', {
    oldEmail: '',
  })
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


// password hash
async function createPasswordHash(password) {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

module.exports = router