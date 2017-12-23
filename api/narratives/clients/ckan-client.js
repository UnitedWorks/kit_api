import axios from 'axios';
import moment from 'moment';

export default class CkanClient {
  constructor(props = {}) {
    if (!props.portal_url) throw new Error('No data portal URL provided.')
    this.baseRoute = props.portal_url;
    this.apiUrl = 'http://data.jerseycitynj.gov/api/3';
  }
  searchDataResources(query) {
    return axios.get(`${this.apiUrl}/action/resource_search${query ? `?query=name:${query}` : ''}`).then((res) => {
      return res.data.result.results.sort((a, b) => {
        return (a.created || a.last_modified) < (b.created || b.last_modified);
      })
      .map((resource) => {
        const lastModified = moment(resource.last_modified || resource.created).format('LL');
        return {
          type: 'resource',
          payload: {
            name: resource.name,
            description: `${lastModified ? `Lasted updated ${lastModified}. ` : ''}${resource.description || 'No description'}`,
            url: resource.url,
          },
        };
      });
    });
  }
}
