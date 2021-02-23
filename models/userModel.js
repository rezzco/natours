const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// here I am going to use a package to do the validation for my app
// const emailValidator = (email) => {
//   const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
//   return emailRegex.test(email);
// };

// const passwordValidator = (pass) => {
//   const passRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
//   return passRegex.test(pass);
// };

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please enter your name'],
    minlength: [3, 'name must be atleat 3 character long'],
    maxlength: [30, 'name can not be more than 30 character long']
  },
  email: {
    type: String,
    required: [true, 'please enter your email'],
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please fill in a valid email address'
    }
  },
  //photo is saved somewhere in our file system then the path for that file is store here.
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'please provide a password.'],
    // validate: [
    //   validator.isStrongPassword,
    //   'password must contain atleat 1 uppercase, 1 lowercase and 1 special character',
    // ],
    minlength: [8, 'password must be atleat 8 character long.'],
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'please type your password again'],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'password does not match.'
    }
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    //hash the password with the cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    //Delete the confirmed password to stop it from persisting in db
    this.passwordConfirm = undefined;
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000;
  // some times it takes time for the data to be saved in db and so the token creation time goes
  // before passwordchanged time stamp which stops users from loging in.
  next();
});
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangedAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    //changed the stored date time to seconds
    const passwordChangedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return passwordChangedTimestamp > JWTTimestamp;
  }
  return false;
};

userSchema.methods.resetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
