const fs = require('fs');
const path = require('path');

const rootPath = path.join(__dirname, '..');
const logPath = path.join(rootPath, 'logs');

// Create logs folder
if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath);
}

// Create log files
const infoPath = `${logPath}/info.log`;
if (!fs.existsSync(infoPath)) {
  fs.unlinkSync(infoPath);
}
fs.writeFileSync(infoPath);
