function getSavedIdentity() {
  return {
    className: localStorage.getItem("majulahClass") || DEFAULT_CLASS,
    teamName: localStorage.getItem("majulahTeam") || "Red"
  };
}

function saveIdentity() {
  localStorage.setItem("majulahClass", document.getElementById("classInput").value.trim());
  localStorage.setItem("majulahTeam", document.getElementById("teamInput").value);
  loadDashboard();
}

function setConnectionStatus(message) {
  document.getElementById("connectionStatus").textContent = message;
}

function renderDashboard(data) {
  const completed = data.completedStationIds || [];
  const required = data.requiredStations || data.stations.length;
  const achieved = Math.min(completed.length, required);

  document.getElementById("completedCount").textContent = achieved;
  document.getElementById("requiredCount").textContent = required;
  document.getElementById("progressBar").style.width =
    `${Math.min(100, (achieved / required) * 100)}%`;

  const clueGrid = document.getElementById("clueGrid");
  clueGrid.innerHTML = "";

  data.stations.forEach(station => {
    const card = document.createElement("article");
    card.className = `clue-card ${station.complete ? "complete" : ""}`;
    card.innerHTML = `
      <div class="clue-number">Clue ${station.stationId}</div>
      <h3>${station.complete ? "Completed" : "Find this place"}</h3>
      <p>${station.clue}</p>
      <span class="station-status">${station.complete ? "This station already counts for your class." : "Scan the QR code at the location."}</span>
    `;
    clueGrid.appendChild(card);
  });
}

async function loadDashboard() {
  const identity = getSavedIdentity();
  document.getElementById("classInput").value = identity.className;
  document.getElementById("teamInput").value = identity.teamName;

  try {
    if (DEMO_MODE) {
      renderDashboard({
        className: identity.className,
        requiredStations: 3,
        completedStationIds: [],
        stations: DEMO_STATIONS.map(station => ({ ...station, complete: false }))
      });
      setConnectionStatus("Demo mode. The clues are loaded from the built-in sample.");
      return;
    }

    const url = `${API_URL}?action=status&className=${encodeURIComponent(identity.className)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.ok) throw new Error(data.message || "Unable to load clues.");

    renderDashboard(data);
    setConnectionStatus(`Updated at ${new Date().toLocaleTimeString()}.`);
  } catch (error) {
    setConnectionStatus(`Connection problem: ${error.message}`);
  }
}

document.getElementById("saveIdentity").addEventListener("click", saveIdentity);
loadDashboard();
setInterval(loadDashboard, REFRESH_MS);
