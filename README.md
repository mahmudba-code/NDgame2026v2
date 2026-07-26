# Majulah Hunt V2

This is the recommended three-station prototype using one Google Sheet as the master content source.

## Files

- `display.html`: live central display
- `hunt.html`: student dashboard showing all clues
- `station.html`: one reusable question page for every QR code
- `styles.css`: shared styling
- `config.js`: Apps Script URL and refresh settings
- `demo-data.js`: sample data used only before the backend is connected
- `display.js`: live display logic
- `hunt.js`: student dashboard logic
- `station.js`: station loading and submission logic
- `Code.gs`: Google Apps Script backend
- `Majulah_Hunt_Master.xlsx`: spreadsheet template with Stations, Responses and Classes sheets

## Test the website first

Upload all website files to the same GitHub Pages repository.

Important: add this line before each page's main JavaScript file:

```html
<script src="demo-data.js"></script>
```

The supplied HTML files already include the required scripts in the packaged version.

While `API_URL` in `config.js` is blank:

- `display.html` cycles through a demonstration
- `hunt.html` shows the sample clues
- `station.html?station=1` accepts `library`
- `station.html?station=2` accepts `assembly`
- `station.html?station=3` accepts `hydroponics`

## Set up the Google Sheet

1. Upload `Majulah_Hunt_Master.xlsx` to Google Drive.
2. Open it using Google Sheets.
3. Confirm the tabs are named:
   - Stations
   - Responses
   - Classes
4. Edit all clues, questions, answers and pledge phrases in the Stations tab.
5. Separate multiple accepted answers using a vertical bar.

Example:

```text
assembly|morning assembly
```

## Add the backend

1. In the Google Sheet, open Extensions > Apps Script.
2. Delete the default code.
3. Paste the contents of `Code.gs`.
4. Save.
5. Select Deploy > New deployment.
6. Choose Web app.
7. Execute as yourself.
8. Set access according to school policy.
9. Deploy and copy the Web App URL.

## Connect GitHub Pages to the backend

Open `config.js`.

Replace:

```javascript
const API_URL = "";
```

with:

```javascript
const API_URL = "YOUR_DEPLOYED_WEB_APP_URL";
```

Commit the change to GitHub.

The automatic demo loop will stop because `DEMO_MODE` becomes false.

## QR code links

Each physical station gets a QR code linking to the same page with a different number:

```text
https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY/station.html?station=1
https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY/station.html?station=2
https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY/station.html?station=3
```

Continue this pattern up to station 20.

## Recommended public links

Student dashboard:

```text
https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY/hunt.html
```

Live central display for Class 2-1:

```text
https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY/display.html?class=2-1
```

For another class, change `2-1` in the URL.

## Scaling to 20 stations

Add rows to the Stations sheet. You do not need to edit the website code.

Use unique station IDs from 1 to 20 and pledge order values from 1 to 20.

## Important operational notes

- Every correct attempt is recorded.
- A station counts only once per class.
- The dashboard and live display update every three seconds.
- The student dashboard stores the selected class and team in the browser.
- Test GitHub Pages and the Apps Script URL on school Wi-Fi before the event.


## Class dropdown

The student dashboard and station form now use a fixed class dropdown:

```text
2-1
2-2
2-3
2-4
2-5
2-6
2-7
2-8
```

The Classes sheet contains the same eight classes.
