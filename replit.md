# SurveyJS Creator Demo

## Overview

This is a demonstration of **SurveyJS Creator**, an extensible drag-and-drop form builder that allows you to design dynamic JSON-based forms directly in your browser. SurveyJS Creator is a powerful client-side tool with native support for React, Angular, Vue, and Knockout frameworks.

**Current State:** Fully configured and running on Replit with Vue 3 example application.

**Demo URL:** The application runs on port 5000 and displays the SurveyJS Creator interface.

## Project Information

- **Project Name:** SurveyJS Survey Creator
- **Type:** Monorepo with multiple framework implementations (React, Vue, Angular, Knockout)
- **Current Setup:** Vue 3 example application
- **Framework:** Vue 3 + Vite
- **Port:** 5000
- **Language:** TypeScript, JavaScript

## Features

### Survey Creator (Main Tool)
- Drag-and-drop form builder interface
- Visual form designer with live preview
- Theme editor for customizing form appearance
- Logic and conditional branching editor
- JSON schema generation
- Multiple question types (rating, dropdown, checkboxes, etc.)
- Survey settings panel
- Test/Preview mode
- **Field Piping**: Insert dynamic field references (e.g., `{firstName}`) into text inputs
  - Draggable panel that works across Designer and Preview tabs
  - Search functionality to find fields quickly
  - Works with SurveyJS contenteditable elements
  - Automatically tracks available form fields

### CSV Survey Generator (New Tool)
- Upload CSV files to create dynamic surveys
- Select display column and unique ID column from CSV data
- Preview CSV data before generating survey
- Generate dropdown surveys from CSV data
- Save survey responses to Replit database
- View all submitted responses with timestamps
- Full integration with SurveyJS rendering engine

## Recent Changes (November 21, 2025)

### UI/UX Improvements
- Fixed navigation bar visibility by removing fixed positioning from Example.vue
- Navigation bar now properly displays across all routes without overlay issues
- Moved Field Piping from floating draggable panel to toolbar button integration
- Added "Show Fields" button to Survey Creator toolbar for cleaner UX
- Field Piping panel now toggles on/off with fixed right-side positioning
- Fixed blank space at bottom of site using pure flex layout (flex:1, min-height:0)
- Implemented proper viewport filling while preserving natural document scrolling

### CSV Survey Tool Added
- Created Express backend server (port 3001) with API endpoints for survey responses
- Integrated Replit Database for persistent storage with unique submission IDs
- Built CsvSurvey.vue component with file upload, column selection, and survey generation
- Added navigation bar to switch between Survey Creator and CSV Survey tools
- Configured Vite proxy to forward API requests to Express backend
- Added sample CSV file for testing (`public/sample-courses.csv`)
- Updated package.json to run both Vite and Express servers concurrently
- Implemented inline error/success messaging for better user feedback
- Fixed persistence bug: each submission now gets unique ID (no overwrites)

### Field Piping Feature Added
- Created FieldPipingSidebar.vue component with field insertion capability
- Implemented focus tracking for SurveyJS contenteditable elements
- Supports both standard INPUT/TEXTAREA and contenteditable elements
- Panel with search functionality and close button
- Fixed Selection API range handling for robust insertion
- Accessible via "Show Fields" toolbar button in Survey Creator

## Recent Changes (November 20, 2025)

### Initial Replit Setup
- Configured the Vue 3 example to use npm packages instead of local builds
- Updated dependencies to use published npm packages (survey-core@2.3.16, survey-vue3-ui@2.3.16, survey-creator-core@2.3.16, survey-creator-vue@2.3.16)
- Configured Vite to run on port 5000 with host 0.0.0.0
- Added critical `allowedHosts: true` setting to vite.config.ts for Replit's proxy environment
- Added HMR configuration for Replit's proxy environment
- Installed @tsconfig/node16 devDependency to resolve TypeScript configuration
- Set up workflow to run the development server
- Configured deployment for autoscale deployment target

## Project Architecture

### Directory Structure
```
survey-creator/
├── packages/
│   ├── survey-creator-core/      # Core creator functionality
│   ├── survey-creator-vue/        # Vue 3 wrapper
│   │   └── example/               # Demo application (currently running)
│   ├── survey-creator-react/      # React wrapper
│   ├── survey-creator-angular/    # Angular wrapper
│   └── survey-creator-js/         # Plain JavaScript wrapper
├── docs/                          # Documentation
├── functionalTests/               # Test suites
└── package.json                   # Root package configuration
```

### Key Technologies
- **Vue 3**: Frontend framework
- **Vite**: Build tool and dev server
- **TypeScript**: Type-safe development
- **SurveyJS**: Form rendering engine
- **Bootstrap 3**: UI styling

## Development

### Running the Application
The application is configured to run automatically via the "SurveyJS Creator Demo" workflow.

**Manual run:**
```bash
cd packages/survey-creator-vue/example
npm run dev
```

### Building for Production
```bash
cd packages/survey-creator-vue/example
npm run build
npm run preview
```

### Configuration Files
- `packages/survey-creator-vue/example/vite.config.ts` - Vite configuration with Replit proxy settings
- `packages/survey-creator-vue/example/package.json` - Dependencies and scripts

## Deployment

The project is configured for autoscale deployment:
- **Build command:** Installs dependencies and builds the Vue example
- **Run command:** Runs the Vite preview server on port 5000
- **Deployment type:** Autoscale (stateless web application)

## Licensing

**Important:** SurveyJS Creator is **not available for free commercial usage**. A commercial license is required for production use. However, you can:
- Use the free demo to generate form configurations
- Render generated forms with SurveyJS Form Library (MIT licensed) for free

## Additional Resources

- [SurveyJS Documentation](https://surveyjs.io/survey-creator/documentation/overview)
- [GitHub Repository](https://github.com/surveyjs/survey-creator)
- [Live Demo](https://surveyjs.io/create-free-survey)
- [Licensing Information](https://surveyjs.io/licensing)

## Notes

### Dependencies
The example uses published npm packages rather than local builds from the monorepo. This simplifies setup and ensures stable versions are used.

### Known Limitations
- HMR (Hot Module Replacement) WebSocket connection warnings appear in the browser console but don't affect functionality
- The monorepo structure includes multiple framework implementations, but only the Vue example is currently configured to run
