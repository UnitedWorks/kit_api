import axios from 'axios';
import moment from 'moment';

export default class WeatherClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.OPEN_WEATHER_MAP_KEY;
  }
  static emojiMap = {
    500: '☔',
    800: '☀',
    801: '⛅',
    802: '☁',
    803: '☁',
  }
  async dayForecast(lat, lon) {
    const locForecast = await axios.get('http://api.openweathermap.org/data/2.5/forecast', { params: {
      APPID: this.apiKey,
      lat,
      lon,
      units: 'imperial',
    } }).then(r => r.data.list.filter(f => moment(f.dt_txt).diff(moment(), 'h') < 24));
    const tempWeatherConditions = {};
    locForecast.forEach(f => (tempWeatherConditions[f.weather[0].id] = f.weather[0]));
    return {
      min: Math.min(...locForecast.map(f => f.main.temp_min)),
      max: Math.max(...locForecast.map(f => f.main.temp_max)),
      weather: tempWeatherConditions[Math.max(...locForecast.map(f => f.weather[0].id))],
    };
  }
}
