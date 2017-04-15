import { Router } from 'express';
import { requireSignIn } from '../services/passport';
import { tokenForUser } from './helpers';
import SlackService from '../services/slack';
import { logger } from '../logger';
import { createRepresentative } from '../accounts/helpers';

const router = new Router();

router.post('/signin', requireSignIn, (req, res) => {
  res.send({
    representative: req.user,
    token: tokenForUser(req.user),
  });
});

router.post('/signup', (req, res, next) => {
  logger.info('Representative Sign Up');
  const rep = req.body.representative;
  const org = req.body.organization;
  createRepresentative(rep, org, { returnJSON: true }).then((newRep) => {
    new SlackService({ username: 'Welcome', icon: 'capitol' })
      .send(`Representative joined: *${newRep.email}*`);
    res.status(200).json({
      representative: newRep,
      token: tokenForUser(newRep),
    });
  }).catch(error => next(error));
});

module.exports = router;
