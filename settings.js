const DEFAULT_CONFIG = { roundMinutes: 2, roundSeconds: 0, totalRounds: 3 };

const form = document.querySelector("#settingsForm");
const roundMinutes = document.querySelector("#roundMinutes");
const roundSeconds = document.querySelector("#roundSeconds");
const totalRounds = document.querySelector("#totalRounds");
const message = document.querySelector("#settingsMessage");

function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem("fightTimerConfig"));
    if (saved && Number.isInteger(saved.roundMinutes) && Number.isInteger(saved.roundSeconds)
      && Number.isInteger(saved.totalRounds) && saved.totalRounds >= 1 && saved.totalRounds <= 99
      && saved.roundMinutes >= 0 && saved.roundMinutes <= 59 && saved.roundSeconds >= 0
      && saved.roundSeconds <= 59 && saved.roundMinutes * 60 + saved.roundSeconds > 0) return saved;
  } catch (_) {
    // Invalid or unavailable storage simply falls back to the defaults.
  }
  return DEFAULT_CONFIG;
}

const config = loadConfig();
roundMinutes.value = config.roundMinutes;
roundSeconds.value = config.roundSeconds;
totalRounds.value = config.totalRounds;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const next = {
    roundMinutes: Number(roundMinutes.value),
    roundSeconds: Number(roundSeconds.value),
    totalRounds: Number(totalRounds.value)
  };
  if (!form.checkValidity()) { form.reportValidity(); return; }
  if (next.roundMinutes * 60 + next.roundSeconds === 0) {
    message.textContent = "Die Rundenzeit muss mindestens eine Sekunde betragen.";
    return;
  }
  try {
    localStorage.setItem("fightTimerConfig", JSON.stringify(next));
    message.textContent = "Einstellungen gespeichert.";
  } catch (_) {
    message.textContent = "Die Einstellungen konnten nicht im Browser gespeichert werden.";
  }
});
