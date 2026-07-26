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
    document.createElement("article");

  card.className =
    `class-progress-card ${
      data.challengeComplete
        ? "complete"
        : ""
    }`;

  const stationPercentage =
    data.requiredStations > 0
      ? Math.min(
          100,
          (
            data.completedStations /
            data.requiredStations
          ) * 100
        )
      : 0;

  card.innerHTML = `
    <div class="class-card-header">
      <div>
        <span class="small-label">
          Class
        </span>

        <strong class="class-name">
          ${data.className}
        </strong>
      </div>

      <span class="class-status">
        ${
          data.challengeComplete
            ? "Challenge completed"
            : "In progress"
        }
      </span>
    </div>

    <div class="class-score">
      ${data.totalPoints}
      /
      ${data.targetPoints}
      points
    </div>

    <div class="progress-track compact">
      <div
        class="progress-bar"
        style="width: ${stationPercentage}%"
      ></div>
    </div>

    <div class="class-metrics">
      <span>
        Stations:
        <strong>
          ${data.completedStations}
          /
          ${data.requiredStations}
        </strong>
      </span>

      <span>
        Station points:
        <strong>
          ${data.stationPoints}
        </strong>
      </span>

      <span>
        Pledge point:
        <strong>
          ${data.pledgePoint}
        </strong>
      </span>
    </div>

    <a
      class="text-link"
      href="display.html?class=${encodeURIComponent(
        data.className
      )}"
      target="_blank"
      rel="noopener noreferrer"
    >
      Open class display
    </a>
  `;

  return card;
}

function renderDashboard(results) {
  const classGrid =
    document.getElementById(
      "classGrid"
    );

  classGrid.innerHTML = "";

  let overallCompleted = 0;
  let overallTarget = 0;
  let classesCompleted = 0;

  results.forEach(data => {
    overallCompleted +=
      Math.min(
        data.completedStations,
        data.requiredStations
      );

    overallTarget +=
      data.requiredStations;

    if (data.challengeComplete) {
      classesCompleted += 1;
    }

    classGrid.appendChild(
      createClassCard(data)
    );
  });

  document.getElementById(
    "overallCompleted"
  ).textContent =
    overallCompleted;

  document.getElementById(
    "overallTarget"
  ).textContent =
    overallTarget;

  document.getElementById(
    "classesCompleted"
  ).textContent =
    classesCompleted;

  document.getElementById(
    "classCount"
  ).textContent =
    results.length;

  const overallPercentage =
    overallTarget > 0
      ? Math.min(
          100,
          (
            overallCompleted /
            overallTarget
          ) * 100
        )
      : 0;

  document.getElementById(
    "overallProgressBar"
  ).style.width =
    `${overallPercentage}%`;
}

async function loadAllClasses() {
  try {
    if (DEMO_MODE) {
      throw new Error(
        "Add the Apps Script URL in config.js before using the all-class dashboard."
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
        })
          .then(response => {
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
      `Live data updated at ${
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
