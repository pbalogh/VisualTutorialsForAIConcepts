const paths = require('react-scripts/config/paths');
const path = require('path');
const fs = require('fs');

const websiteName = process.env.WEBSITE_NAME;
const srcPath = process.env.REACT_APP_SRC;
const publicPath = process.env.REACT_APP_PUBLIC;

paths.appBuild = path.resolve(paths.appPath, 'build', 'dist', websiteName);
paths.appSrc = path.resolve(paths.appPath, srcPath);
paths.appPublic = path.resolve(paths.appPath, publicPath);
paths.appHtml = path.resolve(paths.appPath, publicPath, 'index.html');

// Check for multiple index file formats in priority order
const indexFormats = [
    'index.tsx',  // TypeScript JSX
    'index.ts',   // TypeScript
    'index.jsx',  // JavaScript JSX
    'index.js'    // JavaScript (default)
];

let foundIndex = null;
for (const format of indexFormats) {
    const indexPath = path.resolve(paths.appPath, srcPath, format);
    if (fs.existsSync(indexPath)) {
        foundIndex = indexPath;
        break;
    }
}

paths.appIndexJs = foundIndex || path.resolve(paths.appPath, srcPath, 'index.js');

module.exports = paths;
