const express = require('express');
const { forgotPassword } = require('../controllers/userController');
const { getUserDetails } = require('../controllers/userController');
const { updateProfile } = require('../controllers/userController');
const { getSingleUser } = require('../controllers/userController');
const { deleteUser } = require('../controllers/userController');
const { updateUserRole } = require('../controllers/userController');
const { getAllUser } = require('../controllers/userController');
const { updatePassword } = require('../controllers/userController');
const { logoutuser } = require('../controllers/userController');
const { loginUser } = require('../controllers/userController');
const { registerUser } = require('../controllers/userController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

router.route("/user/register").post(registerUser);
router.route("/user/login").post(loginUser);
router.route("/user/logout").get(logoutuser);
router.route("/password/forgot").post(forgotPassword);
router.route("/user/profile").get(isAuthenticatedUser, getUserDetails);
router.route("/password/update").put(isAuthenticatedUser, updatePassword);
router.route("/profile/update").put(isAuthenticatedUser, updateProfile);
router.route("/admin/users").get(isAuthenticatedUser, authorizeRoles("admin"), getAllUser);
router.route("/admin/user/:id")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleUser)
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);


  module.exports= router;