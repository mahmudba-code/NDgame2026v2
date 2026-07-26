// Paste the deployed Google Apps Script Web App URL below.
// While blank, all pages run using the built-in three-station demo data.
const API_URL = "https://script.google.com/macros/s/AKfycbwmWqF3r-pxD8xfT55TbMNYeKMy_SiJKnko76vqGl7O1pON3RXAmHsKWqOLFQ58AFAMIg/exec";

// Live pages poll for updates using this interval.
const REFRESH_MS = 3000;

// Default class shown when no class has been saved.
const DEFAULT_CLASS = "2-1";

// Demo mode automatically switches off after API_URL is filled.
const DEMO_MODE = API_URL.trim() === "";
