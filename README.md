# CITS3200-Project

Quick-access hyperlinks:

- [JIRA Board](https://cits3200team5.atlassian.net/jira/software/projects/SCRUM/boards/1)
- [Project Outline](https://uniwa-my.sharepoint.com/:w:/r/personal/23408841_student_uwa_edu_au/_layouts/15/Doc.aspx?sourcedoc=%7B5D3EBC7B-4245-4875-B1CF-AA6C431C241A%7D&file=CITS3200%20-%20Radio%20Project.docx&action=default&mobileredirect=true)

| UWA ID   | Name           | Github Username |
| -------- | -------------- | --------------- |
| 23455873 | Aifert Yet     | Aifert          |
| 23408841 | Arnav Dangmali | GravityWorld    |
| 23012728 | Henry Hewgill  | HenryHewgill    |
| 22705919 | Jakem Pinchin  | JakePinchin     |
| 23334811 | Joseph Newman  | RedBlueCarrots  |
| 23165388 | Sigmund Howe   | SigHowe         |

---

## Running the Cits3200 Next App

Developed on:

- Ubuntu 22.04.3 LTS WSL 2

Before you start, ensure you have the following installed:

- Node.js (version 14.x or higher recommended)
- npm (comes with Node.js)

0. Installation of Node.js

- sudo apt update
- curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
- sudo apt install -y nodejs

- node -v (Should return v20.16.0)
- npm -v (Should return 10.8.1)

1. Navigate to the Project Directory
   After cloning the repository from github, you need to navigate into the project directory:

- cd YourRepository/frontend/cits3200-next-app

Replace YourRepository with the name of your cloned repository.

2. Installing Dependencies
   Run the following command to install all the necessary dependencies:

- npm install

3. Running the Development Server
   To start the development server and view the application in your browser:

- npm run dev

This command will start the development server, and you can view your app at http://localhost:3000 (or something similar).

4. Building for Production
   To create an optimized production build:

- npm run build

This command will generate a .next/ directory containing your optimized application. The build is minified, and the filenames include the hashes, making it ready for deployment.

5. Running in Production Mode
   After building the app, you can start the production server with:

- npm start

The application will now run in production mode on http://localhost:3000 (or something similar).

---

## Technologies Used

- Next.js: React framework for server-side rendering and static site generation.
- React: JavaScript library for building user interfaces.
- Node.js: JavaScript runtime environment for executing JavaScript on the server.
- npm: Package managers to install dependencies.

---

Project Structure
Here's a brief overview of the project's structure:

```plaintext
CITS3200-Project/
├── frontend/
│   └── cits3200-next-app/
│       ├── pages/
│       │   ├── api/
│       │   │   └── auth/
│       │   │       └── [...nextauth].js  # NextAuth.js API route for authentication
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.js             # Global layout for the application
│       │   │   ├── page.js               # Root page (renders at `/`)
│       │   │   ├── login/
│       │   │   │   └── page.js           # Login page (renders at `/login`)
│       │   ├── components/               # Reusable UI components
│       │   │   ├── Navbar.js             # Navigation bar component
│       │   ├── styles/                   # Global and component-specific styles
│       ├── public/                       # Static assets (images, fonts, etc.)
│       ├── .env.local                    # Environment variables for local development
│       ├── next.config.js                # Next.js configuration file
│       ├── package.json                  # Dependencies and scripts
└──     └── README.md                     # Project documentation (this file)

---
