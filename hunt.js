function getSavedIdentity() {
  return {
    className:
      localStorage.getItem("majulahClass") ||
      DEFAULT_CLASS,

teamName:
  localStorage.getItem("majulahTeam") ||
  "Integrity and Care"
  };
}


function updateLiveDisplayLink(className) {
  const link =
    document.getElementById("liveDisplayLink");

  if (!link) return;

  link.href =
    `display.html?class=${encodeURIComponent(className)}`;
}


function initialiseIdentityFields() {
  const identity = getSavedIdentity();

  document.getElementById("classInput").value =
    identity.className;

  document.getElementById("teamInput").value =
    identity.teamName;

  updateLiveDisplayLink(identity.className);
}


function saveIdentity() {
  const className =
    document.getElementById("classInput").value;

  const teamName =
    document.getElementById("teamInput").value;

  localStorage.setItem(
    "majulahClass",
    className
  );

  localStorage.setItem(
    "majulahTeam",
    teamName
  );

  updateLiveDisplayLink(className);

  loadDashboard();
}


function setConnectionStatus(message) {
  document.getElementById(
    "connectionStatus"
  ).textContent = message;
}


function renderDashboard(data) {
  const completed =
    data.completedStationIds || [];

  const required =
    data.requiredStations ||
    data.stations.length;

  const achieved =
    Math.min(completed.length, required);

  document.getElementById(
    "completedCount"
  ).textContent = achieved;

  document.getElementById(
    "requiredCount"
  ).textContent = required;

  const progressPercentage =
    required > 0
      ? Math.min(
          100,
          (achieved / required) * 100
        )
      : 0;

  document.getElementById(
    "progressBar"
  ).style.width = `${progressPercentage}%`;

  const clueGrid =
    document.getElementById("clueGrid");

  clueGrid.innerHTML = "";

  data.stations.forEach(station => {
    const card =
      document.createElement("article");

    card.className =
      `clue-card ${
        station.complete ? "complete" : ""
      }`;

    card.innerHTML = `
      <div class="clue-number">
        Clue ${station.stationId}
      </div>

      <div class="clue-text">
        ${station.clue}
      </div>

      <div class="find-place">
        ${
          station.complete
            ? "Completed"
            : "Find this place"
        }
      </div>
    `;

    clueGrid.appendChild(card);
  });
}


async function loadDashboard() {
  const identity = getSavedIdentity();

  try {
    if (DEMO_MODE) {
      renderDashboard({
        className: identity.className,
        requiredStations: 3,
        completedStationIds: [],
        stations: DEMO_STATIONS.map(
          station => ({
            ...station,
            complete: false
          })
        )
      });

      setConnectionStatus(
        "Demo mode. The clues are loaded from the built-in sample."
      );

      return;
    }

    const url =
      `${API_URL}?action=status` +
      `&className=${encodeURIComponent(
        identity.className
      )}` +
      `&t=${Date.now()}`;

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error ${response.status}`
      );
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(
        data.message ||
        "Unable to load clues."
      );
    }

    renderDashboard(data);

    setConnectionStatus(
      `Class ${identity.className} updated at ` +
      `${new Date().toLocaleTimeString()}.`
    );

  } catch (error) {
    console.error(error);

    setConnectionStatus(
      `Connection problem: ${error.message}`
    );
  }
}


document
  .getElementById("saveIdentity")
  .addEventListener(
    "click",
    saveIdentity
  );


initialiseIdentityFields();
loadDashboard();

setInterval(
  loadDashboard,
  REFRESH_MS
);
