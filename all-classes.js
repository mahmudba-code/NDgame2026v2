const CLASSES = [
  "2-1",
  "2-2",
  "2-3",
  "2-4",
  "2-5",
  "2-6",
  "2-7",
  "2-8"
];

function setConnectionStatus(message) {
  document.getElementById(
    "connectionStatus"
  ).textContent = message;
}

function createClassCard(data) {
  const card =
    document.createElement("a");

  card.className =
    `simple-class-card ${
      data.challengeComplete
        ? "complete"
        : ""
    }`;

  card.href =
    `display.html?class=${
      encodeURIComponent(
        data.className
      )
    }`;

  card.target = "_blank";
  card.rel = "noopener noreferrer";

  const pointsPercentage =
    data.targetPoints > 0
      ? Math.min(
          100,
          (
            data.totalPoints /
            data.targetPoints
          ) * 100
        )
      : 0;

  card.innerHTML = `
    <div class="simple-class-header">
      <strong class="simple-class-name">
        ${data.className}
      </strong>

      <strong class="simple-class-score">
        ${data.totalPoints}
        /
        ${data.targetPoints}
      </strong>
    </div>

    <div class="progress-track compact">
      <div
        class="progress-bar"
        style="width: ${pointsPercentage}%"
      ></div>
    </div>

    <div class="simple-class-footer">
      ${data.completedStations}
      /
      ${data.requiredStations}
      stations
    </div>
  `;

  return card;
}

function renderDashboard(results) {
  const classGrid =
    document.getElementById(
      "classGrid"
    );

  classGrid.innerHTML = "";

  results.forEach(data => {
    classGrid.appendChild(
      createClassCard(data)
    );
  });
}

async function loadAllClasses() {
  try {
    if (DEMO_MODE) {
      throw new Error(
        "Add the Apps Script URL in config.js before using this dashboard."
      );
    }

    const requests =
      CLASSES.map(className => {
        const url =
          `${API_URL}?action=status` +
          `&className=${encodeURIComponent(
            className
          )}` +
          `&t=${Date.now()}`;

        return fetch(url, {
          method: "GET",
          cache: "no-store"
        }).then(response => {
          if (!response.ok) {
            throw new Error(
              `HTTP error ${response.status}`
            );
          }

          return response.json();
        });
      });

    const results =
      await Promise.all(requests);

    const invalid =
      results.find(data => !data.ok);

    if (invalid) {
      throw new Error(
        invalid.message ||
        "Unable to load class progress."
      );
    }

    renderDashboard(results);

    setConnectionStatus(
      `Updated at ${
        new Date().toLocaleTimeString()
      }.`
    );
  } catch (error) {
    console.error(error);

    setConnectionStatus(
      `Connection problem: ${error.message}`
    );
  }
}

loadAllClasses();

setInterval(
  loadAllClasses,
  REFRESH_MS
);
