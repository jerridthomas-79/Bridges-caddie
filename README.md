# Bridges Caddie

A static iPhone-friendly golf yardage app for The Bridges at Beresford.

## What it does
- Runs on GitHub Pages
- Can be added to iPhone Home Screen
- Uses iPhone GPS to show yards to center of green
- Saves each hole's center point locally on the phone after you stand on the green once and tap **Set center from my location**
- Works offline after first load in supported browsers

## Publish to GitHub Pages
1. Create a GitHub repository.
2. Upload all files from this folder.
3. In GitHub, go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the **main** branch and the **/(root)** folder.
6. Save.
7. Wait for Pages to publish, then open the `https://YOURNAME.github.io/REPO/` URL on your iPhone in Safari.
8. Tap **Share → Add to Home Screen**.

## Calibrate the course
- Go to Hole 1 green.
- Stand roughly in the center.
- Open the app and select Hole 1.
- Tap **Set center from my location**.
- Repeat for Holes 2–9.

## Notes
- Saved center points live in the browser storage on that iPhone.
- If you clear Safari website data, those saved points may be removed.
- For a permanent version, hard-code the final saved lat/lng values into `app.js`.
