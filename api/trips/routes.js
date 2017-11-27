import { Router } from 'express';
import { bookshelf, st } from '../orm';
import { Trip } from './models';

const router = new Router();

router.route('/')
  .post((req, res, next) => {
    const tripProps = req.body.trip;
    Trip.forge({
      ...tripProps,
      path: tripProps.path && tripProps.path.length > 1
        ? bookshelf.knex.raw(`ST_GeomFromText('LineString(${tripProps.path.map(c => `${c[0]} ${c[1]}`).join(',')}',4326)`)
        : null,
    })
    .save(null, { method: 'insert' })
    .then((forgedTrip) => {
      Trip.where({ id: forgedTrip.id })
        .query((qb) => {
          qb.select('*', st.asGeoJSON('path'));
        }).fetch().then((fetched) => {
          res.status(200).send({ trip: {
            ...fetched.toJSON(),
            path: JSON.parse(fetched.toJSON().path),
          } });
        });
    }).catch(err => next(err));
  });

module.exports = router;
