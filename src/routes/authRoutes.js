const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/authValidator');
const { validate } = require('../middleware/validation');

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfileValidator, validate, updateProfile);
router.post('/address', protect, addAddress);
router.put('/address/:addressId', protect, updateAddress);
router.delete('/address/:addressId', protect, deleteAddress);
router.post('/forgotpassword', forgotPasswordValidator, validate, forgotPassword);
router.put('/resetpassword/:resettoken', resetPasswordValidator, validate, resetPassword);

module.exports = router;
