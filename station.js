const params = new URLSearchParams(location.search);
const stationId = Number(params.get("station"));

function getSavedIdentity() {
  return {
    className: localStorage.getItem("majulahClass") || DEFAULT_CLASS,
    teamName: localStorage.getItem("majulahTeam") || ""
  };
}

function setConnectionStatus(message) {
  document.getElementById("connectionStatus").textContent = message;
}

function showResult(message, success) {
  const box = document.getElementById("resultMessage");
  box.textContent = message;
  box.className = `result-message ${success ? "success" : "error"}`;
}

async function loadStation() {
  const identity = getSavedIdentity();
  document.getElementById("className").value = identity.className;
  document.getElementById("teamName").value = identity.teamName;

  try {
    let station;

    if (DEMO_MODE) {
      station = DEMO_STATIONS.find(item => item.stationId === stationId);
      setConnectionStatus("Demo mode.");
    } else {
      const url = `${API_URL}?action=station&stationId=${encodeURIComponent(stationId)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!data.ok) throw new Error(data.message || "Station not found.");
      station = data.station;
      setConnectionStatus("Station loaded.");
    }

    if (!station) throw new Error("Invalid station number.");

    document.getElementById("stationTitle").textContent =
      `Station ${station.stationId}: ${station.location}`;
    document.getElementById("stationQuestion").textContent = station.question;
  } catch (error) {
    document.getElementById("stationTitle").textContent = "Station unavailable";
    document.getElementById("stationQuestion").textContent = error.message;
  }
}

document.getElementById("stationForm").addEventListener("submit", async event => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const className = String(formData.get("className")).trim();
  const teamName = String(formData.get("teamName")).trim();
  const answer = String(formData.get("answer")).trim();

  localStorage.setItem("majulahClass", className);
  localStorage.setItem("majulahTeam", teamName);

  if (DEMO_MODE) {
    const accepted = DEMO_ANSWERS[stationId] || [];
    const correct = accepted.includes(answer.toLowerCase());

    showResult(
      correct
        ? "Correct. Another part of the pledge has been restored."
        : "Not correct. Check what you can observe at this location and try again.",
      correct
    );
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "submit",
        className,
        teamName,
        stationId,
        answer
      })
    });

    const data = await response.json();
    showResult(data.message, data.correct === true);
  } catch (error) {
    showResult(`Submission failed: ${error.message}`, false);
  }
});

loadStation();
