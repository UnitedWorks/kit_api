import { Media } from './models';

export const saveMedia = (attachment, options = {}) => {
  const newModel = {
    type: attachment.type,
    url: attachment.payload.url,
  };
  return Media.forge(newModel).save().then((data) => {
    return options.returnJSON ? data.toJSON() : data;
  }).catch(err => err);
};
