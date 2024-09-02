## Running the Cits3200 Next App

Developed on:

- Ubuntu 22.04.3 LTS WSL 2

Before you start, ensure you have the following installed:

- Node.js (version 14.x or higher recommended)
- npm (comes with Node.js)

0. Installation of Node.js

```bash
$ sudo apt update

$ curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

$ sudo apt install -y nodejs
```

1. Navigate to the Project Directory

```bash
cd CITS3200-Project
```


2. Running the Development Server
   To start the development server and view the application in your browser:

```bash
$ npm install

$ npm run dev
```

3. Build production (Not needed for development)

```bash
$ npm run build

$ npm run start
```

The application will now run in production mode on http://localhost:3000 (or something similar).

## Setting Up Environment Variables
1. Create an .env.local file in the root directory of your project.
2. Add the required variables with their corresponding values, following the format below:
3. APPEND TO EXISTING ONES

```plaintext
//Existing ones leave as it is

AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```


---

## Technologies Used

- Next.js: React framework for server-side rendering and static site generation.
- React: JavaScript library for building user interfaces.
- Node.js: JavaScript runtime environment for executing JavaScript on the server.
- npm: Package managers to install dependencies.

---

## Project Structure

Here's a brief overview of the project's structure:

```plaintext
CITS3200-Project/
├── frontend/
│     ├── pages/
│     │   ├── api/
│     │   │   └── auth/
│     │   │       └── [...nextauth].js  # NextAuth.js API route for authentication
│     ├── src/
│     │   ├── app/
│     │   │   ├── layout.js             # Global layout for the application
│     │   │   ├── page.js               # Root page (renders at `/`)
│     │   │   ├── login/
│     │   │   │   └── page.js           # Login page (renders at `/login`)
│     │   ├── components/               # Reusable UI components
│     │   │   ├── Navbar.js             # Navigation bar component
│     │   ├── styles/                   # Global and component-specific styles
│     ├── public/                       # Static assets (images, fonts, etc.)
│     ├── .env.local                    # Environment variables for local development
│     ├── next.config.js                # Next.js configuration file
│     ├── package.json                  # Dependencies and scripts
└──    └── README.md                     # Project documentation (this file)
```

## Warning: Directory Structure
The directory structure of this project is carefully designed to work with Next.js and its routing system. Any changes to this structure could lead to unexpected behavior or application errors. Specifically:

Do Not Move or Rename Core Directories:
- The src directory contains key folders like app, pages, and api, which are essential for routing and functionality.
- The app directory defines the routes for the application. Moving or renaming files within this directory could break the routing.
- The api folder inside pages is responsible for handling API requests. Changing its structure could result in API routes not functioning as expected.
- Middleware: The middleware file is crucial for securing certain routes (e.g., the dashboard). If using custom middleware, ensure it is placed correctly as per the project’s design.
- Static Files: The public directory should contain all static files like images, fonts, and other assets. Modifying this directory may lead to issues with how static assets are served.

## Environment Variables
This project relies on specific environment variables that must be configured correctly to ensure proper operation. These variables are stored in an .env.local file in the root directory. The following environment variables are required:

AZURE_AD_CLIENT_ID: The Client ID for your Azure AD application.
AZURE_AD_CLIENT_SECRET: The Client Secret for your Azure AD application. Ensure this is kept secure.
AZURE_AD_TENANT_ID: The Tenant ID for your Azure AD instance.
NEXTAUTH_SECRET: A secret used by NextAuth.js to encrypt session data.
NEXTAUTH_URL: The URL where your application is hosted (e.g., http://localhost:3000 during development).

