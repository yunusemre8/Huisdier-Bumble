
const express = require("express");
const session = require("express-session");

const app = express();
const port = process.env.PORT || 3000;

const multer = require("multer");
const upload = multer({ dest: "static/upload/" });

const data = [];

data.push({
    id: "emma",
    userNickname: "Emma",
    petName: "Bobby",
    email: "emma@email.com",
    phone: "31612345678",
    cover: null,
  });

app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.static("static"));

app.post("/register", upload.single("cover"), (req, res) => {
    const id = req.body.userNickname.toLowerCase();

    data.push({
        id: id,
        userNickname: req.body.userNickname,
        petName: req.body.petName,
        email: req.body.email || "",
        phone: req.body.phone || "",
        cover: req.file ? req.file.filename : null,
    });

    console.log(data);
    res.redirect(`/profile/${id}`);
});

app.get("/", home);
app.get("/register", register);
app.get("/profile/:id", profile);
app.get("/contact/:id", contact);
app.get("/yourmatches", yourmatches);

function home(req, res) {
    res.send("Welcome to the club!");
}

function register(req, res) {
    res.render("register");
}

function contact(req, res) {
    const matchUser = data.find((u) => u.id === req.params.id);

    if (!matchUser) {
        return res.send("Match gebruiker niet gevonden");
    }

    res.render("contact", { matchUser });
}

function yourmatches(req, res) {
    res.render("yourmatches");
}

function profile(req, res) {
    const user = data.find((u) => u.id === req.params.id);

    if (!user) return res.redirect("/register");

    res.render("profile", { user });
}

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});