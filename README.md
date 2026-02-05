# DasBoard Interactive Website Package

This package provides a multi-website React setup for DasBoard applications, enabling you to create interactive visualization websites that integrate seamlessly with your DasBoard infrastructure.

## Package Structure

```
src/
├── tutorialWebsite/          # Tutorial website demonstrating the structure
│   ├── public/
│   │   └── index.html       # HTML template
│   └── src/
│       ├── App.js           # Main React component
│       ├── App.css          # Styling
│       └── index.js         # React entry point
├── yourNewWebsite/          # Create additional websites here
│   ├── public/
│   └── src/
scripts/
├── build-websites.js        # Builds all websites
├── start-website.js         # Starts individual website for development
├── react-scripts-wrapper.js # React scripts integration
└── react-scripts-wrapper-paths.js # Path configuration
```

## Available Commands

### Build All Websites
```bash
bb
```
Builds all websites in the `src/` directory to `build/dist/{websiteName}/`

### Start Development Server
```bash
bb start <websiteName>
```
Starts the development server for a specific website. Replace `<websiteName>` with the actual folder name (e.g., `tutorialWebsite`).

### Clean Build Artifacts
```bash
bb clean
```
Removes build artifacts, node_modules, and dist folders.

## Creating New Websites

### 1. Create Website Structure
Create a new folder in `src/` following the same structure as `tutorialWebsite`:

```
src/
└── yourNewWebsite/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js
        ├── App.css
        └── index.js
```

### 2. Update CDK Configuration

Add your new website to the CDK configuration in your main application:

**configurations/beta/website.ts**:
```typescript
import { DasBoardWebsiteConfiguration } from "@amzn/dasboard-cdk/website";

export const BetaWebsite: DasBoardWebsiteConfiguration[] = [
  {
    packageName: "YourWebsitePackageName",
    subDistribution: "tutorialWebsite",
    websiteName: "Tutorial Website",
    description: "Tutorial website for demonstration purposes",
  },
  {
    packageName: "YourWebsitePackageName", 
    subDistribution: "yourNewWebsite",
    websiteName: "Your New Website",
    description: "Description of your new website",
  },
];
```

Repeat for `gamma/website.ts` and `prod/website.ts` as needed.

## Development Workflow

1. **Local Development**: Use `bb start <websiteName>` to develop individual websites
2. **Build**: Run `bb build` to build all websites
3. **Deploy**: Your CDK pipeline will automatically deploy built websites to CloudFront
4. **Access**: Websites will be available through DasBoard's interactive website interface

## Website Integration

Each website automatically integrates with DasBoard's infrastructure:
- **Authentication**: Midway authentication via CloudFront Signer
- **Session Management**: S3-based input/output paths for run sessions

## Build System Details

- **Multi-Website Support**: Each website in `src/` builds independently
- **Dynamic Discovery**: Build system automatically finds all website directories
- **Isolated Builds**: Each website gets its own build environment and output directory
- **React Scripts Integration**: Uses react-scripts with custom path overrides
- **Module Aliases**: Custom path resolution for build system integration

## Troubleshooting

### Website Not Building
- Ensure the website folder structure matches the required format
- Check that the website has the necessary React files

### Development Server Issues
- Make sure you're using the correct website name: `bb start <websiteName>`
- Check that the website folder exists in `src/`

### CDK Deployment Issues
- Verify website configuration is added to all stage files (beta, gamma, prod)
- Ensure `packageName` matches your actual package name
- Check that `subDistribution` matches your website folder name

## Managing Websites

### Customizing the Tutorial Website
You can modify the existing `tutorialWebsite` by editing files in `src/tutorialWebsite/`.

### Removing the Tutorial Website
To remove the tutorial website:
1. Delete the `src/tutorialWebsite/` folder
2. Remove the corresponding entry from your CDK configuration files

### Adding New Websites
1. Create a new folder in `src/` (e.g., `src/myNewWebsite/`)
2. Add the website structure following the `tutorialWebsite` pattern
3. Add the website configuration to your CDK files with the correct `subDistribution` name

**Important**: The `subDistribution` field in your CDK configuration must match your website folder name exactly.

## Next Steps

1. Customize existing websites or create new ones
2. Update your CDK configuration to match your website structure
3. Deploy through your application's pipeline
4. Access websites through DasBoard's interactive interface