const express = require('express')
const router = express.Router()
const multer = require('multer')
const upload = multer({ dest: 'static/upload/' })
const bcrypt = require('bcrypt')


router.get('/register', register)
router.post("/register", upload.single("cover"), async (req, res) => {

  const existingUser = await req.db.collection('users').findOne({
    userEmail: req.body.userEmail
  })
  if (existingUser) {
    req.session.message = {
      type: 'error',
      text: 'Email already registered. Please log in.'
    }
    return res.redirect('/login')
  }

  if (req.body.isPassword !== req.body.checkPassword) {
    return res.status(400).send("Passwords do not match");
  }

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

  const userResult = await req.db.collection('users').insertOne(newUser)
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
  await req.db.collection('animals').insertOne(newAnimal)

  res.redirect('/login')
});



router.get('/login', login)
router.post('/login', async (req, res) => {

  try {
    const { userEmail, isPassword } = req.body;
    const user = await req.db.collection("users").findOne({ userEmail });
    if (!user) {
      return res.render('login', {
        message: {
          type: 'error',
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
    return res.redirect(`/profile/${user._id}`);
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
    res.redirect("/login");
  });
});


function register(req, res) {
  res.render('register')
}

function login(req, res) {
  const message = req.session.message || null
  req.session.message = null

  res.render('login', {
    message: message,
    oldEmail: ''
  })
}

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

async function createPasswordHash(password) {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

module.exports = router