import { Router } from 'express';
import { ShoutOut } from './models';
import * as SHOUT_OUT_CONST from '../constants/shout-outs';

const router = new Router();

// Autolabel with supplied Text/Picture
router.post('/', (req, res) => {
  if (req.body.text) {
    res.status(200).send({ received_text: req.body.text });
  } else if (req.body.image_url) {
    res.status(200).send({ received_image: req.body.image_url });
  } else {
    res.status(200).send({ received_params: req.body });
  }
});

module.exports = router;
