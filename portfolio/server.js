const express = require('express');
const path = require('path');
const db = require('./db');
const profile = require('./data/profile.json');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* ---------- read-only content ---------- */
app.get('/api/profile', (req, res) => {
  const { projects, learning, leetcode, ...rest } = profile;
  res.json(rest);
});

app.get('/api/projects', (req, res) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY position, id').all();
  res.json(rows.map(r => ({ ...r, tags: JSON.parse(r.tags) })));
});

app.get('/api/learning', (req, res) => {
  res.json(db.prepare('SELECT * FROM learning ORDER BY position, id').all());
});

/* ---------- LeetCode stats (live if possible, else profile.json) ---------- */
let lcCache = { at: 0, data: null };
app.get('/api/leetcode', async (req, res) => {
  const fallback = { ...profile.leetcode, live: false };
  const user = profile.leetcode.username;
  if (Date.now() - lcCache.at < 60 * 60 * 1000 && lcCache.data) return res.json(lcCache.data);
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' },
      body: JSON.stringify({
        query: `query($u:String!){
          matchedUser(username:$u){ profile{ranking } submitStatsGlobal{ acSubmissionNum{ difficulty count } } }
          allQuestionsCount{ difficulty count }
        }`,
        variables: { u: user }
      })
    });
    clearTimeout(t);
    const j = await r.json();
    const mu = j.data && j.data.matchedUser;
    if (!mu) throw new Error('user not found');
    const ac = Object.fromEntries(mu.submitStatsGlobal.acSubmissionNum.map(x => [x.difficulty, x.count]));
    const all = Object.fromEntries(j.data.allQuestionsCount.map(x => [x.difficulty, x.count]));
    const data = {
      username: user, live: true,
      solved: ac.All, easy: ac.Easy, medium: ac.Medium, hard: ac.Hard,
      totalEasy: all.Easy, totalMedium: all.Medium, totalHard: all.Hard,
      ranking: mu.profile.ranking
    };
    lcCache = { at: Date.now(), data };
    res.json(data);
  } catch (e) {
    res.json(fallback);
  }
});

/* ---------- visitor counter ---------- */
app.post('/api/visit', (req, res) => {
  db.prepare("UPDATE meta SET value = value + 1 WHERE key = 'visits'").run();
  res.json(db.prepare("SELECT value AS visits FROM meta WHERE key = 'visits'").get());
});
app.get('/api/visits', (req, res) => {
  res.json(db.prepare("SELECT value AS visits FROM meta WHERE key = 'visits'").get());
});

/* ---------- contact form ---------- */
const hits = new Map(); // ip -> [timestamps]  (tiny rate limit)
app.post('/api/contact', (req, res) => {
  const ip = req.ip;
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  if (recent.length >= 3) return res.status(429).json({ error: 'Too many messages. Try again in a few minutes.' });

  const { name = '', email = '', message = '', website = '' } = req.body || {};
  if (website) return res.json({ ok: true }); // honeypot for bots
  if (!name.trim() || !email.trim() || !message.trim())
    return res.status(400).json({ error: 'Fill in your name, email and message.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'That email address does not look right.' });
  if (message.length > 2000 || name.length > 100 || email.length > 200)
    return res.status(400).json({ error: 'Message is too long.' });

  db.prepare('INSERT INTO messages (name, email, message) VALUES (?,?,?)')
    .run(name.trim(), email.trim(), message.trim());
  hits.set(ip, [...recent, now]);
  res.status(201).json({ ok: true });
});

/* ---------- admin (set ADMIN_TOKEN env var to enable) ---------- */
const admin = (req, res, next) => {
  if (!ADMIN_TOKEN || req.get('x-admin-token') !== ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
};
app.get('/api/admin/messages', admin, (req, res) => {
  res.json(db.prepare('SELECT * FROM messages ORDER BY id DESC').all());
});
app.post('/api/admin/projects', admin, (req, res) => {
  const { title, description, tags = [], live = '', repo = '' } = req.body || {};
  if (!title || !description) return res.status(400).json({ error: 'title and description required' });
  const pos = db.prepare('SELECT COALESCE(MAX(position),0)+1 AS p FROM projects').get().p;
  const info = db.prepare('INSERT INTO projects (title, description, tags, live, repo, position) VALUES (?,?,?,?,?,?)')
    .run(title, description, JSON.stringify(tags), live, repo, pos);
  res.status(201).json({ id: info.lastInsertRowid });
});
app.delete('/api/admin/projects/:id', admin, (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Portfolio running on http://localhost:${PORT}`));
