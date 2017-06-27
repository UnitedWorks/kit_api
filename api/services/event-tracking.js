import Mixpanel from 'mixpanel';

export default Mixpanel.init(process.env.MIXPANEL_ID, {
  protocol: 'https',
});
