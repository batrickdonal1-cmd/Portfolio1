# Personal Portfolio (full-stack)

HTML/CSS/JS frontend + Node.js/Express backend + SQLite database.

## Run locally
    npm install
    npm start          # http://localhost:3000

## Make it yours
Everything personal lives in `data/profile.json` (name, bio, socials, stack, projects, learning list, LeetCode + GitHub usernames).
The database is seeded from it the first time the server starts. To re-seed after editing projects/learning, delete `portfolio.db` and restart.

## API
- GET  /api/profile, /api/projects, /api/learning, /api/leetcode
- POST /api/contact  (saves message to DB)
- POST /api/visit    (visitor counter)
- Admin (needs env var ADMIN_TOKEN, header `x-admin-token`): GET /api/admin/messages, POST/DELETE /api/admin/projects

## Deploy on Render (free)
1. Push this folder to a GitHub repo.
2. Render > New > Web Service > pick the repo.
3. Build command: `npm install`   Start command: `npm start`
4. Add env var `ADMIN_TOKEN` (any secret string).
Note: on the free plan the disk is wiped on redeploy, so contact messages/visit count reset. Add a Render Disk and set `DB_PATH=/data/portfolio.db` to keep them.
