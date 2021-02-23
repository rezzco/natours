//core node modules
const path = require('path');

//3rd party moduls
const express = require('express');
const { json } = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

//My modules
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const viewRouter = require('./routes/viewRoutes');
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

//Global MIDLEWARES
// using helmet as a middleware to set http headers
app.use(helmet()); // we can also add some options

// development logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// setting the ratelimit access for each IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'to many requests from this IP. please try again in an houre'
});
app.use('/api', limiter);

// body parser
app.use(json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against noSQL query injection.
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xssClean());

// parameter polution prevention
app.use(
  hpp({
    whitelist: [
      'duration',
      'maxGroupSize',
      'price',
      'ratingsAverage',
      'ratingsQuantity',
      'difficulty'
    ]
  })
);

app.use(compression());
app.use((req, res, next) => {
  req.dateRequetsted = new Date().toISOString();
  res.setHeader('Content-Security-Policy', '');
  // console.log(req.cookies);
  next();
});
//ROUTES

//mounting routers: mounting a route to a router
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // const err = new Error(`can't find ${req.originalUrl} on this server`);
  // err.statusCode = 404;
  // err.status = 'fail';

  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
