import express from "express";
import Database from "better-sqlite3";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
// SQLite baza
const db = new Database("leona.db");

// Kreiraj tablicu ako ne postoji
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

app.use(express.static("public"));

app.get("/api/lastfm", async (req, res) => {
  const apiKey = process.env.LASTFM_API_KEY;
  const user = process.env.LASTFM_USER;

  const response = await fetch(
    `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${user}&api_key=${apiKey}&format=json`
  );
  const data = await response.json();

  res.json(data);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
