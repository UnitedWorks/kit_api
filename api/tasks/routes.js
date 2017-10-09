import { Router } from 'express';
import { Task } from './models';
import { updateTaskStatus } from './helpers';

const router = new Router();

router.route('/')
  .get((req, res, next) => {
    try {
      Task.where({ id: req.query.task_id }).fetch({ withRelated: ['organization', 'shout_outs'] })
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
  })
  .put((req, res, next) => {
    try {
      Task.where({ id: req.body.id }).save(req.body, { method: 'update', patch: true })
        .then((updated) => {
          updated.refresh({ withRelated: ['shout_outs'] }).then((refreshedTask) => {
            res.status(200).send({ task: refreshedTask.toJSON() });
          });
        }).catch(err => next(err));
    } catch (e) {
      next(e);
    }
  });

router.post('/status', (req, res, next) => {
  try {
    updateTaskStatus(req.body.id, req.body.status).then((task) => {
      res.status(200).send({ task });
    }).catch(err => next(err));
  } catch (e) {
    next(e);
  }
});

module.exports = router;
