import { Router } from 'express';

const router = new Router();

// Would be cool to have a route that sees what is occuring that day based on schedules
// Pre-emptively ping the user about trash pickup?
router.get('/', (req, res) => {
  res.status(200).send();
});

module.exports = router;
