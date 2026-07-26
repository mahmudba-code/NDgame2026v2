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
    "class-progress-row";

  row.href =
    `display.html?class=${encodeURIComponent(
      data.className
    )}`;

  row.target = "_blank";
  row.rel = "noopener noreferrer";

  const percentage =
    data.targetPoints > 0
      ? Math.min(
          100,
          (data.totalPoints /
            data.targetPoints) * 100
        )
      : 0;

  const rightSide =
    data.challengeComplete
      ? `
        <div class="class-completed-bar">
          Happy 61st National Day!!
        </div>
      `
      : `
        <div class="class-progress-track">
          <div
            class="class-progress-fill"
            style="width: ${percentage}%"
          ></div>
        </div>
      `;

  row.innerHTML = `
    <div class="class-progress-number">
      ${data.className}
    </div>

    ${rightSide}
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
        "Add the Apps Script URL in config.js."
      );
    }

    const results =
      await Promise.all(
        CLASSES.map(async className => {
          const url =
            `${API_URL}?action=status` +
            `&className=${encodeURIComponent(
              className
            )}` +
            `&t=${Date.now()}`;

          const response =
            await fetch(url, {
              cache: "no-store"
            });

          if (!response.ok) {
            throw new Error(
              `HTTP error ${response.status}`
            );
          }

          return response.json();
        })
      );

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
