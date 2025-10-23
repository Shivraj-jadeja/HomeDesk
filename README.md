
# HomeDesk — Your Personal Command Center (WIP)

> **TL;DR**: HomeDesk is a lightweight, installable web app that turns your projects, tasks, and ideas into a living, draggable knowledge web—with **voice commands**, **smooth physics**, and a **galaxy-inspired UI**. It’s fast, offline-friendly, and designed to feel fun.

![HomeDesk Demo](./assets/demo.gif)

---

## 🚀 Why HomeDesk?

Most dashboards feel like spreadsheets. **HomeDesk** feels like a **map of your brain**:

* **See everything at once**: A dynamic, connected graph of your projects, tasks, notes, and shortcuts.
* **Act fast**: Create, rename, delete, and open nodes with natural **voice commands**.
* **Stay in flow**: **Draggable physics** let you arrange your workspace and it stays put.
* **Bring the vibe**: A minimalist UI with a **galaxy background** that keeps focus without feeling dull.
* **Always there**: Install as a **PWA** and use it offline like a native app.

> Designed as a **workbench for makers**—students, indie devs, engineers, designers—anyone juggling lots of moving parts.

---

## ✨ Core Features (current)

* **Interactive Graph**

  * Drag nodes anywhere; layout persists between interactions.
  * Create relationships (edges) to mirror dependencies or ideas.
* **Voice Control**

  * Natural commands like:
    `add project "Prototype"`, `rename project "Draft" to "Milestone 1"`, `delete project "Old Idea"`
  * Hands-on keyboard? Voice is optional—everything works with mouse/keyboard too.
* **Clean Visuals**

  * Galaxy-style background, subtle motion, readable typography.
* **Installable PWA**

  * Add to desktop/dock; fast startup; offline-friendly behavior.
* **Lightweight Stack**

  * Vanilla JS + a focused graph/visualization lib; no heavy frameworks required.

> **Status:** This project is **Work In Progress**. Expect rapid iteration, breaking changes, and frequent improvements.

---

## 🧠 What Problems It Solves

* **Context overload** → See relationships instead of siloed lists.
* **Friction to start** → Add nodes by voice; arrange by feel.
* **Scattered tools** → Pin links to docs, repos, notes, and apps in one space.

---

## 🏗️ Roadmap (WIP)

* [ ] **Better Persistence**: Stable save/restore of graph state (structure + positions).
* [ ] **Command Palette**: `Ctrl/⌘ + K` to do everything without touching the mouse.
* [ ] **Templates**: Project boilerplates (e.g., sprint board, research tree, class planner).
* [ ] **Node Types**: Task, Note, Link, Goal—with icons and quick actions.
* [ ] **Search & Filter**: Highlight nodes by tag/status/priority.
* [ ] **Import/Export**: JSON backup, shareable snapshots.
* [ ] **Performance**: More nodes, smoother physics.
* [ ] **Accessibility**: Full keyboard navigation + ARIA polish.
* [ ] **Collaboration (stretch)**: Shared boards and presence indicators.

> Have ideas? Open an issue—feedback shapes the roadmap.

---

## 🧩 Tech Overview

* **Web Platform**: HTML, CSS, JavaScript (no heavy framework)
* **Graph/Rendering**: Lightweight visualization library with custom drag physics
* **PWA**: `manifest.json` + service worker for install/offline
* **Voice**: Web Speech API (with graceful fallback)
* **Dev Experience**: Live reload for quick iteration

---

## 🔧 Quick Start

```bash
# 1) Clone
git clone https://github.com/<you>/HomeDesk.git
cd HomeDesk

# 2) Install (only if you use a tiny dev server; otherwise open index.html)
npm install

# 3) Run locally
npm run dev   # or: npx http-server .  (or use your favorite static server)

# 4) Open in browser
# http://localhost:8080  (or whichever port your server shows)
```

> Tip: If you’re using CDN assets, ensure they resolve correctly. For offline dev, consider vendoring critical libs under `/vendor`.

---

## 🎙️ Voice Commands (example set)

* **Create**: `add node "Design Doc"`, `create node "Sprint 1"`
* **Rename**: `rename "Design Doc" to "Design v2"`
* **Delete**: `delete node "Backlog Item"`
* **Link**: `connect "Design v2" to "Sprint 1"`
* **Focus**: `highlight "Sprint 1"`

> Voice is optional—every action is also available via UI.

---

## 🖼️ Screenshots

| Graph View                          | Node Details                            | Installable PWA                 |
| ----------------------------------- | --------------------------------------- | ------------------------------- |
| ![Graph](./assets/screen-graph.png) | ![Details](./assets/screen-details.png) | ![PWA](./assets/screen-pwa.png) |


---

## 🧪 Testing Notes

* Verify drag behavior persists visually and doesn’t auto-center after release.
* Test voice commands in Chrome/Edge; provide text alternatives for other browsers.
* Check PWA install on desktop; confirm offline loads cached assets.

---

## 🧭 Who This Is For

* **Students & Researchers**: Map courses, labs, references, and deadlines.
* **Engineers**: Visualize repos, services, tickets, and dependencies.
* **Indie Makers**: Plan ideas, content calendars, launch checklists, and backlinks.
* **Designers**: Organize briefs, components, flows, and feedback.

---

## 🏢 For Companies & Teams

HomeDesk showcases:

* **Human-centered UX** with playful physics that still respects productivity.
* **Performance-first web engineering**, no bloat.
* **Rapid prototyping** of voice + PWA on the modern web stack.
* **Clear roadmap discipline** and a bias for shipping iteratively.

If you’re exploring **knowledge graphs**, **developer productivity tools**, or **voice-driven UX**, this project is a strong signal of product thinking + engineering execution.

---

## 🤝 Contributing

Contributions are welcome!

1. Open an issue with your proposal/bug.
2. Fork, branch, and PR with a clear description.
3. Keep changes focused; include screenshots/GIFs when UI changes.

---

## 🔒 Privacy & Data

* No cloud sync is enabled by default.
* Voice recognition uses the browser’s speech API (where available).
* Future sync/collab features will be opt-in and documented.

---

## 📜 License

MIT — see [LICENSE](./LICENSE).
Use it, modify it, ship it. Please attribute the original project.

---

## 📬 Contact

**HomeDesk** by *Shivraj Jadeja*
Issues & feature requests → [GitHub Issues](../../issues)
Questions → open an issue or start a discussion

---

> **Work In Progress**: Expect frequent updates. If something feels rough around the edges—it’s because I’m building fast and listening. Your feedback helps shape what ships next.
