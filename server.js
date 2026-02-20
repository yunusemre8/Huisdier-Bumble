
const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs')
app.set('views', 'views')

app.get('/',home)
app.get('/register', register)


function home(req, res){
    res.send('Welcome to the club!')
}
function register(req, res){
    res.render('register')
}
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

