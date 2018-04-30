import { logger } from '../../logger';
import { fetchAnswers } from '../helpers';
import { Boundary } from '../../boundarys/models';
import { Person } from '../../persons/models';
import { geoCheck } from '../helpers';
import * as elementTemplates from '../templates/elements';

export default {
  council: {
    async enter() {
      // Check for Boundaries
      const boundaries = await Boundary.query(qb => qb.whereRaw("'Political' = ANY(boundarys.functions)")).where('organization_id', '=', this.snapshot.organization.id).fetchAll().then(b => b.length > 0);
      if (!boundaries || boundaries.length === 0) return this.input('message', { boundaries: false });
      // Otherwise Continue
      if (!this.get('attributes').address) return this.requestLocation();
      return this.input('message', { boundaries: true });
    },
    async message(aux = {}) {
      if (aux.boundaries === true) {
        const persons = await Person.query(qb => qb.whereRaw("'Political' = ANY(persons.functions)")).where({ organization_id: this.snapshot.organization_id }).fetchAll({ withRelated: ['boundarys'] }).then(p => p.toJSON());
        const municipalWidePersons = persons.filter(p => p.boundarys.length === 0);
        const sectionSpecificPersons = persons.filter(p => p.boundarys.length === 1).filter(p => (geoCheck(p.boundarys[0].geo_rules.coordinates, [this.get('attributes').location.lat, this.get('attributes').location.lon])));
        if (municipalWidePersons.length > 0 || sectionSpecificPersons.length > 0) {
          // Give Normal Answer
          await Promise.resolve(fetchAnswers('government_civil_services.council', this));
          const reps = [...sectionSpecificPersons, ...municipalWidePersons];
          // Then give formed text abot user specific representatives
          return this.messagingClient.send(`You are represented locally by ${reps.map(r => `${r.name}${r.boundarys[0] ? ` (${r.boundarys[0].name})` : ' (Municipal Wide)'}`).join(', ')}`).then(() => this.getBaseState());
        }
      }
      return Promise.resolve(fetchAnswers('government_civil_services.council', this)).then(() => this.getBaseState());
    },
  },
};
