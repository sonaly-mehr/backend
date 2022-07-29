const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const User = require('../models/userModel');
const sendToken = require("../utils/jwtToken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
// const cloudinary = require("cloudinary");

//Register a user
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  // const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
  //   folder: "avatars",
  //   width: 150,
  //   crop: "scale",
  // });
  User.findOne({ email: req.body.email })
    .exec(async (error, user) => {
        if(user) return res.status(400).json({
            message: 'User already exist!'
        });
        const { name, email, password } = req.body;
        
        const _user = await User.create({
          name,
          email,
          password,
          // avatar: {
          //   public_id: myCloud.public_id,
          //   url: myCloud.secure_url,
          // },
        });
      
      sendToken(_user, 201, res);
    })

})

//Login user
exports.loginUser = catchAsyncErrors(async (req, res, next)=> {
    const {email, password} = req.body;

    //If no email or password has been entered
    if(!email || !password){
        return next (res.status(404).json({
          message: 'Please enter email & password'
      }));
    }

    const user= await User.findOne({ email }).select("+password");
    
    //If user doesn't exist
    if(!user){
      return next (res.status(401).json({
        message: 'Invalid email or password'
    }));
    }

    const isPasswordMatched = await user.comparePassword(password);
    isPasswordMatched ? sendToken(user, 200, res) : res.status(401).json({ message: 'Invalid email or password' })

  // if (!isPasswordMatched) {
  //   return next(res.status(401).json({
  //     message: 'Invalid email or password'
  // }));
  // }

    //Create JWT Token
    // sendToken(user, 200, res);
})


//Logout user
exports.logoutuser = catchAsyncErrors(async(req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: "Logged out!"
    })
})


// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// Get User Detail
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });

  //Create JWT Token
  sendToken(user, 200, res);
  console.log(`user token, ${req.cookies.token}`)
});


// update User password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return res.status(400).json({message: "Old password is incorrect"});
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return res.status(400).json({message: "password does not match"});
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
});


//Update user profile
exports.updateProfile = catchAsyncErrors(async(req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email
  };

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success:true,
    user
  })
})


// Get all users(admin)
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});


// Get single user (admin)
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with Id: ${req.params.id}`)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});


// update User Role -- Admin
exports.updateUserRole = catchAsyncErrors(async(req, res, next)=> {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role
  };

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user
  });
})



// Delete User --Admin
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(400).json({message: `User does not exist with Id: ${req.params.id}`});
  }

  // const imageId = user.avatar.public_id;

  // await cloudinary.v2.uploader.destroy(imageId);

  await user.remove();

  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});
