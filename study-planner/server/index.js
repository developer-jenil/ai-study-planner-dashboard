const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'db.json');

function readDB() {
  try {
    const txt = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(txt || '{}');
  } catch (e) {
    return { tasks: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/tasks', (req, res) => {
  const db = readDB();
  res.json(db.tasks || []);
});

app.post('/api/tasks', (req, res) => {
  const db = readDB();
  const t = req.body || {};
  if (!t.id) t.id = Date.now().toString();
  if (!t.createdAt) t.createdAt = Date.now();
  db.tasks = db.tasks || [];
  db.tasks.unshift(t);
  writeDB(db);
  res.status(201).json(t);
});

app.put('/api/tasks/:id', (req, res) => {
  const id = req.params.id;
  const db = readDB();
  db.tasks = db.tasks || [];
  let found = false;
  db.tasks = db.tasks.map((t) => {
    if (t.id === id) {
      found = true;
      return { ...t, ...req.body };
    }
    return t;
  });
  writeDB(db);
  if (found) res.json(db.tasks.find((t) => t.id === id));
  else res.status(404).json({ error: 'Not found' });
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = req.params.id;
  const db = readDB();
  db.tasks = db.tasks || [];
  db.tasks = db.tasks.filter((t) => t.id !== id);
  writeDB(db);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 5175;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
