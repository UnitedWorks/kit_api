export const entityValueIs = (entities = [], searchValues = []) => {
  let hasValue = false;
  entities.forEach((entity) => {
    if (searchValues.includes(entity.value)) hasValue = true;
  });
  return hasValue;
};
