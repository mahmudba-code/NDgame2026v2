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

function createClassRow(data) {
  const row =
    document.createElement("a");

  row.className =
    `progress-row ${
      data.challengeComplete
        ? "complete"
        : ""
    }`;

  row.href =
    `display.html?class=${
      encodeURIComponent(
        data.className
      )
    }`;

  row.target = "_blank";
  row.rel = "noopener noreferrer";

  const progressPercentage =
    data.targetPoints > 0
      ? Math.min(
          100,
          (
            data.totalPoints /
            data.targetPoints
          ) * 100
        )
      : 0;

  const progressContent =
    data.challengeComplete
      ? `
        <div class="completed-message">
          Happy 61st National Day!
        </div>
      `
      : `
        <div class="progress-track large">
          <div
            class="progress-bar"
            style="width: ${progressPercentage}%"
          ></div>
        </div>
      `;

  row.innerHTML = `
    <div class="progress-class">
      ${data.className}
    </div>

    ${progressContent}
  `;

  return row;
}

function renderDashboard(results) {
  const classGrid =
    document.getElementById(
      "classGrid"
    );

  classGrid.innerHTML = "";

  results.forEach(data => {
    classGrid.appendChild(
      createClassRow(data)
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
