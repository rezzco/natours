const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: [true, 'The tour name needs to be unique'],
      trim: true,
      maxlength: [40, 'A tour name cannot be more than 40 char'],
      minlength: [10, 'A tour name cannot be less than 10 char']
    },
    slug: {
      type: String
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty assigned to it'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'must choose from the options: easy, medium of difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.0,
      min: [1, 'you can not rate a tour less than 1'],
      max: [5, 'you can not rate a tour more than 5'],
      set: (val) => Math.round(val * 10) / 10
    },
    ratingQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, ' You must specify the price for the tour']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (discount) {
          // this only points to current document on NEW documnet creation so not on updated doc.
          return discount < this.price;
        },
        message: 'discount cannot be bigger than the actual price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'a tour must have a description']
    },
    secret: {
      type: Boolean,
      default: false
    },

    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'a tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now()
    },
    startDates: [Date],
    startLocation: {
      // GEOJSON formant
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },

  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationInWeek').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

//DOCUMENT MIDDLEWARE :  IT WORKS ON .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('this document is being saved...');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE: E.G. FIND
//or const findEvents = ['find', 'findOne'];

tourSchema.pre(/^find/, function (next) {
  this.find({ secret: { $ne: true } });
  this.startTime = new Date();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`${new Date() - this.startTime}ms`);
//   next();
// });

// AGGREGATE MIDDLEWARE:
tourSchema.pre('aggregate', function (next) {
  if (!Object.keys(this.pipeline()[0])[0] === '$geoNear')
    this.pipeline().unshift({
      $match: {
        secret: { $ne: true }
      }
    });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
