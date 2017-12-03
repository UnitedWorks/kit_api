import { Media } from './models';

export const saveMedia = ({ media, organization }, options = {}) => {
  const newModel = {
    filename: media.name,
    type: media.type,
    url: media.url,
    organization_id: organization.id,
  };
  return Media.forge(newModel).save()
  .then(data => (options.returnJSON ? data.toJSON() : data))
  .catch(err => err);
};
