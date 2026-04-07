const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const multer = require("multer");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");

const userValidate = require("./middleware/userValidate");
const messageMiddleware = require("./middleware/message");

dotenv.config();

const app = express();
const router = express.Router();
const port = process.env.PORT || 3000;
const upload = multer({ dest: "static/upload/" });

const dogBreeds = [
  "Labrador",
  "Golden Retriever",
  "Poodle",
  "Border Collie",
  "Beagle",
  "French Bulldog",
];

const catBreeds = [
  "Persian",
  "Maine Coon",
  "Siamese",
  "Ragdoll",
  "Bengal",
  "Scottish Fold",
];

let db;

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(messageMiddleware);
app.use(express.static("static"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", "views");

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

async function createPasswordHash(password) {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.log("Error hashing password", error);
  }
}

function calculateAge(userBirthDate) {
  const today = new Date();
  let age = today.getFullYear() - userBirthDate.getFullYear();
  const calculateMonth = today.getMonth() - userBirthDate.getMonth();

  if (
    calculateMonth < 0 ||
    (calculateMonth === 0 && today.getDate() < userBirthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function home(req, res) {
  if (req.session.userId) {
    return res.redirect(`/matchesPage/${req.session.userId}`);
  }
  res.render("home");
}

function register(req, res) {
  res.render("register");
}

function login(req, res) {
  res.render("login", {
    error: null,
    oldEmail: "",
  });
}

function resetPassword(req, res) {
  res.render("resetPassword");
}

function contact(req, res) {
  res.render("contact");
}

function filterPage(req, res) {
  res.render("filter", {
    isPageTitle: "Huisdier Bumble",
    dogBreeds,
    catBreeds,
  });
}

async function changePassword(req, res) {
  try {
    const user = await db.collection("users").findOne({
      _id: new ObjectId(req.session.userId),
    });

    if (!user) {
      return res.redirect("/login");
    }

    const animal = await db.collection("animals").findOne({
      ownerId: user._id,
    });

    res.render("changePassword", { user, animal });
  } catch (error) {
    console.error(error);
    res.status(500).send("Password change could not be loaded");
  }
}

async function profile(req, res) {
  try {
    const user = await db.collection("users").findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!user) {
      return res.redirect("/register");
    }

    const animal = await db.collection("animals").findOne({
      ownerId: user._id,
    });

    res.render("profile", { user, animal });
  } catch (error) {
    console.error(error);
    res.status(500).send("Profile couldn't be loaded");
  }
}

async function matchesPage(req, res) {
  try {
    const currentUserId = new ObjectId(req.params.id);
    const currentUser = await db.collection("users").findOne({ _id: currentUserId });

    if (!currentUser) {
      return res.redirect("/register");
    }

    const mySwipes = await db
      .collection("swipes")
      .find({ fromUserId: currentUserId })
      .toArray();

    const swipedUserIds = mySwipes
      .map((swipe) => {
        if (!swipe.toUserId) return null;
        if (swipe.toUserId instanceof ObjectId) return swipe.toUserId;

        try {
          return new ObjectId(swipe.toUserId);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    swipedUserIds.push(currentUserId);

    const animals = await db
      .collection("animals")
      .find({
        ownerId: { $nin: swipedUserIds },
      })
      .toArray();

    res.render("matchesPage", {
      user: currentUser,
      animals,
      dogBreeds,
      catBreeds,
    });
  } catch (error) {
    console.error("matchesPage error:", error);
    res.status(500).send("Matches page couldn't be loaded");
  }
}

async function editProfilePage(req, res) {
  try {
    const user = await db.collection("users").findOne({
      _id: new ObjectId(req.params.id),
    });

    const animal = await db.collection("animals").findOne({
      ownerId: user._id,
    });

    res.render("edit-profile", { user, animal });
  } catch (error) {
    console.error(error);
    res.status(500).send("Edit profile page could not be loaded");
  }
}

async function editProfilePost(req, res) {
  try {
    const userId = new ObjectId(req.params.id);

    await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: {
          userName: req.body.userName,
          userCity: req.body.userCity,
          userPhone: req.body.userPhone || null,
          isFrequency: req.body.isFrequency,
          preferPlace: req.body.preferPlace,
        },
      }
    );

    await db.collection("animals").updateOne(
      { ownerId: userId },
      {
        $set: {
          petName: req.body.petName,
          petType: req.body.petType,
          petBreed: req.body.isBreed,
          petWeight: Number(req.body.isKilo),
          ...(req.file && { cover: req.file.filename }),
        },
      }
    );

    res.redirect(`/profile/${req.params.id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Profile could not be updated");
  }
}

function addPetPage(req, res) {
  res.render("add-pet", { userId: req.params.id });
}

async function addPetPost(req, res) {
  try {
    const userId = new ObjectId(req.params.id);

    const newAnimal = {
      ownerId: userId,
      petName: req.body.petName,
      petType: req.body.petType,
      petBreed: req.body.isBreed,
      petWeight: Number(req.body.isKilo),
      cover: req.file ? req.file.filename : null,
      createdAt: new Date(),
    };

    await db.collection("animals").insertOne(newAnimal);
    res.redirect(`/profile/${req.params.id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Pet could not be added");
  }
}

async function showYourMatches(req, res) {
  try {
    const currentUserId = req.session.userId;
    let matches = await db.collection("users").find().toArray();

    if (currentUserId && ObjectId.isValid(currentUserId)) {
      matches = matches.filter(
        (u) => u._id.toString() !== currentUserId.toString()
      );
    }

    const user =
      currentUserId && ObjectId.isValid(currentUserId)
        ? await db.collection("users").findOne({
            _id: new ObjectId(currentUserId),
          })
        : null;

    res.render("yourmatches", { matches, user });
  } catch (error) {
    console.error("Fout in yourmatches route:", error.message);
    res.status(500).send("Er ging iets mis bij het ophalen van de matches.");
  }
}

async function showContact(req, res) {
  try {
    const ownerId = req.params.ownerId;

    if (!ObjectId.isValid(ownerId)) {
      return res.status(400).send("Ongeldige gebruiker-id.");
    }

    const matchUser = await db.collection("users").findOne({
      _id: new ObjectId(ownerId),
    });

    if (!matchUser) {
      return res.status(404).send("Match gebruiker niet gevonden");
    }

    let user = null;

    if (req.session.userId && ObjectId.isValid(req.session.userId)) {
      user = await db.collection("users").findOne({
        _id: new ObjectId(req.session.userId),
      });
    }

    if (!user) {
      user = matchUser;
    }

    res.render("contact", { matchUser, user });
  } catch (error) {
    console.error("Fout in contact route:", error.message);
    res.status(500).send("Er ging iets mis.");
  }
}

async function deleteAccount(req, res) {
  try {
    const userId = new ObjectId(req.params.id);

    await db.collection("animals").deleteMany({ ownerId: userId });
    await db.collection("users").deleteOne({ _id: userId });

    req.session.destroy(() => {
      res.redirect("/register");
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Account could not be deleted");
  }
}
router.get("/login", login);
router.get("/register", register);
router.get("/resetPassword", resetPassword);
router.get("/contact", contact);
router.get("/filter", userValidate, filterPage);
router.get("/profile/:id", userValidate, profile);
router.get("/matchesPage/:id", userValidate, matchesPage);
router.get("/changePassword/:id", userValidate, changePassword);
router.get("/edit-profile/:id", userValidate, editProfilePage);
router.get("/add-pet/:id", userValidate, addPetPage);
router.get("/yourmatches", userValidate, showYourMatches);
router.get("/contact/:ownerId", userValidate, showContact);
router.get("/", home);


app.use("/", router);

app.post("/register", upload.single("cover"), async (req, res) => {
  try {
    const existingUser = await db.collection("users").findOne({
      userEmail: req.body.userEmail,
    });

    if (existingUser) {
      return res.send("Email already registered");
    }

    if (req.body.isPassword !== req.body.checkPassword) {
      return res.status(400).send("Passwords do not match");
    }

    const userBirthDate = new Date(req.body.userAge);
    const age = calculateAge(userBirthDate);

    if (age < 18) {
      return res.status(400).send("Pet Playdates is for users aged 18+ only.");
    }

    const passwordHash = await createPasswordHash(req.body.isPassword);

    const newUser = {
      userEmail: req.body.userEmail,
      passwordHash,
      userName: req.body.userName,
      userBirthDate,
      userAge: age,
      userCity: req.body.userCity,
      userPhone: req.body.userPhone || null,
      isFrequency: req.body.isFrequency,
      preferPlace: req.body.preferPlace,
      createdAt: new Date(),
      location: null,
    };

    const userResult = await db.collection("users").insertOne(newUser);
    const userId = userResult.insertedId;

    const newAnimal = {
      ownerId: userId,
      petName: req.body.petName,
      petType: req.body.petType,
      petBreed: req.body.isBreed,
      petWeight: Number(req.body.isKilo),
      cover: req.file ? req.file.filename : null,
      createdAt: new Date(),
    };

    await db.collection("animals").insertOne(newAnimal);

    req.session.userId = userId.toString();
    req.session.save(() => {
      res.redirect(`/profile/${userId}`);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred during registration");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { userEmail, isPassword } = req.body;
    const user = await db.collection("users").findOne({ userEmail });

    if (!user) {
      return res.render("login", {
        error: "Email or password is incorrect",
        oldEmail: userEmail,
      });
    }

    const isMatch = await bcrypt.compare(isPassword, user.passwordHash);

    if (!isMatch) {
      return res.render("login", {
        error: "Email or password is incorrect",
        oldEmail: userEmail,
      });
    }

    req.session.userId = user._id.toString();
    return res.redirect(`/matchesPage/${user._id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Login error");
  }
});

app.post("/changePassword", async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.redirect("/login");
    }

    const user = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      return res.redirect("/login");
    }

    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (newPassword !== confirmNewPassword) {
      req.session.message = {
        type: "error",
        text: "New passwords do not match.",
      };
      return res.redirect("/changePassword");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isMatch) {
      req.session.message = {
        type: "error",
        text: "Current password is wrong",
      };
      return res.redirect("/changePassword");
    }

    if (currentPassword === newPassword) {
      req.session.message = {
        type: "error",
        text: "New password must be different from current password.",
      };
      return res.redirect("/changePassword");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { passwordHash: newPasswordHash } }
    );

    req.session.message = {
      type: "success",
      text: "Password updated successfully!",
    };

    return res.redirect("/changePassword");
  } catch (error) {
    console.error(error);
    res.status(500).send("password could not updated");
  }
});

app.post("/resetPassword", async (req, res) => {
  try {
    const {
      resetUserEmail,
      resetPetName,
      resetPetWeight,
      resetNewPassword,
      confirmResetNewPassword,
    } = req.body;

    if (
      !resetUserEmail ||
      !resetPetName ||
      !resetPetWeight ||
      !resetNewPassword ||
      !confirmResetNewPassword
    ) {
      req.session.message = {
        type: "error",
        text: "Please fill in all fields",
      };
      return res.redirect("/resetPassword");
    }

    if (resetNewPassword !== confirmResetNewPassword) {
      req.session.message = {
        type: "error",
        text: "Passwords do not match",
      };
      return res.redirect("/resetPassword");
    }

    const user = await db.collection("users").findOne({
      userEmail: resetUserEmail,
    });

    if (!user) {
      req.session.message = {
        type: "error",
        text: "No user found",
      };
      return res.redirect("/resetPassword");
    }

    const animal = await db.collection("animals").findOne({
      ownerId: user._id,
    });

    if (!animal) {
      req.session.message = {
        type: "error",
        text: "No pet found for this account.",
      };
      return res.redirect("/resetPassword");
    }

    if (animal.petName.trim().toLowerCase() !== resetPetName.trim().toLowerCase()) {
      req.session.message = {
        type: "error",
        text: "Pet name is incorrect.",
      };
      return res.redirect("/resetPassword");
    }

    if (Number(animal.petWeight) !== Number(resetPetWeight)) {
      req.session.message = {
        type: "error",
        text: "Pet weight is incorrect.",
      };
      return res.redirect("/resetPassword");
    }

    const newPasswordHash = await bcrypt.hash(resetNewPassword, 10);

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { passwordHash: newPasswordHash } }
    );

    req.session.message = {
      type: "success",
      text: "Password successfully updated. You can now log in.",
    };

    return res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.status(500).send("Password reset failed");
  }
});

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

app.post("/swipe", async (req, res) => {
  try {
    const { fromUserId, toUserId, action } = req.body;

    if (!fromUserId || !toUserId || !action) {
      return res.status(400).json({
        success: false,
        message: "fromUserId, toUserId en action zijn verplicht",
      });
    }

    if (!["like", "dislike"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Ongeldige action",
      });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({
        success: false,
        message: "Je kunt niet op jezelf swipen",
      });
    }

    const fromObjectId = new ObjectId(fromUserId);
    const toObjectId = new ObjectId(toUserId);

    await db.collection("swipes").updateOne(
      { fromUserId: fromObjectId, toUserId: toObjectId },
      {
        $set: {
          fromUserId: fromObjectId,
          toUserId: toObjectId,
          action,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    let isMatch = false;

    if (action === "like") {
      const reverseLike = await db.collection("swipes").findOne({
        fromUserId: toObjectId,
        toUserId: fromObjectId,
        action: "like",
      });

      if (reverseLike) {
        isMatch = true;

        const existingMatch = await db.collection("matches").findOne({
          users: { $all: [fromObjectId, toObjectId] },
        });

        if (!existingMatch) {
          await db.collection("matches").insertOne({
            users: [fromObjectId, toObjectId],
            createdAt: new Date(),
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

app.get("/api/pets", async (req, res) => {
  try {
    const { petType, breeds, size, frequency, place, city } = req.query;

    const matchAnimal = {};
    const matchOwner = {};

    if (petType) matchAnimal.petType = petType;
    if (breeds) matchAnimal.petBreed = { $in: breeds.split(",") };

    if (size) {
      const ranges = {
        small: [0, 10],
        medium: [10, 25],
        large: [25, 999],
      };

      const [min, max] = ranges[size];
      matchAnimal.petWeight = { $gte: min, $lt: max };
    }

    if (frequency) matchOwner["owner.isFrequency"] = frequency;
    if (place) matchOwner["owner.preferPlace"] = place;
    if (city) matchOwner["owner.userCity"] = { $regex: city, $options: "i" };

    const pets = await db
      .collection("animals")
      .aggregate([
        { $match: matchAnimal },
        {
          $lookup: {
            from: "users",
            localField: "ownerId",
            foreignField: "_id",
            as: "owner",
          },
        },
        { $unwind: "$owner" },
        { $match: matchOwner },
      ])
      .toArray();

    res.json(pets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});


router.post("/edit-profile/:id", upload.single("cover"), editProfilePost);
router.post("/add-pet/:id", upload.single("cover"), addPetPost);
router.post("/delete-account/:id", deleteAccount);

async function startServer() {
  await connectMongo();

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();