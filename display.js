let demoStep = 0;

function setConnectionStatus(message) {
  document.getElementById("connectionStatus").textContent = message;
}

function makeDemoStatus(className) {
  const completedIds = DEMO_STATIONS
    .slice(0, demoStep)
    .map(station => station.stationId);

  demoStep = (demoStep + 1) % (DEMO_STATIONS.length + 1);

  const requiredStations = DEMO_STATIONS.length;
  const stationPoints = completedIds.length * 4;

  return {
    ok: true,
    className,
    requiredStations,
    completedStationIds: completedIds,
    completedStations: completedIds.length,
    stationPoints,
    pledgePoint: 0,
    totalPoints: stationPoints,
    targetPoints: requiredStations * 4 + 1,
    challengeComplete: false,
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
  document.getElementById("totalPoints").textContent = data.totalPoints || 0;
  document.getElementById("targetPoints").textContent =
    data.targetPoints || required * 4 + 1;
  document.getElementById("stationPoints").textContent =
    data.stationPoints || 0;
  document.getElementById("pledgePoint").textContent =
    data.pledgePoint || 0;

  const progressPercentage = required > 0
    ? Math.min(100, (achieved / required) * 100)
    : 0;

  document.getElementById("progressBar").style.width =
    `${progressPercentage}%`;

  const pledgeLines = document.getElementById("pledgeLines");
  pledgeLines.innerHTML = "";

  [...data.stations]
    .sort((a, b) => Number(a.pledgeOrder) - Number(b.pledgeOrder))
    .forEach(station => {
      const line = document.createElement("div");
      line.className =
        `pledge-line ${station.complete ? "revealed" : "locked"}`;
      line.textContent = station.complete
        ? station.pledgePhrase
        : "This part of the pledge is still locked.";
      pledgeLines.appendChild(line);
    });

  const stationGrid = document.getElementById("stationGrid");
  stationGrid.innerHTML = "";

  data.stations.forEach(station => {
    const tile = document.createElement("div");
    tile.className =
      `station-tile ${station.complete ? "complete" : ""}`;
    tile.innerHTML = `
      <div class="station-name">
        Station ${station.stationId}: ${station.location}
      </div>
      <div class="station-status">
        ${station.complete ? "Completed · 4 points" : "Not completed"}
      </div>
    `;
    stationGrid.appendChild(tile);
  });

  document
    .getElementById("completionBanner")
    .classList.toggle("hidden", data.challengeComplete !== true);
}

async function loadStatus() {
  const className =
    new URLSearchParams(window.location.search).get("class") ||
    DEFAULT_CLASS;

  try {
    if (DEMO_MODE) {
      renderStatus(makeDemoStatus(className));
      setConnectionStatus(
        "Demo mode. Add the Apps Script URL in config.js to use live data."
      );
      return;
    }

    const url =
      `${API_URL}?action=status` +
      `&className=${encodeURIComponent(className)}` +
      `&t=${Date.now()}`;

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.message || "Unable to load status.");
    }

    renderStatus(data);
    setConnectionStatus(
      `Live data updated at ${new Date().toLocaleTimeString()}.`
    );
  } catch (error) {
    console.error(error);
    setConnectionStatus(`Connection problem: ${error.message}`);
  }
}

loadStatus();
setInterval(loadStatus, REFRESH_MS);
