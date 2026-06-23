const express = require('express')
const router = express.Router()

const { ObjectId } = require('mongodb')
const bcrypt = require('bcrypt')

const userValidate = require('../middleware/userValidate')



router.get('/resetPassword', (req, res) => {
  const message = req.session.message || null
  req.session.message = null

  res.render('resetPassword', {
    message: message
  })
})
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
        text: 'New password and confirm new password do not match.'
      }
      return res.redirect('/resetPassword')
    }

    const user = await req.db.collection("users").findOne({ userEmail: resetUserEmail })
    if (!user) {
      req.session.message = {
        type: 'error',
        text: 'User could not be found.'
      }
      return res.redirect('/resetPassword')
    }
    const animal = await req.db.collection('animals').findOne({ ownerId: user._id })
    if (!animal) {
      req.session.message = {
        type: 'error',
        text: 'No pet found for this account.'
      }
      return res.redirect('/resetPassword')
    }

    if (animal.petName.trim().toLowerCase() !== resetPetName.trim().toLowerCase()) {
      req.session.message = {
        type: 'error',
        text: 'Values about pet do not match.'
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
    await req.db.collection('users').updateOne(
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

router.get('/changePassword/:id', userValidate, async (req, res) => {
  const message = req.session.message || null
  req.session.message = null

  const userId = req.session.userId

  const user = await req.db.collection('users').findOne({
    _id: new ObjectId(userId)
  })

  const animal = await req.db.collection('animals').findOne({
    ownerId: user._id
  })

  res.render('changePassword', {
    user,
    animal,
    message
  })
})
router.post('/changePassword/:id', async (req, res) => {
  try {
    const userId = req.session.userId
    const user = await req.db.collection('users').findOne({ _id: new ObjectId(userId) })

    const { currentPassword, newPassword, confirmNewPassword } = req.body
    if (newPassword !== confirmNewPassword) {
      req.session.message = {
        type: 'error',
        text: 'Passwords do not match.'
      }
      return res.redirect('/changePassword/:id')
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash)

    if (!passwordMatch) {
      req.session.message = {
        type: 'error',
        text: 'Current password does not match.'
      }
      return res.redirect('/changePassword/:id')
    }

    if (currentPassword === newPassword) {
      req.session.message = {
        type: 'error',
        text: 'New password must be different from current password.'
      }
      return res.redirect('/changePassword/:id')
    }

    const newPassswordHash = await bcrypt.hash(newPassword, 10)

    await req.db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { passwordHash: newPassswordHash } }
    )
    req.session.message = {
      type: 'success',
      text: 'Password updated succesfully'
    }
    return res.redirect(`/profile/${userId}`)
  }
  catch (error) {
    res.status(500).send('Profile could not be loaded.')
  }
})


module.exports = router
