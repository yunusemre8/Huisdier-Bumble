const express = require('express')
const app = express()
const port = 3000

const multer = require('multer')
const upload = multer({ dest: 'static/upload/' })

const passwordHash = await

let db

app.listen(port, () => {
  console.log('Server running')
})

app.use(express.static('static'))
app.use(express.json())
app.set('view engine', 'ejs')

app.use(express.urlencoded({ extended: true }))

app.get('/register', register)

app.post("/register", upload.single("cover"), (req, res) => {
  const userBirthDate = new Date(req.body.userAge)
  const age = calculateAge(userBirthDate)

  const newUser={
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

  const userResult=await db.collection('users').insertOne(newUser)
  

  const existingUser = await db.collection('users').findOne({
    userEmail: req.body.userEmail
  })
  if(existingUser){
    return res.send ('Email already registered')
  }

  if (req.body.isPassword !== req.body.checkPassword) {
  return res.status(400).send("Passwords do not match");
  }

});


function register(req, res) {
  res.render("register");
}

async function createPasswordHash(password){
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}


//age-control

function calculateAge(userBirthDate) {
  const today = new Date()
  let age = today.getFullYear - userBirthDate.getMonth()

  const monthDifference = today.getDate() < userBirthDate.getDate()

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < userBirthDate.getDate())
  ) {
    age--
  }
  return age
}
if (age < 18) {
  return res.status(400).send('Pet Playdates is for users aged 18+ only.');
}

