# 🇮🇳 Bharat Election Portal (BEP)

## 🚀 Overview

Bharat Election Portal (BEP) is an interactive election assistant designed to guide users through the Indian election process using a step-by-step wizard and personalized decision logic.

The system adapts to user inputs such as age, registration status, voting experience, and location to provide tailored guidance on eligibility, registration, and voting procedures.

---

## 🎯 Problem Statement

Many citizens, especially first-time voters, lack clarity about:

* Eligibility requirements
* Registration steps
* Voting-day procedures

This leads to confusion, missed opportunities to vote, and reduced civic participation.

---

## 💡 Solution

BEP simplifies the election process by acting as a **smart assistant** that:

* Determines eligibility
* Guides users through registration or voting steps
* Adapts advice based on user persona
* Provides a clear checklist and reminders

---

## 🧠 Core Features

### 1. Interactive Wizard

* Step-by-step guided flow
* Collects user inputs (age, registration, experience, location)
* Displays progress with a visual indicator

### 2. Decision-Based Logic

* Determines user path dynamically:

  * Under 18 → eligibility guidance
  * Not registered → registration steps
  * Registered → voting checklist
* Adapts output for:

  * First-time voters
  * Experienced voters
  * Senior citizens

### 3. Personalized Guidance

* Context-aware recommendations
* Clear, actionable instructions
* Persona-based messaging

### 4. Voting Reminder System

* Users can set a voting day reminder
* Stored locally using browser storage
* Displayed on reload

---

## ☁️ Google Cloud Services Integration

### Firebase Firestore (Data Storage)

BEP uses **Firebase Firestore** via CDN to store anonymized user interaction data.

* Data is saved when the user completes the flow
* Stored fields: age, registration status, voting experience, location, timestamp
* Interaction events (`wizard_completed`) are logged in a separate `events` collection
* Retrieves total user count from Firestore and displays community usage

### Google Analytics (gtag.js)

BEP integrates **Google Analytics** via CDN for tracking:

* Page views (automatic)
* Agent interactions:
  * `app_init` — Application initialized
  * `step_view` — Wizard step navigation
  * `guidance_shown` — Final guidance displayed
  * `reminder_saved` — Voting reminder set

### Google Cloud Run Deployment

BEP includes production-ready deployment configuration:

* **Dockerfile** — Minimal `nginx:alpine` container serving static files on port 8080
* **cloudbuild.yaml** — CI/CD pipeline that builds, pushes, and deploys to Cloud Run in `asia-south1`

#### Deploy to Cloud Run:

```bash
gcloud builds submit --config cloudbuild.yaml
```

---

## ⚙️ Technical Approach

### Tech Stack:

* HTML (structure)
* CSS (UI/UX design)
* Vanilla JavaScript (logic + interactivity)
* Firebase Firestore (backend data service via CDN)
* Google Analytics (user interaction tracking via CDN)
* Docker + Cloud Run (deployment)

### Architecture:

* State-driven UI (`appState`)
* Modular rendering functions
* Event-driven workflow
* Lazy loading Firebase to optimize performance
* Analytics event tracking via `trackEvent()` helper

---

## ⚡ Efficiency & Performance

* Total project size: ~50 KB (well under 1 MB limit)
* No heavy frameworks or npm dependencies
* Lazy loading Firebase modules via CDN
* Fast rendering and minimal resource usage
* Alpine-based Docker image (~25 MB)

---

## 🔒 Security Considerations

* No sensitive data collected
* Only anonymized inputs stored
* Input validation implemented
* Safe DOM rendering (escaped inputs via `escapeHtml()`)
* Firebase config uses placeholder values — replace before production

---

## 🧪 Testing

### Comprehensive Test Suite (`test.js`)

Run tests with:

```bash
npm test
```

**64 test cases** across **13 test groups** covering:

| Group | Area | Tests |
|-------|------|-------|
| 1 | `getEligibility` — age eligibility | 8 |
| 2 | `getGuidance` — decision logic branches | 6 |
| 3 | Edge cases — empty/invalid/NaN inputs | 5 |
| 4 | `escapeHtml` — XSS prevention | 5 |
| 5 | `formatDate` — date formatting | 2 |
| 6 | Steps configuration integrity | 4 |
| 7 | `appState` — initial state validation | 5 |
| 8 | `getStepStatus` — progress tracking | 4 |
| 9 | `getUserDataForStorage` — data export | 6 |
| 10 | `buildGuidance` — full guidance output | 11 |
| 11 | `renderSeniorBox` — conditional rendering | 3 |
| 12 | Firebase configuration validation | 2 |
| 13 | `showMessage`/`clearMessage` — UI messaging | 2 |

* Plain JavaScript (no test frameworks)
* Uses `console.assert()`-style assertions
* Clear pass/fail output with ✅/❌ indicators
* Tests edge cases: NaN, null, undefined, empty strings, negative values

---

## ♿ Accessibility

* Semantic HTML structure
* Labels for all inputs
* Keyboard focus handling
* High-contrast UI design

---

## ⚠️ Assumptions

* Users provide basic demographic inputs
* Location is approximate (city/state level)
* Firebase configuration is properly set before production use
* Google Analytics tracking ID is replaced with actual measurement ID

---

## 🌍 Real-World Impact

BEP aims to:

* Improve voter awareness
* Reduce confusion in election processes
* Encourage informed civic participation

---

## 📌 Future Improvements

* Integration with official election APIs
* Real-time polling booth lookup
* Multi-language support
* Advanced analytics dashboard

---

## 📁 Project Structure

```
├── index.html          # Main HTML page with GA + Firebase CDN
├── script.js           # Core agent logic + Firebase + Analytics
├── style.css           # Responsive UI design
├── test.js             # 64 unit tests (plain JavaScript)
├── Dockerfile          # Cloud Run container configuration
├── cloudbuild.yaml     # Google Cloud Build CI/CD pipeline
├── package.json        # npm test script
└── README.md           # Project documentation
```

---

## 🧠 Final Note

Bharat Election Portal is not just an informational tool — it is a **decision-driven assistant** that brings clarity, accessibility, and real-world usability to election education.
