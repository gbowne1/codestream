# codestream

This is the code for a live streaming platform for programmers currently called DevStream but naming things is hard so this name is a placeholder.

CodeStream (initially named **DevStream**) is a **Full-Stack Web Application** designed as a **live streaming platform specifically for developers**.

This project currently represents a **functional Proof of Concept (PoC)** featuring a complete **Authentication system**, a **modern responsive UI with Dark Mode**, and a **mock streaming API**.

> ⚠️ **Note:** This project is fully open source and aims to be a **unique platform**, not a clone. It is actively under development.

---

## 🎯 Target Audience

CodeStream is built for technical creators and learners, including:

- Game Developers
- Software Developers
- OS Developers
- Web Developers
- Mobile App Developers
- Cybersecurity & Ethical Hacking
- Game Artists & Pixel Artists
- LeetCode & Co‑working Streams
- Tech Talks & Conferences

---

## ✨ Current Features

### ✅ Implemented & Working

- 🔐 **Authentication System**
  Secure Register & Login flow using **JWT** and **Bcrypt**.

- 🎨 **Modern UI**
  Built with **Vanilla JavaScript** and **Bootstrap 5**, including **Dark/Light Mode toggle**.

- 📱 **Responsive Design**
  Mobile‑first layout with a collapsible **Category Drawer**.

- 🔍 **Search & Filter**
  Real‑time client‑side filtering using tags and search terms.

- 📡 **Mock Streaming API**
  Express backend serving simulated stream data from `streams.json`.

---

## 🚧 Roadmap (Upcoming)

- 🔄 **WebSocket Integration** – Replace mock API with real‑time socket connections
- 🎥 **Video Broadcasting** – Implement **WebRTC** for real video streaming
- 👤 **User Profiles** – Upload avatars, update bios, and customize profiles

---

## 🛠️ Tech Stack

### Frontend

- JavaScript (ES6 Modules)
- Bootstrap 5.3
- Vite

### Backend

- Node.js
- Express
- MongoDB (Mongoose)
- JWT Authentication
- Bcrypt Password Hashing

---

## 🚀 Installation & Setup

Detailed developer setup instructions are maintained in the repository docs:

- **Developer setup guide**: `docs/DEVSETUP.md` — contains step-by-step instructions to run the backend, frontend, database, environment variables, linting, and troubleshooting.

---

## 📂 Project Structure

```
├── src/
│   ├── controllers/   # Auth logic (Register/Login)
│   ├── middleware/    # JWT verification & role checks
│   ├── models/        # Mongoose schemas
│   ├── css/           # Global styles & dark mode
│   └── js/            # Frontend DOM logic
├── server.js          # Express API entry point
├── streams.json       # Mock stream data
├── vite.config.js     # Vite configuration
└── package.json       # Scripts & dependencies
```

---

## 🤝 Contributing

Contributions are welcome! 🚀

1. Fork the project
2. Create your branch

```bash
git checkout -b feature/AmazingFeature
```

3. Commit your changes

```bash
git commit -m "Add AmazingFeature"
```

4. Push to GitHub

```bash
git push origin feature/AmazingFeature
```

5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

⭐ If you like this project, give it a star and help grow CodeStream!
