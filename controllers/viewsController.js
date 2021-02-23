const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');

const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  // get all the tours
  const tours = await Tour.find();
  // create templates
  // inject the templates
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTourDetail = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'rating user review'
  });
  if (!tour) return next(new AppError('there is no tour with that name', 404));
  res.setHeader('Content-Security-Policy', '');
  res.status(200).render('tour', {
    title: 'Tour Detail',
    tour
  });
});

exports.getLoginForm = (req, res) => {
  res.setHeader('Content-Security-Policy', '');
  res.status(200).render('login', {
    title: 'Log in'
  });
};

exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'signup'
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'my account'
  });
};

exports.getMyTours = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id });
  const tourIds = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });
  console.log(tours);
  res.status(200).render('overview', {
    title: 'my tours',
    tours
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updates = { name: req.body.name, email: req.body.email };
  const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true
  });
  res.status(200).render('account', {
    title: 'my account',
    user: updatedUser
  });
});
