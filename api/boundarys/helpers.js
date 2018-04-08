import { knex } from '../orm';

export function coordinatesToPOSTGIS(coordinates) {
  let formattedGeoRule = null;
  if (coordinates) {
    const polygonStrings = [];
    coordinates.forEach((polys) => {
      let polyString = '';
      polys.forEach((point, index) => {
        polyString += `${index !== 0 ? ',' : ''}${point[0]} ${point[1]}`;
      });
      polyString = `${polyString}, ${polys[0][0]} ${polys[0][1]}`;
      polygonStrings.push(`((${polyString}))`);
    });
    formattedGeoRule = knex.raw(`ST_GeomFromText('MULTIPOLYGON(${polygonStrings.join(', ')})',4326)`);
  }
  return formattedGeoRule;
}
