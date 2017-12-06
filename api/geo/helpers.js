import { bookshelf, knex } from '../orm';
import { Address } from './models';
import geocoder from '../utils/geocoder';

export function addressToString(address) {
  return `${address.address_1}, ${address.city || ''}${address.region ? `, ${address.region} ` : ' '}${address.state || ''} ${address.country || ''}`;
}

export function getGeomPointTextForAddress(address) {
  if (address.location && address.location.coordinates) {
    return `ST_PointFromText('POINT(${address.location.coordinates[0]} ${address.location.coordinates[1]})',4326)`;
  }
  return null;
}

export async function crudEntityAddresses(relation, addresses) {
  // A relation needs to exist
  if (!relation) return;
  const existingAddressIds = await knex.select('address_id').from('addresss_entity_associations').where(relation).then(ids => ids);
  // If no addresses exist, delete on the relation
  if (!addresses || (addresses.length === 0)) {
    // Remove Relations
    await knex('addresss_entity_associations').where(relation).del().then(d => d);
    // Remove Addresses by ID
    Promise.all((existingAddressIds || []).map(id => knex('addresss').where({ id }).del())).then(r => r);
  } else {
    // Create/Update All Addresses, Returning IDs (Delete if no numbers exist)
    const newAddressIds = await Promise.all(addresses.map((address) => {
      const pointText = getGeomPointTextForAddress(address);
      if (pointText) {
        return Address.where({ id: address.id }).save({
          ...address,
          location: bookshelf.knex.raw(pointText),
        }, { method: 'update', patch: true }).then(a => a.id);
      }
      return geocoder(addressToString(address)).then((newAddress) => {
        return Address.forge({
          ...newAddress,
          location: bookshelf.knex.raw(getGeomPointTextForAddress(newAddress)),
        }).save(null, { method: 'insert' }).then(p => p.id);
      });
    })).then(ids => ids.filter(i => i));
    // Create relations between phones/entities
    knex('addresss_entity_associations').where(relation).del()
      .then(() => knex.batchInsert('addresss_entity_associations', newAddressIds.map(aId => ({ address_id: aId, ...relation }))).then(r => r));
  }
}

export async function createAddress(address, options = { returnJSON: true }) {
  // If already geocoded, just forge (should have formatting + coordinates from geocoder)
  if (address.location || address.address) {
    return await Address.forge(address).save(null, { method: 'insert' })
      .then(data => (options.returnJSON ? data.toJSON() : data));
  // Otherwise, run geocode and format/forge
  }
  let geocodedObj = null;
  // If given a string
  if (typeof address === 'string') {
    geocodedObj = await geocoder(address).then(g => g);
  // If given an address object
  } else if (address.address) {
    geocodedObj = await geocoder(addressToString(address.address)).then(g => g);
  } else if (address.lat && address.lon) {
    geocodedObj = await geocoder(`${address.lat}, ${address.lon}`).then(g => g);
  }
  return Address.forge({
    ...address,
    location: geocodedObj ? bookshelf.knex.raw(getGeomPointTextForAddress(geocodedObj)) : null,
  }).save(null, { method: 'insert' })
  .then(add => (options.returnJSON ? add.toJSON() : add));
}
