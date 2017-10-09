import { Router } from 'express';
import shoutOutLogic from './logic';

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

router.get('/templates', (req, res) => {
  res.status(200).send({ templates: shoutOutLogic.ready });
});

module.exports = router;