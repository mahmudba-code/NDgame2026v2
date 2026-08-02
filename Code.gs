const SHEET_STATIONS = "Stations";
const SHEET_RESPONSES = "Responses";
const SHEET_CLASSES = "Classes";

const POINTS_PER_STATION = 4;
const PLEDGE_POINT_VALUE = 1;
const FIGURINE_POINTS_COLUMN = 5;


/* =====================================================
   GET REQUESTS
   ===================================================== */

function doGet(e) {
  try {
    const action = String(
      e.parameter.action || ""
    );

    if (action === "status") {
      const className = String(
        e.parameter.className || "2-1"
      );

      return jsonResponse_(
        getClassStatus_(className)
      );
    }

    if (action === "station") {
      const stationId = Number(
        e.parameter.stationId
      );

      return jsonResponse_(
        getStation_(stationId)
      );
    }

    return jsonResponse_({
      ok: true,
      message:
        "Crestomon Hunt API is running."
    });

  } catch (error) {
    return jsonResponse_({
      ok: false,
      message: error.message
    });
  }
}


/* =====================================================
   POST REQUESTS
   ===================================================== */

function doPost(e) {
  try {
    const payload = JSON.parse(
      e.postData.contents || "{}"
    );

    if (payload.action === "submit") {
      return jsonResponse_(
        handleSubmission_(payload)
      );
    }

    if (payload.action === "awardPledge") {
      return jsonResponse_(
        awardPledgePoint_(
          cleanText_(payload.className)
        )
      );
    }

    if (
      payload.action ===
      "adjustFigurinePoints"
    ) {
      return jsonResponse_(
        adjustFigurinePoints_(
          cleanText_(
            payload.className
          ),
          Number(payload.change)
        )
      );
    }

    throw new Error(
      "Invalid submission action."
    );

  } catch (error) {
    return jsonResponse_({
      ok: false,
      correct: false,
      message: error.message
    });
  }
}


/* =====================================================
   STATION INFORMATION
   ===================================================== */

function getStation_(stationId) {
  const stations =
    readStations_();

  const station =
    stations.find(
      item =>
        item.stationId === stationId
    );

  if (!station) {
    return {
      ok: false,
      message:
        "Station not found."
    };
  }

  if (!station.active) {
    return {
      ok: false,
      message:
        "This station is not active."
    };
  }

  return {
    ok: true,
    station:
      publicStation_(station)
  };
}


/* =====================================================
   CLASS STATUS
   ===================================================== */

function getClassStatus_(className) {
  const cleanClassName =
    cleanText_(className);

  const stations =
    readStations_()
      .filter(
        station => station.active
      );

  const requiredStations =
    getRequiredStations_(
      cleanClassName
    );

  const completedStationIds =
    getCompletedStationIds_(
      cleanClassName
    );

  const completedStations =
    completedStationIds.length;

  const countedStations =
    Math.min(
      completedStations,
      requiredStations
    );

  const stationPoints =
    countedStations *
    POINTS_PER_STATION;

  const pledgePoint =
    getPledgePoint_(
      cleanClassName
    );

  const figurinePoints =
    getFigurinePoints_(
      cleanClassName
    );

  /*
   * Main hunt:
   * 15 stations × 4 = 60
   * Pledge = 1
   */
  const totalPoints =
    stationPoints +
    pledgePoint;

  /*
   * Overall score shown on
   * the teacher bonus scoreboard.
   */
  const overallPoints =
    totalPoints +
    figurinePoints;

  const targetPoints =
    requiredStations *
      POINTS_PER_STATION +
    PLEDGE_POINT_VALUE;

  /*
   * Figurine points do NOT affect
   * completion of the main hunt.
   */
  const challengeComplete =
    completedStations >=
      requiredStations &&
    pledgePoint ===
      PLEDGE_POINT_VALUE;

  return {
    ok: true,

    className:
      cleanClassName,

    requiredStations,
    completedStationIds,
    completedStations,
    countedStations,

    pointsPerStation:
      POINTS_PER_STATION,

    stationPoints,
    pledgePoint,

    /*
     * Kept as the 61-point hunt score
     * so display.html and all-classes.html
     * continue to work unchanged.
     */
    totalPoints,
    targetPoints,

    figurinePoints,
    overallPoints,

    challengeComplete,

    stations:
      stations.map(
        station => ({
          ...publicStation_(
            station
          ),

          complete:
            completedStationIds
              .includes(
                station.stationId
              )
        })
      )
  };
}


/* =====================================================
   STATION ANSWER SUBMISSION
   ===================================================== */

function handleSubmission_(payload) {
  const className =
    cleanText_(
      payload.className
    );

  const teamName =
    cleanText_(
      payload.teamName
    );

  const stationId =
    Number(
      payload.stationId
    );

  const submittedAnswer =
    normaliseAnswer_(
      payload.answer
    );

  if (
    !className ||
    !teamName ||
    !stationId ||
    !submittedAnswer
  ) {
    throw new Error(
      "Class, team, station and answer are required."
    );
  }

  const stations =
    readStations_();

  const station =
    stations.find(
      item =>
        item.stationId ===
          stationId &&
        item.active
    );

  if (!station) {
    throw new Error(
      "This station is not active."
    );
  }

  const acceptedAnswers =
    station
      .acceptedAnswers
      .split("|")
      .map(
        normaliseAnswer_
      )
      .filter(Boolean);

  const isCorrect =
    acceptedAnswers.includes(
      submittedAnswer
    );

  /*
   * Check before recording this response.
   * A repeated correct answer to the same
   * station does not earn another 4 points.
   */
  const wasAlreadyCompleted =
    getCompletedStationIds_(
      className
    ).includes(
      stationId
    );

  const responseSheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        SHEET_RESPONSES
      );

  if (!responseSheet) {
    throw new Error(
      "Responses sheet is missing."
    );
  }

  const nextRow =
    responseSheet
      .getLastRow() + 1;

  /*
   * Column A: Timestamp
   */
  responseSheet
    .getRange(
      nextRow,
      1
    )
    .setValue(
      new Date()
    );

  /*
   * Column B: Class.
   * Force plain text so values such as
   * 2-1 are not converted into dates.
   */
  responseSheet
    .getRange(
      nextRow,
      2
    )
    .setNumberFormat("@")
    .setValue(
      className
    );

  /*
   * C = Team
   * D = Station ID
   * E = Location
   * F = Submitted answer
   * G = Correct
   */
  responseSheet
    .getRange(
      nextRow,
      3,
      1,
      5
    )
    .setValues([[
      teamName,
      stationId,
      station.location,
      submittedAnswer,
      isCorrect
    ]]);

  return {
    ok: true,
    correct:
      isCorrect,

    stationId,

    pointsAwarded:
      isCorrect &&
      !wasAlreadyCompleted
        ? POINTS_PER_STATION
        : 0,

    alreadyCompleted:
      wasAlreadyCompleted,

    message:
      isCorrect
        ? wasAlreadyCompleted
          ? "Correct. This station already counts towards your class total."
          : `Correct. Your class has earned ${POINTS_PER_STATION} points.`
        : "Not correct. Check what you can observe at this location and try again."
  };
}


/* =====================================================
   PLEDGE POINT
   ===================================================== */

function awardPledgePoint_(className) {
  if (!className) {
    throw new Error(
      "Class name is required."
    );
  }

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        SHEET_CLASSES
      );

  if (!sheet) {
    throw new Error(
      "Classes sheet is missing."
    );
  }

  const rows =
    sheet
      .getDataRange()
      .getValues();

  const classIndex =
    rows
      .slice(1)
      .findIndex(
        row =>
          cleanText_(
            row[0]
          ) ===
          className
      );

  if (classIndex === -1) {
    throw new Error(
      "Class not found."
    );
  }

  /*
   * Classes sheet:
   * A = Class
   * B = Required Stations
   * C = Status
   * D = Pledge Point
   * E = Figurine Points
   */
  const sheetRow =
    classIndex + 2;

  const pledgeCell =
    sheet.getRange(
      sheetRow,
      4
    );

  const alreadyAwarded =
    isTrue_(
      pledgeCell.getValue()
    );

  if (!alreadyAwarded) {
    pledgeCell.setValue(
      true
    );
  }

  const status =
    getClassStatus_(
      className
    );

  return {
    ok: true,

    alreadyAwarded,

    pledgePoint:
      PLEDGE_POINT_VALUE,

    stationPoints:
      status.stationPoints,

    totalPoints:
      status.totalPoints,

    targetPoints:
      status.targetPoints,

    figurinePoints:
      status.figurinePoints,

    overallPoints:
      status.overallPoints,

    challengeComplete:
      status.challengeComplete,

    message:
      alreadyAwarded
        ? `The pledge point has already been awarded to Class ${className}.`
        : status.challengeComplete
          ? `Class ${className} has completed the 61-point main hunt!`
          : `Class ${className} has received the pledge point.`
  };
}


/* =====================================================
   FIGURINE BONUS POINTS
   ===================================================== */

function getFigurinePoints_(className) {
  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        SHEET_CLASSES
      );

  if (!sheet) {
    return 0;
  }

  const rows =
    sheet
      .getDataRange()
      .getValues();

  const targetClass =
    cleanText_(
      className
    );

  const match =
    rows
      .slice(1)
      .find(
        row =>
          cleanText_(
            row[0]
          ) ===
          targetClass
      );

  if (!match) {
    return 0;
  }

  const points =
    Number(
      match[
        FIGURINE_POINTS_COLUMN -
        1
      ]
    );

  return Number.isFinite(
    points
  )
    ? points
    : 0;
}


function adjustFigurinePoints_(
  className,
  change
) {
  if (!className) {
    throw new Error(
      "Class name is required."
    );
  }

  if (
    change !== 8 &&
    change !== -8
  ) {
    throw new Error(
      "Figurine points must change by 8."
    );
  }

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        SHEET_CLASSES
      );

  if (!sheet) {
    throw new Error(
      "Classes sheet is missing."
    );
  }

  const rows =
    sheet
      .getDataRange()
      .getValues();

  const classIndex =
    rows
      .slice(1)
      .findIndex(
        row =>
          cleanText_(
            row[0]
          ) ===
          className
      );

  if (classIndex === -1) {
    throw new Error(
      "Class not found."
    );
  }

  const sheetRow =
    classIndex + 2;

  const pointsCell =
    sheet.getRange(
      sheetRow,
      FIGURINE_POINTS_COLUMN
    );

  const current =
    Number(
      pointsCell.getValue()
    ) || 0;

  /*
   * Do not allow bonus points below 0.
   */
  const next =
    Math.max(
      0,
      current + change
    );

  pointsCell.setValue(
    next
  );

  const status =
    getClassStatus_(
      className
    );

  return {
    ok: true,
    className,

    change,

    figurinePoints:
      next,

    mainHuntPoints:
      status.totalPoints,

    overallPoints:
      status.overallPoints
  };
}


/* =====================================================
   READ STATIONS
   ===================================================== */

function readStations_() {
  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        SHEET_STATIONS
      );

  if (!sheet) {
    throw new Error(
      "Stations sheet is missing."
    );
  }

  const rows =
    sheet
      .getDataRange()
      .getValues();

  if (rows.length < 2) {
    return [];
  }

  return rows
    .slice(1)
    .filter(
      row =>
        row[0] !== ""
    )
    .map(
      row => ({
        stationId:
          Number(
            row[0]
          ),

        location:
          String(
            row[1]
          ),

        clue:
          String(
            row[2]
          ),

        question:
          String(
            row[3]
          ),

        acceptedAnswers:
          String(
            row[4]
          ),

        pledgeOrder:
          Number(
            row[5]
          ),

        pledgePhrase:
          String(
            row[6]
          ),

        active:
          row[7] === true ||
          cleanText_(
            row[7]
          )
            .toLowerCase() ===
            "yes"
      })
    );
}


function publicStation_(station) {
  return {
    stationId:
      station.stationId,

    location:
      station.location,

    clue:
      station.clue,

    question:
      station.question,

    pledgeOrder:
      station.pledgeOrder,

    pledgePhrase:
      station.pledgePhrase
  };
}


/* =====================================================
   COMPLETED STATIONS
   ===================================================== */

function getCompletedStationIds_(
  className
) {
  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        SHEET_RESPONSES
      );

  if (!sheet) {
    throw new Error(
      "Responses sheet is missing."
    );
  }

  const rows =
    sheet
      .getDataRange()
      .getValues();

  const completed =
    new Set();

  const targetClass =
    cleanText_(
      className
    );

  rows
    .slice(1)
    .forEach(
      row => {
        const rowClass =
          cleanText_(
            row[1]
          );

        const stationId =
          Number(
            row[3]
          );

        const correct =
          isTrue_(
            row[6]
          );

        if (
          rowClass ===
            targetClass &&
          correct &&
          Number.isFinite(
            stationId
          )
        ) {
          completed.add(
            stationId
          );
        }
      }
    );

  return Array.from(
    completed
  );
}


/* =====================================================
   REQUIRED STATIONS
   ===================================================== */

function getRequiredStations_(
  className
) {
  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        SHEET_CLASSES
      );

  if (!sheet) {
    return 15;
  }

  const rows =
    sheet
      .getDataRange()
      .getValues();

  const targetClass =
    cleanText_(
      className
    );

  const match =
    rows
      .slice(1)
      .find(
        row =>
          cleanText_(
            row[0]
          ) ===
          targetClass
      );

  if (!match) {
    return 15;
  }

  const requiredStations =
    Number(
      match[1]
    );

  return Number.isFinite(
    requiredStations
  )
    ? requiredStations
    : 15;
}


/* =====================================================
   PLEDGE STATUS
   ===================================================== */

function getPledgePoint_(
  className
) {
  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        SHEET_CLASSES
      );

  if (!sheet) {
    return 0;
  }

  const rows =
    sheet
      .getDataRange()
      .getValues();

  const targetClass =
    cleanText_(
      className
    );

  const match =
    rows
      .slice(1)
      .find(
        row =>
          cleanText_(
            row[0]
          ) ===
          targetClass
      );

  if (!match) {
    return 0;
  }

  return isTrue_(
    match[3]
  )
    ? PLEDGE_POINT_VALUE
    : 0;
}


/* =====================================================
   HELPERS
   ===================================================== */

function isTrue_(value) {
  return (
    value === true ||
    cleanText_(
      value
    )
      .toLowerCase() ===
      "true"
  );
}


function cleanText_(value) {
  return String(
    value ?? ""
  ).trim();
}


function normaliseAnswer_(value) {
  return cleanText_(
    value
  )
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );
}


function jsonResponse_(data) {
  return ContentService
    .createTextOutput(
      JSON.stringify(
        data
      )
    )
    .setMimeType(
      ContentService
        .MimeType
        .JSON
    );
}
