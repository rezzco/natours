const AppError = require('../utils/appError');

const handleDbCastError = (err) => {
  const message = `Invalid ${err.path} : ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const key = Object.keys(err.keyValue)[0];
  const value = Object.values(err.keyValue)[0];

  const message = `Duplicate value ${key}: ${value}.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('; ')}`;
  return new AppError(message, 400);
};

// jwt errors
const JwtInvalidTokenHandler = () => {
  const message = 'Invalid signature: you are not authorized for this access';
  const statusCode = 401;
  return new AppError(message, statusCode);
};

const JwtExpiredHandler = () => {
  const message = 'You have been absent for so long! neet to login again';
  const statusCode = 401;
  return new AppError(message, statusCode);
};

const sendErrorDev = (res, req, err) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      stack: err.stack,
      message: err.message,
      keyValue: err.keyValue
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'something went wrong!',
      message: err.message
    });
    console.error('error...', err);
  }
};

const sendErrorProd = (res, req, err) => {
  //operational errors handled and raised by our code
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    //other errors that we are not willing to leak the info to client

    console.error('error...', err);
    //send generic message to client
    return res.status(500).json({
      status: 'error',
      message: 'Something went really wrong!'
    });
  }
  // eslint-disable-next-line no-lonely-if
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'something went wrong!',
      message: err.message
    });
  }
  //other errors that we are not willing to leak the info to client
  //log error
  console.error('error...', err);
  //send generic message to client
  return res.status(500).render('error', {
    title: 'something went wrong!',
    message: 'Please try again later.'
  });
};
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(res, req, err);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'CastError') {
      error = handleDbCastError(error);
    }
    if (err.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (err.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    if (err.name === 'JsonWebTokenError') {
      error = JwtInvalidTokenHandler();
    }
    if (err.name === 'TokenExpiredError') {
      error = JwtExpiredHandler();
    }
    sendErrorProd(res, req, error);
  }
};
