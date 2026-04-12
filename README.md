# ██╗   ██╗███████╗ ██████╗ ███████╗    ███████╗ ██████╗  ██████╗ ████████╗
# ██║   ██║██╔════╝██╔═══██╗██╔══██╗    ██╔════╝██╔═══██╗██╔═══██╗╚══██╔══╝
# ██║   ██║█████╗  ██║   ██║██████╔╝    █████╗  ██║   ██║██║   ██║   ██║   
# ██║   ██║██╔══╝  ██║   ██║██╔══██╗    ██╔══╝  ██║   ██║██║   ██║   ██║   
# ╚██████╔╝███████╗╚██████╔╝██║  ██║    ███████╗╚██████╔╝╚██████╔╝   ██║   
#  ╚════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═╝    ╚══════╝ ╚═════╝  ╚═════╝    ╚═╝   
#                                                                     
#                    ███████╗███████╗ ███╗   ███╗ █████╗  ██████╗ ███████╗
#                    ██╔════╝██╔════╝ ████╗ ████║██╔══██╗██╔════╝ ██╔════╝
#                    █████╗  ███████╗ ██╔██╗ ██╔╝██║  ███╗╚██████╗ █████╗  
#                    ██╔══╝  ╚════██║ ██║╚██╗██║██║   ██║ ╚═══██║ ██╔══╝  
#                    ███████╗███████╗ ╚███╔███╔╝ ╚██████╔╝ ██████╗ ███████╗
#                    ╚══════╝ ╚══════╝  ╚══╝══╩═╝  ╚═════╝  ╚═════╝ ╚══════╝
#

**CodeBlend** — A real-time collaborative code editor for teams, interviews, and pair programming.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ██████╗  ██████╗  █████╗ ██████╗  █████╗ ██████╗  █████╗ ██████╗  │
│ ██╔════╝ ██╔═══██╗██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔══██╗ │
│ ██║     ██║   ██║███████║██║  ██║██║  ██║██║  ██║███████║██║  ██║ │
│ ██║     ██║   ██║██╔══██║██║  ██║██║  ██║██║  ██║██╔══██║██║  ██║ │
│ ╚██████╗╚██████╔╝██║  ██║██████╔╝╚██████╔╝██████╔╝██║  ██║██████╔╝ │
│  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ │
└────────────────────────────────────────────────────────────────��────────────┘
```

## 🚀 Features

- **Real-Time Collaboration** — See cursors, edits, and typing indicators live
- **Room-Based Sessions** — Create/join rooms with shareable IDs
- **File Explorer** — MongoDB-backed file tree with folders & files
- **10+ Language Support** — JS, Python, HTML, CSS, Java, C++, Rust, Go, Markdown, Shell
- **User Authentication** — Sign up/login with JWT tokens
- **Platform Themes** — Dark, Light, Ocean, Forest, Sunset, Lavender
- **Editor Themes** — Dracula, Monokai, Material Ocean, Neat, Elegant
- **Code Persistence** — LocalStorage auto-save (24 hours)
- **Mobile Responsive** — Works on desktop & mobile
- **Keyboard Shortcuts** — Enter to open, Delete to remove, Cmd+N for new file
- **Drag & Drop** — Move files/folders across directories
- **Right-Click Menu** — VS Code style context menu

## 🛠️ Quick Start

```bash
# Install dependencies
npm install

# Start frontend (port 3000)
npm start

# Start backend (port 5000) - new terminal
npm run server:dev
```

Open **http://localhost:3000**

### MongoDB Setup (optional for file storage)

```bash
# Create .env.local with:
MONGODB_URI=mongodb://localhost:27017/codeblend
```

Restart the server.

## 🎯 Usage

| Use Case | Description |
|---------|------------|
| **Technical Interviews** | Share room ID, watch candidate code in real-time |
| **Pair Programming** | Collaborate with live cursor tracking |
| **Code Reviews** | Instant feedback with multiple editors |
| **Teaching/Mentoring** | Show code, students follow along |

## 📁 Project Structure

```
CodeBlend/
├── server/
│   ├── db.js           # MongoDB connection
│   ├── models/        # User, FsNode schemas
│   └── routes/       # Auth, FileSystem APIs
├── src/
│   ├── api/          # Frontend API calls
│   ├── components/    # Editor, FileExplorer
│   ├── context/     # Theme provider
│   ├── hooks/       # Socket, persistence
│   └── pages/       # Home, EditorPage
└── build/          # Production build
```

## 🤝 Contributing

```bash
# Fork & clone
git clone https://github.com/Hitesh103/CodeBlend.git
cd CodeBlend

# Create branch
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "feat: description"

# Push & PR
git push origin feature/my-feature
```

## 📜 License

MIT — Happy Coding 💜