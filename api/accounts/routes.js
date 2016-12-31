import { Router } from 'express';
import { User } from './models';

const router = new Router();

router.get('/users', (req, res) => {
  User.fetchAll().then((users) => {
    res.status(200).send(users);
  });
});

router.get('/addUser', (req, res) => {
  new User(req.body).save().then((saved) => {
    res.send(saved);
  });
});

module.exports = router;
