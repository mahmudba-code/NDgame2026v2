const SHEET_STATIONS = "Stations";
const SHEET_RESPONSES = "Responses";
const SHEET_CLASSES = "Classes";

function doGet(e) {
  try {
    const action = String(e.parameter.action || "");

    if (action === "status") {
      return jsonResponse_(
        getClassStatus_(String(e.parameter.className || "2-1"))
      );
    }

    if (action === "station") {
      return jsonResponse_(
        getStation_(Number(e.parameter.stationId))
      );
    }

    return jsonResponse_({
      ok: true,
      message: "Majulah Hunt API is running."
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      message: error.message
    });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");

    if (payload.action === "submit") {
      return jsonResponse_(handleSubmission_(payload));
    }

    if (payload.action === "awardPledge") {
      return jsonResponse_(
        awardPledgePoint_(cleanText_(payload.className))
      );
    }

    throw new Error("Invalid submission action.");
  } catch (error) {
    return jsonResponse_({
      ok: false,
      correct: false,
      message: error.message
    });
  }
}

function getStation_(stationId) {
  const stations = readStations_();
  const station = stations.find(item => item.stationId === stationId);

  if (!station) {
    return { ok: false, message: "Station not found." };
  }

  return {
    ok: true,
    station: publicStation_(station)
  };
}

function getClassStatus_(className) {
  const cleanClassName = cleanText_(className);
  const stations = readStations_().filter(item => item.active);
  const requiredStations = getRequiredStations_(cleanClassName);
  const completedStationIds = getCompletedStationIds_(cleanClassName);
  const completedStations = completedStationIds.length;
  const stationPoints = Math.min(completedStations, requiredStations) * 4;
  const pledgePoint = getPledgePoint_(cleanClassName);
  const totalPoints = stationPoints + pledgePoint;
  const targetPoints = requiredStations * 4 + 1;
  const challengeComplete =
    completedStations >= requiredStations && pledgePoint === 1;

  return {
    ok: true,
    className: cleanClassName,
    requiredStations,
    completedStationIds,
    completedStations,
    stationPoints,
    pledgePoint,
    totalPoints,
    targetPoints,
    challengeComplete,
    stations: stations.map(station => ({
      ...publicStation_(station),
      complete: completedStationIds.includes(station.stationId)
    }))
  };
}

function handleSubmission_(payload) {
  const className = cleanText_(payload.className);
  const teamName = cleanText_(payload.teamName);
  const stationId = Number(payload.stationId);
  const submittedAnswer = normaliseAnswer_(payload.answer);

  if (!className || !teamName || !stationId || !submittedAnswer) {
    throw new Error("Class, team, station and answer are required.");
  }

  const stations = readStations_();
  const station = stations.find(
    item => item.stationId === stationId && item.active
  );

  if (!station) {
    throw new Error("This station is not active.");
  }

  const acceptedAnswers = station.acceptedAnswers
    .split("|")
    .map(normaliseAnswer_)
    .filter(Boolean);

  const isCorrect = acceptedAnswers.includes(submittedAnswer);

  const responseSheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEET_RESPONSES);

  if (!responseSheet) {
    throw new Error("Responses sheet is missing.");
  }

  const nextRow = responseSheet.getLastRow() + 1;

  responseSheet.getRange(nextRow, 1).setValue(new Date());

  responseSheet
    .getRange(nextRow, 2)
    .setNumberFormat("@")
    .setValue(className);

  responseSheet.getRange(nextRow, 3, 1, 5).setValues([[
    teamName,
    stationId,
    station.location,
    submittedAnswer,
    isCorrect
  ]]);

  return {
    ok: true,
    correct: isCorrect,
    message: isCorrect
      ? "Correct. Your class has earned 4 points."
      : "Not correct. Check what you can observe at this location and try again."
  };
}

function awardPledgePoint_(className) {
  if (!className) {
    throw new Error("Class name is required.");
  }

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEET_CLASSES);

  if (!sheet) {
    throw new Error("Classes sheet is missing.");
  }

  const rows = sheet.getDataRange().getValues();
  const classIndex = rows
    .slice(1)
    .findIndex(row => cleanText_(row[0]) === className);

  if (classIndex === -1) {
    throw new Error("Class not found.");
  }

  const sheetRow = classIndex + 2;
  const pledgeCell = sheet.getRange(sheetRow, 4);
  const alreadyAwarded = isTrue_(pledgeCell.getValue());

  if (alreadyAwarded) {
    return {
      ok: true,
      alreadyAwarded: true,
      pledgePoint: 1,
      message: `The pledge point has already been awarded to Class ${className}.`
    };
  }

  pledgeCell.setValue(true);
  const status = getClassStatus_(className);

  return {
    ok: true,
    alreadyAwarded: false,
    pledgePoint: 1,
    challengeComplete: status.challengeComplete,
    totalPoints: status.totalPoints,
    targetPoints: status.targetPoints,
    message: status.challengeComplete
      ? `Class ${className} has earned 61 points. Challenge completed!`
      : `Class ${className} has received the 1 pledge point.`
  };
}

function readStations_() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEET_STATIONS);

  if (!sheet) {
    throw new Error("Stations sheet is missing.");
  }

  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];

  return rows
    .slice(1)
    .filter(row => row[0] !== "")
    .map(row => ({
      stationId: Number(row[0]),
      location: String(row[1]),
      clue: String(row[2]),
      question: String(row[3]),
      acceptedAnswers: String(row[4]),
      pledgeOrder: Number(row[5]),
      pledgePhrase: String(row[6]),
      active:
        cleanText_(row[7]).toLowerCase() === "yes" || row[7] === true
    }));
}

function publicStation_(station) {
  return {
    stationId: station.stationId,
    location: station.location,
    clue: station.clue,
    question: station.question,
    pledgeOrder: station.pledgeOrder,
    pledgePhrase: station.pledgePhrase
  };
}

function getCompletedStationIds_(className) {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEET_RESPONSES);

  if (!sheet) {
    throw new Error("Responses sheet is missing.");
  }

  const rows = sheet.getDataRange().getValues();
  const completed = new Set();
  const targetClass = cleanText_(className);

  rows.slice(1).forEach(row => {
    const rowClass = cleanText_(row[1]);
    const stationId = Number(row[3]);
    const correct = isTrue_(row[6]);

    if (
      rowClass === targetClass &&
      correct &&
      Number.isFinite(stationId)
    ) {
      completed.add(stationId);
    }
  });

  return Array.from(completed);
}

function getRequiredStations_(className) {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEET_CLASSES);

  if (!sheet) return 15;

  const rows = sheet.getDataRange().getValues();
  const targetClass = cleanText_(className);
  const match = rows
    .slice(1)
    .find(row => cleanText_(row[0]) === targetClass);

  return match ? Number(match[1]) : 15;
}

function getPledgePoint_(className) {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEET_CLASSES);

  if (!sheet) return 0;

  const rows = sheet.getDataRange().getValues();
  const targetClass = cleanText_(className);
  const match = rows
    .slice(1)
    .find(row => cleanText_(row[0]) === targetClass);

  if (!match) return 0;
  return isTrue_(match[3]) ? 1 : 0;
}

function isTrue_(value) {
  return value === true || cleanText_(value).toLowerCase() === "true";
}

function cleanText_(value) {
  return String(value || "").trim();
}

function normaliseAnswer_(value) {
  return cleanText_(value)
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
