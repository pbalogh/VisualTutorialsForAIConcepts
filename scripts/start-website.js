require('module-alias/register');

const fs = require('fs');
const path = require('path');

const websiteName = process.argv[2];
if (!websiteName) {
  const srcDir = path.resolve('src');
  const websites = fs.readdirSync(srcDir).filter(item => 
    fs.statSync(path.join(srcDir, item)).isDirectory()
  );
  console.error('Error: You need to provide a website name to start.');
  console.error(`Available websites in src folder: ${websites.join(', ')}`);
  process.exit(1);
}

// Check if website exists
const websitePath = path.join('src', websiteName);
if (!fs.existsSync(websitePath)) {
  console.error(`Error: The website '${websiteName}' does not exist under the src folder.`);
  process.exit(1);
}

// Set environment variables for the website
process.env.WEBSITE_NAME = websiteName;
process.env.REACT_APP_SRC = path.join('src', websiteName, 'src');
process.env.REACT_APP_PUBLIC = path.join('src', websiteName, 'public');

console.log(`Starting ${websiteName}...`);
require('react-scripts/scripts/start');