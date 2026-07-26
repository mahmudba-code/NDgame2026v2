let demoStep = 0;
let timerSeconds = 30 * 60;

function setConnectionStatus(message) {
  document.getElementById("connectionStatus").textContent = message;
}

function makeDemoStatus(className) {
  const completedIds = DEMO_STATIONS.slice(0, demoStep).map(s => s.stationId);
  demoStep = (demoStep + 1) % (DEMO_STATIONS.length + 1);

  return {
    ok: true,
    className,
    requiredStations: 3,
    completedStationIds: completedIds,
    stations: DEMO_STATIONS.map(station => ({
      ...station,
      complete: completedIds.includes(station.stationId)
    }))
  };
}

function renderStatus(data) {
  const completed = data.completedStationIds || [];
  const required = data.requiredStations || data.stations.length;
  const achieved = Math.min(completed.length, required);

  document.getElementById("className").textContent = data.className;
  document.getElementById("completedCount").textContent = achieved;
  document.getElementById("requiredCount").textContent = required;
  document.getElementById("progressBar").style.width =
    `${Math.min(100, (achieved / required) * 100)}%`;

  const pledgeLines = document.getElementById("pledgeLines");
  pledgeLines.innerHTML = "";

  [...data.stations]
    .sort((a, b) => Number(a.pledgeOrder) - Number(b.pledgeOrder))
    .forEach(station => {
      const line = document.createElement("div");
      line.className = `pledge-line ${station.complete ? "revealed" : "locked"}`;
      line.textContent = station.complete
        ? station.pledgePhrase
        : "This part of the pledge is still locked.";
      pledgeLines.appendChild(line);
    });

  const stationGrid = document.getElementById("stationGrid");
  stationGrid.innerHTML = "";

  data.stations.forEach(station => {
    const tile = document.createElement("div");
    tile.className = `station-tile ${station.complete ? "complete" : ""}`;
    tile.innerHTML = `
      <div class="station-name">Station ${station.stationId}: ${station.location}</div>
      <div class="station-status">${station.complete ? "Completed" : "Not completed"}</div>
    `;
    stationGrid.appendChild(tile);
  });

  document.getElementById("completionBanner")
    .classList.toggle("hidden", completed.length < required);
}

async function loadStatus() {
  const className = new URLSearchParams(location.search).get("class") || DEFAULT_CLASS;

  try {
    if (DEMO_MODE) {
      renderStatus(makeDemoStatus(className));
      setConnectionStatus("Demo mode. Add the Apps Script URL in config.js to use live data.");
      return;
    }

    const url = `${API_URL}?action=status&className=${encodeURIComponent(className)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.ok) throw new Error(data.message || "Unable to load status.");

    renderStatus(data);
    setConnectionStatus(`Live data updated at ${new Date().toLocaleTimeString()}.`);
  } catch (error) {
    setConnectionStatus(`Connection problem: ${error.message}`);
  }
}

function updateTimer() {
  const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const seconds = String(timerSeconds % 60).padStart(2, "0");
  document.getElementById("timer").textContent = `${minutes}:${seconds}`;
  if (timerSeconds > 0) timerSeconds -= 1;
}

loadStatus();
updateTimer();
setInterval(loadStatus, REFRESH_MS);
setInterval(updateTimer, 1000);
