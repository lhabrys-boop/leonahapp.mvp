async function loadTracks() {
  const res = await fetch("/api/lastfm");
  const data = await res.json();

  const tracks = data.recenttracks.track;

  // Zadnjih 20 pjesama
  const recent = document.getElementById("recent");
  recent.innerHTML = "";
  tracks.slice(0, 20).forEach(t => {
    const li = document.createElement("li");
    li.textContent = `${t.artist["#text"]} — ${t.name}`;
    recent.appendChild(li);
  });

  // Trenutno svira
  const now = document.getElementById("now");
  const current = tracks.find(t => t["@attr"] && t["@attr"].nowplaying);
  now.textContent = current
    ? `${current.artist["#text"]} — ${current.name}`
    : "Ništa trenutno ne svira.";
}

loadTracks();