const express = require('express');
const passport = require('passport')
const UserModel = require('../../models/UserModel')
const middleware = require('../middleware')

const router = express.Router();

function redirectIfLoggedIn(req, res, next) {
  if (req.user) return res.redirect('/users/account')
  return next()
}

module.exports = (params) => {
  const { avatars } = params
  router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login?error=true'
  }))
  router.get('/login', redirectIfLoggedIn, (req, res) => res.render('users/login', { error: req.query.error }))
  router.get('/registration', redirectIfLoggedIn, (req, res) => res.render('users/registration', { success: req.query.success }));

  router.get('/logout', (req, res) => {
    req.logout()
    return res.redirect('/')
  })

  router.post('/registration',
    middleware.upload.single('avatar'),
    middleware.handleAvatar(avatars),
    async (req, res, next) => {
      try {
        const user = new UserModel({
          username: req.body.username,
          email: req.body.email,
          password: req.body.password
        })
        if (req.file && req.file.storeFileName) {
          user.avatar = req.file.storeFileName
        }
        const savedUser = await user.save()

        if (savedUser) return res.redirect('/users/registration?success=true')
        return next(new Error('Failed to save user for unknown reasons'))
      } catch (error) {
        if (req.file && req.file.storeFileName) {
          await avatars.delete(req.file.storeFileName)
        }
        return next(error)
      }
    })

  router.get('/account', (req, res, next) => {
    console.log(req.user);
    if (req.user) return next()
    return res.status(401).end()
  }, (req, res) => res.render('users/account', { user: req.user }));

  router.get('/avatar/:filename', (req, res) => {
    res.type('png')
    return res.sendFile(avatars.filepath(req.params.filename))
  })

  router.get('/avatartn/:filename', async (req, res) => {
    res.type('png')
    const tn = await avatars.thumbnail(req.params.filename)
    return res.end(tn, 'binary')
  })

  return router;
};
