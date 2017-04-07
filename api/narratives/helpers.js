import { logger } from '../logger';

export const entityValueIs = (entities = [], searchValues = []) => {
  let hrstart = process.hrtime();

  let hasValue = false;
  entities.forEach((entity) => {
    if (searchValues.includes(entity.value)) hasValue = true;
  });

  let hrend = process.hrtime(hrstart);
  logger.info(`entityValueIs ran in: ${hrend[0]}s ${hrend[1]/1000000}ms`);

  return hasValue;
};

export const mapEntitiesToStates = (entities, map) => {
  
}

