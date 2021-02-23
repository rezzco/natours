const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION DETECTED!, SHUTTING DOWN...');
  console.log(err);
  process.exit(1);
});

dotenv.config({
  path: './config.env',
});
const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    //console.log(con.connections);
    console.log('db connection successful');
  });

// console.log(process.env);
//START SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`listening on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION!, SHUTTING DOWN...');
  console.log(err);
  //close server before exiting the process which is called gracefull shutdown.
  //in a real app we have some tools that restarts the server when it crashes like this.
  //ANYWAY it is optional to close the server on unhandled rejection but for UNCAUGHT EXCEPTION we need
  // to shut down because the code is in un clean state.
  server.close(() => {
    process.exit(1);
  });
});
