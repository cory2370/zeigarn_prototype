# Zeigarn

> Eliminate procrastination. Stay focused.

A lightweight, student-focused productivity app that combines structured daily goal-setting with a built-in Pomodoro timer and streak tracking — all in a single HTML/CSS/JS file with no dependencies or backend required.

---

## Features

- **Daily Goal Setup** — Set one major goal, up to N tasks, and recurring maintenance items each day
- **Checklist View** — Check off tasks and maintenance items as you complete them
- **Streak Tracking** — Earn streak points for completing all items; lose your streak if you miss your goal window
- **Congratulations Modal** — Motivational popup with a random message when you finish everything
- **Pomodoro Timer** — Built-in focus timer with configurable work/short break/long break cycles
- **Persistent State** — Goals, checks, and streaks are saved to `localStorage` and restored on reload
- **Multi-day Goals** — Set a goal to span 1–7 days; streak increments by the number of days on completion

---

## Getting Started

No build step required. Just open `index.html` in any modern browser.

```bash
git clone https://github.com/your-username/zeigarn_prototype.git
cd zeigarn_prototype
open index.html   # or double-click it
```

---

## Usage

### 1. Set your focus
Fill in:
- **Major goal** — the one thing that matters most today
- **Tasks** — 2 or more actionable steps (add/remove as needed)
- **Maintenance** — recurring habits or non-negotiables (e.g. exercise, review notes)
- **Days to complete** — how many days this goal spans (1–7)

Click **Save & start** to begin.

### 2. Work through your checklist
Check off tasks and maintenance items as you complete them. The **Start new goal** button appears only once everything is done.

### 3. Use the Pomodoro timer
- **Focus** — 25 minutes
- **Short break** — 5 minutes
- **Long break** — 15 minutes (every 3 cycles)

Start, pause, or reset at any time independently of your checklist.

### 4. Track your streak
Your streak grows by the number of days set for each completed goal. If you miss the deadline without completing your goal, your streak resets to 0.

---

## Project Structure

```
zeigarn_prototype/
├── index.html   # App shell and markup
├── style.css    # Dark theme styles
├── script.js    # All app logic (vanilla JS, IIFE)
└── README.md
```

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, no framework) |
| Logic | Vanilla JavaScript (ES5-compatible IIFE) |
| Fonts | DM Sans via Google Fonts |
| Storage | `localStorage` |

No frameworks. No build tools. No network requests.

---

## Local Storage Keys

| Key | Description |
|-----|-------------|
| `zeigarn_goals` | Serialized goal object for the current session |
| `zeigarn_checks` | Map of completed checkbox states |
| `zeigarn_date` | Date string used to validate session freshness |
| `zeigarn_streak` | Current streak count |
| `zeigarn_streak_date` | Date of last streak increment (prevents double-counting) |

---

## License

MIT © 2026 Ngo Quang Tung
