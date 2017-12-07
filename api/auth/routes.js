import { Router } from 'express';
import { requireSignIn, requireAuth } from '../utils/passport';
import { tokenForUser } from './helpers';
import SlackService from '../utils/slack';
import { logger } from '../logger';
import { createRepresentative } from '../accounts/helpers';

const router = new Router();

router.get('/', requireAuth, (req, res, next) => {
  try {
    res.status(200).send({
      representative: req.user,
      organization: req.user.organization,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/signin', requireSignIn, (req, res, next) => {
  try {
    res.send({
      representative: req.user,
      token: tokenForUser(req.user),
    });
  } catch (e) {
    next(e);
  }
});

router.post('/signup', (req, res, next) => {
  logger.info('Representative Sign Up');
  try {
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
  } catch (e) {
    next(e);
  }
});

module.exports = router;
