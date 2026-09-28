# Story's 7th Birthday — RSVP Website

A one-page, light-themed RSVP site (ballet and gymnastics theme) that saves every response to a Google Sheet.

```
rsvp-web/
├── index.html          ← the whole website (styles + script included)
└── apps-script/
    └── Code.gs         ← paste into Google Apps Script
```

## What guests see
- Title, date and time, venue, "Add to Google Calendar" and "Open in Google Maps" buttons
- A live countdown to Oct 31, 2026, 4:00 PM
- The two Important Reminders
- The RSVP form:
  - **Can you attend?** (Yes, I'll be there / Sorry, can't make it)
  - **What is your full name?**
  - **How many people are attending with you?** (only if Yes, 0–5, not counting themselves)
  - **What are the names of people attending?** (one box appears per person)
- A thank-you screen with confetti and a cartwheeling gymnast for "Yes"

## Defaults already set (change in `CONFIG` inside `index.html` and at the top of `Code.gs`)
| Setting | Value |
|---|---|
| Max companions per guest | 5 |
| RSVP deadline (form closes after) | Oct 24, 2026, 11:59 PM PH time |
| Duplicate responses | Same full name → the earlier row is updated, not duplicated |
| Event end time (for calendar) | 8:00 PM |

If you change the companion limit or deadline, change it in **both** files.

## Setup (about 10 minutes)

### 1. Create the Google Sheet
1. Go to https://sheets.new and name it e.g. **Story 7th Birthday RSVPs**.

### 2. Add the script
1. In the Sheet: **Extensions → Apps Script**.
2. Delete the sample code, paste in everything from `apps-script/Code.gs`, and click **Save**.
3. In the function dropdown pick **setupSheets** and click **Run**. Approve the permission prompt (it's your own script). This creates the **RSVPs** and **Summary** tabs.

### 3. Deploy it as a Web App
1. **Deploy → New deployment**, click the gear icon, and choose **Web app**.
2. Execute as: **Me**. Who has access: **Anyone**.
3. Click **Deploy** and copy the **Web app URL** (ends in `/exec`).
4. Optional check: open that URL in your browser. You should see `"ok":true`.

### 4. Connect the website
1. Open `index.html` in a text editor (e.g. VS Code).
2. Find `SCRIPT_URL: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE"` and paste your URL between the quotes.
3. Save.

Until you do this, the site runs in **demo mode**: the form works but nothing is saved, and the thank-you screen says so.

### 5. Test
Open `index.html` in your browser and send one "Yes" with 2 companions and one "No". Check the **RSVPs** tab, then delete the test rows.

### 6. Put it online (free)
- **Netlify Drop:** go to https://app.netlify.com/drop and drag the `rsvp-web` folder onto the page. You get a link right away.
- **GitHub Pages:** push the folder to a repository, then Settings → Pages → deploy from the main branch.

Share the link in your invitation messages.

## Updating the script later
If you edit `Code.gs`, use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy** so the same URL keeps working.

## Google Sheet columns
`Timestamp | Attending | Full Name | No. of Companions | Companion Names | Total Headcount | Times Updated`

The **Summary** tab totals responses, Yes/No counts, companions and total expected guests.
