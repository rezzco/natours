const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const AppError = require('../utils/appError');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res, maskUser = false) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  const jsonRes = {
    status: 'success',
    token
  };
  if (!maskUser) jsonRes.data = { user };
  // if (maskUser) user = null;
  res.status(statusCode).json(jsonRes);
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res, false);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1- check if both email and password are provided for login
  if (!email || !password) {
    return next(new AppError('Need Email and password for login!'), 400);
  }

  // 2- check if email exists and password matches
  const user = await User.findOne({
    email
  }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect email or password', 401));
  }
  // 3. generate token and send it to user
  createSendToken(user, 200, res, true);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({
    status: 'success'
  });
};
exports.protect = catchAsync(async (req, res, next) => {
  let token = '';
  // 1- check if the token exists
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('you need to be loggedin to access this resourse', 401)
    );
  }

  // 2- Verify the toekn

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3- check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(
        'The account you are using to access does not exist anymore!',
        401
      )
    );

  // 4- check if the user changed password AFTER token was issued
  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError(
        'your login credential has changed. please login again before nex try!',
        401
      )
    );
  }

  //grant access to protected data
  req.user = currentUser;
  //There is a loggein user.
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages and there will be no error
exports.isLoggedIn = async (req, res, next) => {
  const token = req.cookies.jwt;
  try {
    if (token) {
      // 2- Verify the toekn
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );

      // 3- check if the user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();

      // 4- check if the user changed password AFTER token was issued
      if (currentUser.passwordChangedAfter(decoded.iat)) {
        return next();
      }

      //There is a loggein user.
      res.locals.user = currentUser;
    }
  } catch (error) {
    return next();
  }

  res.setHeader('Content-Security-Policy', '');
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `your accessibilit role is ${
            req.user.role
          } you need to be in ${roles.join(
            ', '
          )} roles to be able to perform this action.`,
          403
        )
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('please enter your email', 400));
  }
  const user = await User.findOne({ email });
  if (!user) {
    return next(
      new AppError('there is no user with the email you provided', 404)
    );
  }
  const resetToken = user.resetPasswordToken();
  await user.save({
    validateBeforeSave: false
  });
  try {
    //send it to the user
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'please check your email for reset password instructions '
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.save({ validateBeforeSave: false });

    next(
      new AppError(
        'There was an error sending the email! please try again later',
        500
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. get the user based on token in url
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  // 2. if user exists and not expired
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3. change the passwordchangedAt property

  // 4. log the user in
  createSendToken(user, 200, res, true);
});

module.exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. find out which user it is

  const user = await User.findById(req.user.id).select('+password');

  // 2. check if the password is correct.
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(
      new AppError(
        'current password is not entered correctly. please check the password and try again.',
        400
      )
    );
  }

  // 3. update the password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();

  // 4. log the user again with the new password.
  createSendToken(user, 200, res);
});
