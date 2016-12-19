import express from 'express';
import { User } from './accounts/user';
import * as environment from './env';

const app = express();
const port = process.env.PORT;

app.get('/', (req, res) => {
  res.status(200).send('Oh howdy howdy neighbor');
});

app.get('/getUsers', (req, res) => {
  User.fetchAll().then((users) => {
    res.status(200).send(users);
  });
});

app.get('/addUser', (req, res) => {
  new User({
    firstName: 'Mark',
    lastName: 'Hansen',
    emailAddress: 'x@markthemark.com',
  }).save().then((saved) => {
    res.send(saved);
  });
});

app.get('/health_check', (req, res) => {
  res.status(200).send("I'm not dead yet!");
});

app.listen(port);

console.log(`Server listening at port: ${port}`);
