Running the CITS3200 Next App

# Developed on:

Ubuntu 22.04.3 LTS WSL 2
Before you start, ensure you have the following installed:

Docker and Docker Compose (for containerized application management)

# Steps to Run the Application

Clone the Project Repository:

If you haven't already, clone the repository to your local machine:

```bash
git clone https://github.com/your-repository-url.git
```

Navigate to the Project Directory:

```bash
cd CITS3200-Project-Window
```

# Running the Development Environment Using Docker Compose:

Use Docker Compose to build and start the application in development mode:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

This will launch all the necessary services, including the database, frontend, and backend, inside Docker containers.

Accessing the Application:

The application should now be accessible on http://localhost:3000.
The backend will be running on http://localhost:9000.
Stopping the Application:

To stop the running containers:

```bash
docker-compose down --remove-orphans
```

After running --build, you should be able to use below command to relaunch:

```bash
docker-compose -f docker-compose.dev.yml up
```

# Build the Production Environment (Optional):

Use Docker Compose to build and start the production version:

```bash
docker-compose -f docker-compose.prod.yml up --build
```

Access the Production Application:
The production application will run on http://your-production-url.

# Technologies Used

Next.js: React framework for server-side rendering and static site generation.
React: JavaScript library for building user interfaces.
Node.js: JavaScript runtime environment.
Docker: Containerization platform to isolate and deploy applications.
PostgreSQL: Relational database system used by the backend.

# Directory Structure Frontend specific

CITS3200-Project-Window/

├── API
│ ├── SOC_API.md # Documentation for the SOC API.
│ └── WEB_API.md # Documentation for the Web API.
├── Dockerfile # Main Dockerfile for the project.
├── Dockerfile.db # Dockerfile to build the PostgreSQL database container.
├── Dockerfile.frontend # Dockerfile to build the frontend container.
├── Dockerfile.nginx # Dockerfile for configuring NGINX.
├── Dockerfile.web # Dockerfile for the backend web server.
├── README
│ ├── RRMS_WebServer_database.png # Diagram of the RRMS database setup.
│ ├── database_README.md # Instructions for setting up the database.
│ ├── deployment_README.md # Instructions for deploying the app.
│ ├── frontend_README.md # Frontend-specific documentation.
│ ├── radio_streaming_README.md # Radio streaming setup guide.
│ ├── rasp_pi_README.md # Raspberry Pi setup instructions.
│ └── security_README.md # Security considerations for the project.
├── README.md # Main project README.
├── RRMS.jpg # Image related to the RRMS project.
├── docker-compose.dev.yml # Docker Compose for development environment.
├── docker-compose.yml # Docker Compose for orchestrating the services.
├── frontend
│ ├── README.md # Frontend-specific README.
│ ├── jsconfig.json # JavaScript project configuration.
│ ├── middleware.js # Middleware for handling session or routing logic.
│ ├── next.config.mjs # Next.js configuration file.
│ ├── package-lock.json # Dependency lock file for consistent installs.
│ ├── pages
│ │ └── api
│ │ └── auth
│ │ └── [...nextauth].js # NextAuth.js API for authentication.
│ ├── postcss.config.mjs # PostCSS configuration for styling.
│ ├── public # Static assets like images and icons.
│ ├── src
│ │ ├── app # Main Next.js application routes.
│ │ │ ├── analytics # Analytics page.
│ │ │ ├── api-key # API key generation and display page.
│ │ │ ├── channel-listening # Channel listening page.
│ │ │ ├── globals.css # Global CSS for styling the app.
│ │ │ ├── layout.js # Layout component for the entire app.
│ │ │ ├── login # Login page.
│ │ │ └── single-channel # Single-channel page.
│ │ ├── components # Reusable frontend components.
│ │ ├── DynamicChannel.js # Component for dynamic channel rendering.
│ │ ├── Navbar.js # Navigation bar component.
│ │ ├── NotificationBell.js # Notification bell component.
│ │ └── NotificationContext.js # Context provider for managing notifications.
│ └── tailwind.config.js # Tailwind CSS configuration.
├── nginx.conf # NGINX configuration file.
├── package-lock.json # Root lock file for managing dependencies.
└── package.json # Root package file for project dependencies and scripts.

# Environment Variables

This project relies on specific environment variables for both development and production. Be sure to update your .env.local or .env file with the correct values.

Set Up Environment Variables:
Ensure that your .env.local or .env file is correctly configured. Refer to the .env.local.default file as a template, and copy it to .env.local in the root directory:

## Sample .env.local for Local Development:

AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000/
NEXT_PUBLIC_BACKEND_URL=http://localhost:9000/api_v2/
NEXT_PUBLIC_SDR_URL=http://host.docker.internal:4001/

Ensure that your .env.local file remains confidential and is not committed to source control.

# Warning: Directory Structure

The structure of this project is designed to work seamlessly with Next.js and Docker. Do not modify the core directories such as src, pages, or app unless absolutely necessary.
