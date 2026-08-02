const CLASSES = ["2-1","2-2","2-3","2-4","2-5","2-6","2-7","2-8"];

function setConnectionStatus(message) {
  document.getElementById("connectionStatus").textContent = message;
}

function progressMarkup(data) {
  if (data.challengeComplete) {
    return `<div class="bonus-completed-bar">Happy 61st National Day!!</div>`;
  }

  const percentage = data.targetPoints > 0
    ? Math.min(100, (data.totalPoints / data.targetPoints) * 100)
    : 0;

  return `
    <div class="bonus-progress-track">
      <div class="bonus-progress-fill" style="width:${percentage}%"></div>
    </div>
  `;
}

function createClassRow(data) {
  const row = document.createElement("div");
  row.className = "bonus-class-row";

  const figurinePoints = Number(data.figurinePoints || 0);
  const overallPoints = Number(data.totalPoints || 0) + figurinePoints;

  row.innerHTML = `
    <div class="bonus-class-name">${data.className}</div>
    <div>${progressMarkup(data)}</div>
    <div class="bonus-total-points">${overallPoints}</div>
    <div class="bonus-controls">
      <button type="button" class="bonus-button bonus-minus"
        data-class="${data.className}" data-change="-8">−8</button>
      <button type="button" class="bonus-button bonus-plus"
        data-class="${data.className}" data-change="8">+8</button>
    </div>
  `;

  row.querySelectorAll(".bonus-button").forEach(button => {
    button.addEventListener("click", () => {
      adjustFigurinePoints(button.dataset.class, Number(button.dataset.change));
    });
  });

  return row;
}

function renderDashboard(results) {
  const list = document.getElementById("bonusClassList");
  list.innerHTML = "";
  results.forEach(data => list.appendChild(createClassRow(data)));
}

async function loadClassStatus(className) {
  const url = `${API_URL}?action=status&className=${encodeURIComponent(className)}&t=${Date.now()}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) throw new Error(`HTTP error ${response.status}`);

  const data = await response.json();
  if (!data.ok) throw new Error(data.message || `Unable to load ${className}.`);

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

async function adjustFigurinePoints(className, change) {
  const verb = change > 0 ? "add 8 points to" : "subtract 8 points from";
  if (!window.confirm(`Confirm: ${verb} Class ${className}?`)) return;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "adjustFigurinePoints",
        className,
        change
      })
    });

    const data = await response.json();
    if (!data.ok) throw new Error(data.message || "Unable to update points.");

    await loadAllClasses();
  } catch (error) {
    console.error(error);
    window.alert(`Unable to update points: ${error.message}`);
  }
}

loadAllClasses();
setInterval(loadAllClasses, REFRESH_MS);
