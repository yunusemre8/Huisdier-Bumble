
const express = require("express");
const session = require('express-session')

const app = express();
const port = process.env.PORT || 3000;

const multer = require('multer');
const upload = multer({dest: 'static/upload/'})

const data = []

// express().post('/add-movie', upload.single('cover'), add)

function add(req, res){
    console.log(req.file.filename)
}

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs')
app.set('views', 'views')

app.use(express.static("static")); //upgeloadde afbeeldingen

app.post('/register', upload.single('cover'), (req,res) => {
    const id = req.body.userNickname.toLowerCase();

    data.push({
        id: id, 
        userNickname: req.body.userNickname,
        petName: req.body.petName,
        cover: req.file ? req.file.filename : null,
    })

    console.log(data);
    res.redirect(`/profile/${id}`);
})



app.get('/',home)
app.get('/register', register)
app.get('/profile/:id', profile)

 
function home(req, res){
    res.send('Welcome to the club!')
}
function register(req, res){
    res.render('register')
}
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

function profile(req, res){
    const user = data.find(u => u.id === req.params.id)

    if(!user) return res.redirect('/register')

    res.render('profile', { user })
}

// app.use(session({
//     resave = false,
//     saveUninitialized: true,
//     secret = process.env.SESSION_SECRET
// }))