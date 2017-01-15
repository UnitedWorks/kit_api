const fs = require('fs');
const path = require('path');

const rootPath = path.join(__dirname, '..');
const rootLogPath = path.join(rootPath, 'logs');

// Create logs folder
if (!fs.existsSync(rootLogPath)) {
  fs.mkdirSync(rootLogPath);
}

// Create log files
const logPaths = [`${rootLogPath}/info.log`, `${rootLogPath}/error.log`, `${rootLogPath}/warning.log`];
logPaths.forEach((logPath) => {
  if (fs.existsSync(logPath)) {
    fs.unlinkSync(logPath);
  }
  fs.writeFileSync(logPath, '');
});
