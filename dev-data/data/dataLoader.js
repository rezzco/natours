const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');

const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({
  path: '../../config.env'
});

const cn = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
const tourfile = JSON.parse(
  fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
);
const userfile = JSON.parse(
  fs.readFileSync(`${__dirname}/users.json`, 'utf-8')
);
const reviewfile = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

mongoose
  .connect(cn, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log('connection to db stablished...');
  })
  .catch((err) => {
    console.log(err);
  });
// import all data to db
const importData = async () => {
  try {
    await Tour.create(tourfile);
    await User.create(userfile, { validateBeforeSave: false });
    await Review.create(reviewfile);
    console.log('data successully loaded');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

// Delete all the data form db
const deleteAllData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('data successully deleted');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv.includes('--i') || process.argv.includes('--I')) {
  importData();
}
if (process.argv.includes('--d') || process.argv.includes('--D')) {
  deleteAllData();
}
