import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import bodyParser from "body-parser";
import session from "express-session";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

dotenv.config();

// ESM __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------
// STATIC FILES
// ----------------------
app.use(express.static(path.join(__dirname, "muzika", "public")));
app.use("/static", express.static(path.join(__dirname, "static")));
app.use("/muzika", express.static(path.join(__dirname, "muzika")));

// ----------------------
// LAST.FM API
// ----------------------
app.get("/api/lastfm", async (req, res) => {
  const apiKey = process.env.LASTFM_API_KEY;
  const user = process.env.LASTFM_USER;

  const response = await fetch(
    `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${user}&api_key=${apiKey}&format=json`
  );
  const data = await response.json();

  res.json(data);
});

// ----------------------
// SQLITE BAZA
// ----------------------
const db = new Database("leona.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

// ----------------------
// MIDDLEWARE
// ----------------------
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "leonavuk-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// ----------------------
// ROOT ROUTE (L stranica)
// ----------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "muzika", "public", "index.html"));
});

// ----------------------
// LOGIN
// ----------------------
const users = {
  leona: "0976106753",
  "vukjenajkul@gmail.com": "vukjenajkul1999",
};

app.get("/leonavuk", (req, res) => {
  res.sendFile(path.join(__dirname, "leonavuk.html"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (users[username] && users[username] === password) {
    req.session.user = username;
    res.redirect("/feed");
  } else {
    res.send("Krivi podaci!");
  }
});

// ----------------------
// FEED
// ----------------------
app.get("/feed", (req, res) => {
  if (!req.session.user) return res.redirect("/leonavuk");

  res.sendFile(path.join(__dirname, "feed.html"));
});

// ----------------------
// POSTS API
// ----------------------
app.get("/posts", (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ error: "Nisi ulogirana" });

  const stmt = db.prepare(`
    SELECT id, author, content, created_at
    FROM posts
    ORDER BY id DESC
  `);

  res.json(stmt.all());
});

app.post("/post", (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ error: "Nisi ulogirana" });

  const { content } = req.body;

  if (!content || content.trim() === "")
    return res.status(400).json({ error: "Prazan post" });

  const stmt = db.prepare(`
    INSERT INTO posts (author, content, created_at)
    VALUES (?, ?, ?)
  `);

  stmt.run(req.session.user, content.trim(), new Date().toISOString());

  res.json({ ok: true });
});

// ----------------------
// LOGOUT
// ----------------------
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/leonavuk");
  });
});

// ----------------------
// START SERVER
// ----------------------
app.listen(PORT, () => {
  console.log(`Server radi na portu ${PORT}`);
});