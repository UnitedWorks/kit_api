// Pull in Environment Variables
require('dotenv').config();
const ps = require('child_process');

// Break up Args
const env = process.env;
const args = process.argv.slice(2);
const command = args[0];

const simpleLog = (err, out, msg) => {
  if (err) {
    console.error(err);
  } else {
    console.log(out);
    console.log(msg);
  }
};

// Commands
if (command === 'push') {
  const repoRoot = process.env.DOCKER_REPO_ROOT;
  const service = args[1];
  ps.exec('git rev-parse HEAD', (err, stdout) => {
    // Get hash of last commit
    const gitHash = stdout;
    // Login
    ps.exec(`docker login -e ${env.DOCKER_HUB_EMAIL} -u ${env.DOCKER_HUB_USER} -p ${env.DOCKER_HUB_PWD}`, (logInErr, logInOut) => {
      simpleLog(logInErr, logInOut, `Logged In. Pushing ${repoRoot}_${service} with tags 'latest' and '${gitHash}' to docker.io/${env.DOCKER_HUB_ORG}`);
      if (logInErr) return;
      // Tag Latest
      ps.exec(`docker tag ${repoRoot}_${service} ${env.DOCKER_HUB_USER}/${repoRoot}_${service}:latest`, (latestTagErr, latestTagOut) => {
        simpleLog(latestTagErr, latestTagOut, 'Latest Tagged');
        // Push
        ps.exec(`docker push ${env.DOCKER_HUB_USER}/${repoRoot}_${service}:latest`, (latestPushErr, latestPushOut) => {
          simpleLog(latestPushErr, latestPushOut, 'Latest Pushed');
        });
      });
      // Tag Hashed
      ps.exec(`docker tag ${repoRoot}_${service} ${env.DOCKER_HUB_USER}/${repoRoot}_${service}:${gitHash}`, (hashedTagErr, hashedTagOut) => {
        simpleLog(hashedTagErr, hashedTagOut, 'Hashed Tagged');
        // Push
        ps.exec(`docker push ${env.DOCKER_HUB_USER}/${repoRoot}_${service}:${gitHash}`, (hashedPushErr, hashedPushOut) => {
          simpleLog(hashedPushErr, hashedPushOut, 'Hashed Pushed');
        });
      });
    });
  });
}

if (command === 'deploy') {
  // Pull Image
  // Push to AWS ECS
}
