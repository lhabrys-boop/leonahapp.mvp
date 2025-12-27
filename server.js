import express from "express";
import path from "path";
import bodyParser from "body-parser";
import session from "express-session";
import { fileURLToPath } from "url";
import pkg from "pg";

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const start = async () => {
  const app = express();

  let pool = null;

  if (process.env.PGHOST) {
    pool = new Pool({
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: { rejectUnauthorized: false }
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
  }

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(
    session({
      secret: "leonavuk-secret",
      resave: false,
      saveUninitialized: true
    })
  );

  // OVO JE JEDINI STATIC KOJI TI TREBA
  app.use(express.static(path.join(__dirname, "muzika", "public")));

  // Root ruta
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
    const users = {
      leona: "0976106753",
      "vukjenajkul@gmail.com": "vukjenajkul1999"
    };
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

  // Dohvat postova
  app.get("/posts", async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Nisi ulogirana" });
    }

    if (!pool) {
      return res.json([]);
    }

    const result = await pool.query(`
      SELECT id, author, content, created_at
      FROM posts
      ORDER BY id DESC
    `);

    res.json(result.rows);
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

    if (!pool) {
      return res.status(500).json({ error: "Baza nije dostupna lokalno" });
    }

    await pool.query(
      `INSERT INTO posts (author, content, created_at)
       VALUES ($1, $2, $3)`,
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