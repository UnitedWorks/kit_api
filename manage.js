// Pull in Environment Variables
require('dotenv').config();
const ps = require('child_process');

// Break up Args
const args = process.argv.slice(2);
const command = args[0];

// Commands
if (command === 'push') {
  ps.exec(`curl -H "Content-Type: application/json" --data '{"build": true}' -X POST $DOCKER_HUB_BUILD_TRIGGER_URL https://registry.hub.docker.com/u/unitedworks/mayor-api/trigger/c61a9549-a157-48ea-ac9a-17fce47f3cb1/`);
}

if (command === 'deploy') {
  // Pull Image
  // Push to AWS ECS
}
