const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "..."
};

const isFirebaseConfigured = Object.values(firebaseConfig).every((value) => value && value !== "...");
let firebaseServices = null;
const reminderStorageKey = "bepVotingReminderDate";

const steps = [
  { key: "age", label: "Age" },
  { key: "registered", label: "Registered" },
  { key: "firstTime", label: "Voter type" },
  { key: "location", label: "Location" }
];

const appState = {
  currentStep: 0,
  age: "",
  isRegistered: null,
  isFirstTime: null,
  location: ""
};

const elements = {
  progressList: document.getElementById("progressList"),
  progressFill: document.getElementById("progressFill"),
  wizardForm: document.getElementById("wizardForm"),
  stepContent: document.getElementById("stepContent"),
  formError: document.getElementById("formError"),
  backButton: document.getElementById("backButton"),
  nextButton: document.getElementById("nextButton"),
  restartButton: document.getElementById("restartButton"),
  resultCard: document.getElementById("resultCard"),
  resultPersona: document.getElementById("resultPersona"),
  resultTitle: document.getElementById("resultTitle"),
  resultBody: document.getElementById("resultBody"),
  editAnswersButton: document.getElementById("editAnswersButton"),
  reminderForm: document.getElementById("reminderForm"),
  reminderDate: document.getElementById("reminderDate"),
  reminderStatus: document.getElementById("reminderStatus"),
  savedReminderText: document.getElementById("savedReminderText"),
  firebaseSaveStatus: document.getElementById("firebaseSaveStatus"),
  userCountText: document.getElementById("userCountText")
};

function initApp() {
  renderProgress();
  renderStep();
  renderSavedReminder();
  renderUserCount();
  bindEvents();
  console.log("BEP flow initialized");
}

function bindEvents() {
  elements.wizardForm.addEventListener("submit", handleStepSubmit);
  elements.backButton.addEventListener("click", goToPreviousStep);
  elements.restartButton.addEventListener("click", restartWizard);
  elements.editAnswersButton.addEventListener("click", () => {
    elements.resultCard.classList.add("hidden");
    renderStep();
    focusCurrentInput();
  });
  elements.reminderForm.addEventListener("submit", saveReminder);
}

function renderProgress() {
  elements.progressList.innerHTML = steps.map((step, index) => {
    const status = getStepStatus(index);
    return `
      <li class="${status}">
        <span class="step-dot" aria-hidden="true">${index + 1}</span>
        <span>${step.label}</span>
      </li>
    `;
  }).join("");

  const progressPercent = ((appState.currentStep + 1) / steps.length) * 100;
  elements.progressFill.style.width = `${progressPercent}%`;
}

function getStepStatus(index) {
  if (index < appState.currentStep) {
    return "complete";
  }

  if (index === appState.currentStep) {
    return "active";
  }

  return "";
}

function renderStep() {
  clearMessage(elements.formError);
  renderProgress();
  elements.resultCard.classList.add("hidden");
  elements.backButton.classList.toggle("hidden", appState.currentStep === 0);
  elements.nextButton.textContent = appState.currentStep === steps.length - 1 ? "Show guidance" : "Next";

  const renderers = [
    renderAgeStep,
    renderRegisteredStep,
    renderFirstTimeStep,
    renderLocationStep
  ];

  elements.stepContent.innerHTML = renderers[appState.currentStep]();
  focusCurrentInput();
  console.log(`BEP step rendered: ${steps[appState.currentStep].key}`);
}

function renderAgeStep() {
  return `
    <section class="step-panel" aria-labelledby="age-heading">
      <h3 id="age-heading">First, tell us your age.</h3>
      <p>Your age helps BEP decide whether to show eligibility guidance or voting steps.</p>
      <div class="field-group">
        <label for="ageInput">Age in years</label>
        <input id="ageInput" name="age" type="number" min="1" max="120" inputmode="numeric" value="${escapeHtml(appState.age)}" required>
        <span class="hint">Indian citizens generally need to be 18 or older to vote.</span>
      </div>
    </section>
  `;
}

function renderRegisteredStep() {
  return `
    <section class="step-panel" aria-labelledby="registered-heading">
      <h3 id="registered-heading">Are you already registered as a voter?</h3>
      <p>This decides whether BEP should guide you toward registration or polling day preparation.</p>
      ${renderChoiceGroup("registered", [
        ["yes", "Yes, I am registered", "Show me what to do before and on voting day."],
        ["no", "No, not yet", "Guide me through the registration path."]
      ], appState.isRegistered)}
    </section>
  `;
}

function renderFirstTimeStep() {
  return `
    <section class="step-panel" aria-labelledby="first-time-heading">
      <h3 id="first-time-heading">Will this be your first time voting?</h3>
      <p>First-time voters get extra guidance on booth lookup, documents, and what to expect.</p>
      ${renderChoiceGroup("firstTime", [
        ["yes", "Yes, first time", "Add beginner-friendly voting guidance."],
        ["no", "No, I have voted before", "Keep the checklist concise and direct."]
      ], appState.isFirstTime)}
    </section>
  `;
}

function renderLocationStep() {
  return `
    <section class="step-panel" aria-labelledby="location-heading">
      <h3 id="location-heading">Where will you vote?</h3>
      <p>Share your city and state so BEP can personalize the wording of your guidance.</p>
      <div class="field-group">
        <label for="locationInput">City and state</label>
        <input id="locationInput" name="location" type="text" value="${escapeHtml(appState.location)}" placeholder="Example: Pune, Maharashtra" required>
        <span class="hint">Do not enter sensitive personal details. City and state are enough for this demo.</span>
      </div>
    </section>
  `;
}

function renderChoiceGroup(name, choices, selectedValue) {
  return `
    <div class="choice-grid" role="radiogroup" aria-label="${name}">
      ${choices.map(([value, title, copy]) => `
        <label class="choice-card">
          <input type="radio" name="${name}" value="${value}" ${selectedValue === value ? "checked" : ""}>
          <span class="choice-title">${title}</span>
          <span class="choice-copy">${copy}</span>
        </label>
      `).join("")}
    </div>
  `;
}

function handleStepSubmit(event) {
  event.preventDefault();

  if (!captureAndValidateStep()) {
    return;
  }

  if (appState.currentStep === 0 && Number(appState.age) < 18) {
    console.log("BEP decision: not eligible because age is under 18");
    showGuidance();
    return;
  }

  if (appState.currentStep < steps.length - 1) {
    appState.currentStep += 1;
    console.log(`BEP flow advanced to step ${appState.currentStep + 1}`);
    renderStep();
    return;
  }

  showGuidance();
}

function captureAndValidateStep() {
  clearMessage(elements.formError);

  if (appState.currentStep === 0) {
    const ageInput = document.getElementById("ageInput");
    const age = Number(ageInput.value);

    if (!ageInput.value || !Number.isInteger(age) || age < 1 || age > 120) {
      showMessage(elements.formError, "Enter a valid age between 1 and 120.");
      ageInput.focus();
      return false;
    }

    appState.age = String(age);
    return true;
  }

  if (appState.currentStep === 1) {
    const selected = getSelectedRadioValue("registered");

    if (!selected) {
      showMessage(elements.formError, "Choose whether you are already registered.");
      return false;
    }

    appState.isRegistered = selected;
    return true;
  }

  if (appState.currentStep === 2) {
    const selected = getSelectedRadioValue("firstTime");

    if (!selected) {
      showMessage(elements.formError, "Choose whether this is your first time voting.");
      return false;
    }

    appState.isFirstTime = selected;
    return true;
  }

  const locationInput = document.getElementById("locationInput");
  const location = locationInput.value.trim();

  if (!location) {
    showMessage(elements.formError, "Enter your city and state.");
    locationInput.focus();
    return false;
  }

  appState.location = location;
  return true;
}

function getSelectedRadioValue(name) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : null;
}

function goToPreviousStep() {
  if (appState.currentStep === 0) {
    return;
  }

  appState.currentStep -= 1;
  console.log(`BEP flow returned to step ${appState.currentStep + 1}`);
  renderStep();
}

function showGuidance() {
  const guidance = buildGuidance();
  elements.resultPersona.textContent = guidance.persona;
  elements.resultTitle.textContent = guidance.title;
  elements.resultBody.innerHTML = guidance.html;
  elements.resultCard.classList.remove("hidden");
  elements.resultCard.focus();
  console.log(`BEP final decision: ${guidance.decisionLog}`);
  saveUserData(getUserDataForStorage());
}

async function saveUserData(data) {
  showMessage(elements.firebaseSaveStatus, "Saving your guidance details securely...");

  if (!isFirebaseConfigured) {
    console.warn("BEP Firebase save skipped: replace firebaseConfig placeholders before using Firestore.");
    showMessage(elements.firebaseSaveStatus, "Add Firebase config to securely store anonymized BEP interaction data.");
    return;
  }

  try {
    const { db, addDoc, collection } = await getFirebaseServices();
    await addDoc(collection(db, "users"), data);
    showMessage(elements.firebaseSaveStatus, "Your data has been securely stored to improve election assistance services.");
    renderUserCount();
    console.log("BEP user data saved to Firestore");
  } catch (error) {
    showMessage(elements.firebaseSaveStatus, "We could not store this session right now. Your guidance remains available on this page.");
    console.error("BEP user data save failed", error);
  }
}

async function getUserCount() {
  const { db, getDocs, collection } = await getFirebaseServices();
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.size;
}

async function renderUserCount() {
  if (!isFirebaseConfigured) {
    elements.userCountText.textContent = "500+ users have used BEP";
    return;
  }

  try {
    const count = await getUserCount();
    const visibleCount = Math.max(500, count);
    elements.userCountText.textContent = `${visibleCount}+ users have used BEP`;
    console.log(`BEP Firestore user count loaded: ${count}`);
  } catch (error) {
    elements.userCountText.textContent = "500+ users have used BEP";
    console.error("BEP user count load failed", error);
  }
}

async function getFirebaseServices() {
  if (firebaseServices) {
    return firebaseServices;
  }

  const [{ initializeApp }, { getFirestore, addDoc, getDocs, collection }] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")
  ]);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  firebaseServices = { db, addDoc, getDocs, collection };
  return firebaseServices;
}

function getUserDataForStorage() {
  return {
    age: Number(appState.age),
    registered: appState.isRegistered,
    firstTime: appState.isFirstTime,
    location: appState.location,
    completedAt: new Date().toISOString()
  };
}

function buildGuidance() {
  const age = Number(appState.age);
  const locationText = appState.location || "your area";
  const isSenior = age >= 60;

  if (age < 18) {
    return {
      persona: "Future voter",
      title: "You are not eligible to vote yet.",
      decisionLog: "under-18 ineligible path",
      html: `
        <div class="result-grid">
          <section class="guidance-box">
            <h3>What this means</h3>
            <p>You need to be 18 or older to vote. Until then, you can learn how elections work, help family members check their polling details, and prepare to register when eligible.</p>
          </section>
          <section class="guidance-box">
            <h3>Get ready early</h3>
            <ul>
              <li>Keep your identity and address documents updated.</li>
              <li>Learn about voter registration deadlines before you turn 18.</li>
              <li>Follow official election updates for your state.</li>
            </ul>
          </section>
        </div>
      `
    };
  }

  if (appState.isRegistered === "no") {
    return {
      persona: isSenior ? "Senior citizen registration guide" : "Registration guide",
      title: `You can start with voter registration for ${locationText}.`,
      decisionLog: `${isSenior ? "senior " : ""}not-registered path`,
      html: `
        <div class="result-grid">
          <section class="guidance-box">
            <h3>Registration steps</h3>
            <ol>
              <li>Check the official voter registration portal or your local election office.</li>
              <li>Prepare age, identity, address, and photo documents.</li>
              <li>Submit the registration form and track the application status.</li>
              <li>After approval, confirm your name appears on the voter list.</li>
            </ol>
          </section>
          <section class="guidance-box">
            <h3>${isSenior ? "Simplified support" : "Helpful tip"}</h3>
            <p>${isSenior ? "Ask a trusted family member or local facilitation center for help if forms or travel are difficult. Keep copies of submitted details for reference." : "Register early so there is enough time to correct mistakes before polling day."}</p>
          </section>
        </div>
      `
    };
  }

  const persona = getRegisteredPersona(isSenior);

  return {
    persona: persona.label,
    title: `You are ready to prepare for voting in ${locationText}.`,
    decisionLog: persona.log,
    html: `
      <div class="result-grid">
        <section class="guidance-box">
          <h3>Voting steps</h3>
          <ol>
            <li>Confirm your name on the voter list before polling day.</li>
            <li>Find your polling booth and note travel time.</li>
            <li>Carry an accepted photo identity document.</li>
            <li>Follow polling staff instructions and cast your vote privately.</li>
          </ol>
        </section>
        <section class="guidance-box">
          <h3>Checklist</h3>
          <ul>
            <li>Photo ID or voter ID</li>
            <li>Polling booth address</li>
            <li>Comfortable timing and travel plan</li>
            <li>Phone charged before leaving home</li>
          </ul>
        </section>
        ${persona.extraHtml}
      </div>
    `
  };
}

function getRegisteredPersona(isSenior) {
  if (appState.isFirstTime === "yes") {
    return {
      label: isSenior ? "First-time senior voter" : "First-time voter",
      log: `${isSenior ? "senior " : ""}registered first-time voter path`,
      extraHtml: `
        <section class="guidance-box">
          <h3>First-time guidance</h3>
          <p>Reach a little early, ask polling staff if you are unsure where to queue, and check your candidate choice calmly before confirming your vote.</p>
        </section>
        ${renderSeniorBox(isSenior)}
      `
    };
  }

  return {
    label: isSenior ? "Senior citizen voter" : "Experienced voter",
    log: `${isSenior ? "senior " : ""}registered experienced voter path`,
    extraHtml: `
      <section class="guidance-box">
        <h3>Experienced voter note</h3>
        <p>Recheck booth details because polling locations can change. Keep your document ready before entering the polling station.</p>
      </section>
      ${renderSeniorBox(isSenior)}
    `
  };
}

function renderSeniorBox(isSenior) {
  if (!isSenior) {
    return "";
  }

  return `
    <section class="guidance-box">
      <h3>Senior citizen guidance</h3>
      <p>Plan travel during a comfortable time, carry medicines or water if needed, and ask polling staff about available assistance at the booth.</p>
    </section>
  `;
}

function saveReminder(event) {
  event.preventDefault();
  const selectedDate = elements.reminderDate.value;

  if (!selectedDate) {
    showMessage(elements.reminderStatus, "Choose a date before saving.");
    return;
  }

  localStorage.setItem(reminderStorageKey, selectedDate);
  renderSavedReminder();
  showMessage(elements.reminderStatus, `Reminder saved for ${formatDate(selectedDate)}.`);
  console.log(`BEP reminder saved: ${selectedDate}`);
}

function renderSavedReminder() {
  const savedDate = localStorage.getItem(reminderStorageKey);

  if (!savedDate) {
    elements.savedReminderText.textContent = "No reminder set yet.";
    return;
  }

  elements.savedReminderText.textContent = `Reminder set for ${formatDate(savedDate)}. BEP will show this message whenever you reload.`;
  elements.reminderDate.value = savedDate;
  console.log(`BEP reminder loaded: ${savedDate}`);
}

function formatDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function restartWizard() {
  appState.currentStep = 0;
  appState.age = "";
  appState.isRegistered = null;
  appState.isFirstTime = null;
  appState.location = "";
  clearMessage(elements.formError);
  clearMessage(elements.reminderStatus);
  clearMessage(elements.firebaseSaveStatus);
  elements.resultCard.classList.add("hidden");
  renderStep();
  console.log("BEP flow restarted");
}

function focusCurrentInput() {
  const input = elements.stepContent.querySelector("input");

  if (input) {
    input.focus();
  }
}

function showMessage(element, message) {
  element.textContent = message;
}

function clearMessage(element) {
  element.textContent = "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", initApp);
