# Student Fee Manager

A simple web app to manage student fees using HTML, CSS, JavaScript, and IndexedDB for local storage.

## Features

- Add students with name, room number, and lunch type
- Enter payments with total fees, paid amount, payment mode, and date
- Auto-calculate balance
- View student list
- View pending fees
- Dashboard with stats

## How to Run

1. Open a terminal in the project directory.
2. Run `python -m http.server 8000`
3. Open `http://localhost:8000` in your browser.

For mobile: Open the link and "Add to Home Screen" to install as PWA.

## PWA Setup

- Manifest.json is included for PWA functionality.
- Add icon images to `images/` folder: icon-192.png and icon-512.png.

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Storage: IndexedDB (local browser storage)