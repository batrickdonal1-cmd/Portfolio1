const Database = require('better-sqlite3');
const path = require('path');
const profile = require('./data/profile.json');

const file = process.env.DB_PATH || path.join(__dirname, 'portfolio.db');
const db = new Database(file);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    live TEXT,
    repo TEXT,
    position INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS learning (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    note TEXT,
    progress INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'In progress',
    position INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value INTEGER NOT NULL
  );
`);

// Seed from data/profile.json the first time the database is created.
if (db.prepare('SELECT COUNT(*) AS n FROM projects').get().n === 0) {
  const ins = db.prepare('INSERT INTO projects (title, description, tags, live, repo, position) VALUES (?,?,?,?,?,?)');
  profile.projects.forEach((p, i) => ins.run(p.title, p.description, JSON.stringify(p.tags || []), p.live || '', p.repo || '', i));
}
if (db.prepare('SELECT COUNT(*) AS n FROM learning').get().n === 0) {
  const ins = db.prepare('INSERT INTO learning (title, note, progress, status, position) VALUES (?,?,?,?,?)');
  profile.learning.forEach((l, i) => ins.run(l.title, l.note || '', l.progress || 0, l.status || 'In progress', i));
}
db.prepare("INSERT OR IGNORE INTO meta (key, value) VALUES ('visits', 0)").run();

module.exports = db;
