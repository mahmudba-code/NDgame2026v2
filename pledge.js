const params = new URLSearchParams(window.location.search);
const className = params.get("class");

const resultBox = document.getElementById("pledgeResult");
const message = document.getElementById("pledgeMessage");
const displayLink = document.getElementById("displayLink");

function showResult(text, success) {
  resultBox.textContent = text;
  resultBox.className =
    `result-message ${success ? "success" : "error"}`;
}

async function awardPledgePoint() {
  if (!className) {
    message.textContent = "No class was selected.";
    showResult(
      "This QR code does not contain a valid class.",
      false
    );
    return;
  }

  displayLink.href =
    `display.html?class=${encodeURIComponent(className)}`;

  message.textContent =
    `Final pledge point for Class ${className}`;

  if (DEMO_MODE) {
    showResult(
      "Demo mode. Add the Apps Script URL in config.js before using the final QR code.",
      false
    );
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "awardPledge",
        className
      })
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(
        data.message || "Unable to award the pledge point."
      );
    }

    showResult(data.message, true);
  } catch (error) {
    console.error(error);
    showResult(
      `Unable to award the point: ${error.message}`,
      false
    );
  }
}

awardPledgePoint();
