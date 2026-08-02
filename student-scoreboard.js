const CLASSES = ["2-1","2-2","2-3","2-4","2-5","2-6","2-7","2-8"];

function setConnectionStatus(message) {
  document.getElementById("connectionStatus").textContent = message;
}

function progressMarkup(data) {
  if (data.challengeComplete) {
    return `<div class="student-completed-bar">Happy 61st National Day!!</div>`;
  }

  const percentage = data.targetPoints > 0
    ? Math.min(100, (data.totalPoints / data.targetPoints) * 100)
    : 0;

  return `
    <div class="student-progress-track">
      <div class="student-progress-fill" style="width:${percentage}%"></div>
    </div>
  `;
}

function createClassRow(data) {
  const row = document.createElement("div");
  row.className = "student-class-row";

  const overallPoints = Number(data.overallPoints || 0);

  row.innerHTML = `
    <div class="student-class-name">${data.className}</div>
    <div>${progressMarkup(data)}</div>
    <div class="student-total-points">${overallPoints}</div>
  `;

  return row;
}

function renderDashboard(results) {
  const list = document.getElementById("studentClassList");
  list.innerHTML = "";
  results.forEach(data => list.appendChild(createClassRow(data)));
}

async function loadClassStatus(className) {
  const url = `${API_URL}?action=status&className=${encodeURIComponent(className)}&t=${Date.now()}`;
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.message || `Unable to load ${className}.`);
  }

  return data;
}

async function loadAllClasses() {
  try {
    const results = await Promise.all(CLASSES.map(loadClassStatus));
    renderDashboard(results);
    setConnectionStatus(`Updated at ${new Date().toLocaleTimeString()}.`);
  } catch (error) {
    console.error(error);
    setConnectionStatus(`Connection problem: ${error.message}`);
  }
}

loadAllClasses();
setInterval(loadAllClasses, REFRESH_MS);
