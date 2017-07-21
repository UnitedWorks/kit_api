import { Router } from 'express';
import { Task } from './models';

const router = new Router();

router.route('/')
  .get((req, res, next) => {
    try {
      Task.where({ id: req.query.task_id }).fetch({ withRelated: ['organization'] })
        .then((fetched) => {
          if (fetched) {
            const task = Object.assign({}, fetched.toJSON());
            const organization = task.organization;
            delete task.organization;
            res.status(200).send({ task, organization });
          } else {
            res.status(400).send();
          }
        }).catch(err => next(err));
    } catch (e) {
      next(e);
    }
  });

module.exports = router;
