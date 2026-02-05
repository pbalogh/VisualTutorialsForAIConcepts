const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all directories in src/
const srcDir = path.resolve('src');
const websites = fs.readdirSync(srcDir).filter(item =>
    fs.statSync(path.join(srcDir, item)).isDirectory()
);

console.log(`Found websites: ${websites.join(', ')}`);

// Build each website
for (const website of websites) {
    console.log(`Building ${website}...`);
    process.env.WEBSITE_NAME = website;
    process.env.REACT_APP_SRC = path.join('src', website, 'src');
    process.env.REACT_APP_PUBLIC = path.join('src', website, 'public');
    try {
        execSync('node ./scripts/react-scripts-wrapper.js', {
            stdio: 'inherit',
            env: { ...process.env, NODE_ENV: 'production' }
        });
        console.log(`✓ ${website} built successfully`);
    } catch (error) {
        console.error(`✗ Failed to build ${website}:`, error.message);
        process.exit(1);
    }
}