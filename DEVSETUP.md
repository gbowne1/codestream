# DEVSETUP – Developer Setup Guide

This document explains how to set up and run the **codestream / DevStream** project locally for development.

## Project Structure (Example)

root/
 ├─ client/     # Frontend (Vite)
 ├─ server/     # Backend (Node.js + Express)
 ├─ docs/       # Documentation
 └─ README.md

Folder names may vary based on the repository.

## Prerequisites

Install the following tools:

* Node.js (v18 or later)
  [https://nodejs.org](https://nodejs.org)

* Git
  [https://git-scm.com](https://git-scm.com)

* npm (comes with Node.js)
  [https://www.npmjs.com](https://www.npmjs.com)

* Database (MongoDB / PostgreSQL / MySQL – depending on project)

Verify installation:

bash
node -v
npm -v
git --version

## Clone or Fork the Project

### Clone

bash
git clone <REPOSITORY_URL>
cd <PROJECT_NAME>

### Fork

1. Fork the repository on GitHub.
2. Clone your fork:

bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>

## Install Dependencies

If the project is a monorepo:

bash
npm install

Frontend:

bash
cd client
npm install

Backend:

bash
cd ../server
npm install

## Start Vite (Frontend)

bash
cd client
npm run dev

Default URL:

http://localhost:5173

Vite documentation:
[https://vitejs.dev](https://vitejs.dev)

## Start the Server (Backend)

bash
cd server
npm run dev

or

bash
npm start

Default API URL:

http://localhost:3000

Node.js documentation:
[https://nodejs.org/docs](https://nodejs.org/docs)

Express documentation:
[https://expressjs.com](https://expressjs.com)

## Start the Database

Start the database service based on what your project uses.

### MongoDB Example

bash
mongod

Connection example:

mongodb://localhost:27017/devstream

MongoDB docs:
[https://www.mongodb.com/docs](https://www.mongodb.com/docs)

### PostgreSQL Example

bash
sudo service postgresql start

PostgreSQL docs:
[https://www.postgresql.org/docs](https://www.postgresql.org/docs)


## Environment Variables

Create `.env` files if required.

### server/.env

PORT=3000
DATABASE_URL=your_database_url

### client/.env

VITE_API_BASE_URL=http://localhost:3000

Restart services after changes.

## Start All Services

1. Start database
2. Start backend

bash
cd server
npm run dev

3. Start frontend

bash
cd client
npm run dev


Open in browser:

http://localhost:5173

## API

Base URL:

http://localhost:3000/api

Check routes inside `server/routes`.

API tools:

* Postman → [https://www.postman.com](https://www.postman.com)
* Insomnia → [https://insomnia.rest](https://insomnia.rest)

## Linting

Run lint:

bash
npm run lint

Fix issues:

bash
npm run lint:fix

ESLint docs:
[https://eslint.org](https://eslint.org)

## Formatting

Format code:

bash
npm run format

Prettier docs:
[https://prettier.io](https://prettier.io)

## UI Libraries

* Bootstrap
  [https://getbootstrap.com](https://getbootstrap.com)

* Font Awesome
  [https://fontawesome.com](https://fontawesome.com)

* Vite
  [https://vitejs.dev](https://vitejs.dev)

## Common Problems

### Port Already in Use

bash
npx kill-port 3000

### Dependency Errors

bash
rm -rf node_modules package-lock.json
npm install

## Useful Links

* Git → [https://git-scm.com](https://git-scm.com)
* Node.js → [https://nodejs.org](https://nodejs.org)
* Express → [https://expressjs.com](https://expressjs.com)
* Vite → [https://vitejs.dev](https://vitejs.dev)
* Bootstrap → [https://getbootstrap.com](https://getbootstrap.com)
* Font Awesome → [https://fontawesome.com](https://fontawesome.com)
* ESLint → [https://eslint.org](https://eslint.org)
* Prettier → [https://prettier.io](https://prettier.io)
