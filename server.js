import express from "express";
import path from "path";
import bodyParser from "body-parser";
import session from "express-session";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const start = async () => {
  const app = express();

  // Otvaranje SQLite baze (async)
  const db = await open({
    filename: "leona.db",
    driver: sqlite3.Database
  });

  // Kreiranje tablice ako ne postoji
  await db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Middleware
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.json());

  // Session middleware
  app.use(
    session({
      secret: "leonavuk-secret",
      resave: false,
      saveUninitialized: true
    })
  );

  // Statički fajlovi
  app.use(express.static(__dirname));
  app.use("/static", express.static(path.join(__dirname, "static")));
  app.use("/muzika", express.static(path.join(__dirname, "muzika")));

  // Hardkodirani korisnici
  const users = {
    leona: "0976106753",
    "vukjenajkul@gmail.com": "vukjenajkul1999"
  };

  // Ulazna stranica (L)
  app.use(express.static(path.join(__dirname, "muzika", "public")));

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "muzika", "public", "index.html"));
  });

  // Login stranica
  app.get("/leonavuk", (req, res) => {
    res.sendFile(path.join(__dirname, "leonavuk.html"));
  });

  // Login provjera
  app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
      req.session.user = username;
      res.redirect("/feed");
    } else {
      res.send("Krivi podaci!");
    }
  });

  // Feed stranica
  app.get("/feed", (req, res) => {
    if (!req.session.user) {
      return res.redirect("/leonavuk");
    }
    res.sendFile(path.join(__dirname, "feed.html"));
  });

  // Dohvat svih postova
  app.get("/posts", async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Nisi ulogirana" });
    }

    const posts = await db.all(`
      SELECT id, author, content, created_at
      FROM posts
      ORDER BY id DESC
    `);

    res.json(posts);
  });

  // Dodavanje posta
  app.post("/post", async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Nisi ulogirana" });
    }

    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Prazan post" });
    }

    await db.run(
      `INSERT INTO posts (author, content, created_at)
       VALUES (?, ?, ?)`,
      [req.session.user, content.trim(), new Date().toISOString()]
    );

    res.json({ ok: true });
  });

  // Logout
  app.get("/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/leonavuk");
    });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server radi na portu ${PORT}`);
  });
};

start();