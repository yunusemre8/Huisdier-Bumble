const express = require('express')
const router = express.Router()

const userValidate = require('../middleware/userValidate')
const messageMiddleware = require('../middleware/message')

router.get('/resetPassword', resetPassword)
router.post('/resetPassword', async (req, res) => {
  try {
    const { resetUserEmail, resetPetName, resetPetWeight, resetNewPassword, confirmResetNewPassword } = req.body

    if (!resetUserEmail ||
      !resetPetName ||
      !resetPetWeight ||
      !resetNewPassword ||
      !confirmResetNewPassword) {
      req.session.message = {
        type: 'error',
        text: 'Please fill in all fields.'
      };
      return res.redirect('/resetPassword')
    }

    if (resetNewPassword !== confirmResetNewPassword) {
      req.session.message = {
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
      { _id: user._id },
      { $set: { passwordHash: newPassswordHash } }
    )
    req.session.message = {
      type: 'success',
      text: 'Password succesfully updated. You can now login.'
    }
    return res.redirect('/login')
  } catch (error) {
    console.error(error);
    res.status(500).send("Password reset failed");
  }
})

router.get('/changePassword', userValidate, changePassword)
router.post('/changePassword', async (req, res) => {
  try {
    const userId = req.session.userId
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) })

    const { currentPassword, newPassword, confirmNewPassword } = req.body
    if (newPassword !== confirmNewPassword) {
      req.session.message = {
        type: 'error',
        text: 'Passwords do not match.'
      }
      return res.redirect('/changePassword')
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash)

    if(!passwordMatch){
      req.session.message={
        type: 'error',
        text: 'Current password does not match.'
      } 
      return res.redirect('/changePassword')
    }

    if(currentPassword === newPassword){
      req.session.message={
        type:'error',
        text: 'New password must be different from current password.'
      } 
      return res.redirect('/changePassword')
    }
    
    const newPassswordHash = await bcrypt.hash(newPassword, 10)

    await db.collection('users').updateOne(
      {_id: new ObjectId(userId)},
      {$set: {passwordHash: newPassswordHash}}
    )
    req.session.message={
      type: 'success',
      text:'Password updated succesfully'
    }
    return res.redirect('/edit-profile')
  }
catch(error){
  res.status(500).send('Profile could not be loaded.')
}
})


function resetPassword(req, res) {
  res.render('resetPassword')
}

async function changePassword(req, res) {
  const userId = req.session.userId
  const user = await db.collection('users').findOne({
    _id: new ObjectId(userId)
  })

  const animal = await db.collection('animals').findOne({
    ownerId: user._id
  })
  res.render('changePassword', {user:user,
    animal: animal})
}

// password hash
async function createPasswordHash(password) {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}



module.exports = router