const DEFAULT_CONFIG = {
  roundMinutes: 2,
  roundSeconds: 0,
  totalRounds: 3,
  warningSeconds: 10,
  sounds: {
    start: "round-start.mp3",
    warning: "ten-seconds.mp3",
    end: "round-end.mp3",
    fightEnd: "fight-end.mp3"
  }
};

const form = document.querySelector("#settingsForm");
const roundMinutes = document.querySelector("#roundMinutes");
const roundSeconds = document.querySelector("#roundSeconds");
const totalRounds = document.querySelector("#totalRounds");
const warningSeconds = document.querySelector("#warningSeconds");
const soundInputs = {
  start: document.querySelector("#startSound"),
  warning: document.querySelector("#warningSound"),
  end: document.querySelector("#endSound"),
  fightEnd: document.querySelector("#fightEndSound")
};
const message = document.querySelector("#settingsMessage");

function isValidFilename(value) {
  return typeof value === "string" && value.trim() !== "" && !/[\\/]/.test(value);
}

function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem("fightTimerConfig"));
    if (saved && Number.isInteger(saved.roundMinutes) && Number.isInteger(saved.roundSeconds)
      && Number.isInteger(saved.totalRounds) && saved.totalRounds >= 1 && saved.totalRounds <= 99
      && saved.roundMinutes >= 0 && saved.roundMinutes <= 59 && saved.roundSeconds >= 0
      && saved.roundSeconds <= 59 && saved.roundMinutes * 60 + saved.roundSeconds > 0) {
      const duration = saved.roundMinutes * 60 + saved.roundSeconds;
      const candidate = {
        ...DEFAULT_CONFIG,
        ...saved,
        warningSeconds: Number.isInteger(saved.warningSeconds)
          ? saved.warningSeconds : Math.min(DEFAULT_CONFIG.warningSeconds, duration),
        sounds: { ...DEFAULT_CONFIG.sounds, ...saved.sounds }
      };
      if (!Number.isInteger(candidate.warningSeconds) || candidate.warningSeconds < 1
        || candidate.warningSeconds > duration
        || !Object.values(candidate.sounds).every(isValidFilename)) return DEFAULT_CONFIG;
      return candidate;
    }
  } catch (_) {
    // Invalid or unavailable storage simply falls back to the defaults.
  }
  return DEFAULT_CONFIG;
}

const config = loadConfig();
roundMinutes.value = config.roundMinutes;
roundSeconds.value = config.roundSeconds;
totalRounds.value = config.totalRounds;
warningSeconds.value = config.warningSeconds;
Object.entries(soundInputs).forEach(([cue, input]) => { input.value = config.sounds[cue]; });

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const next = {
    roundMinutes: Number(roundMinutes.value),
    roundSeconds: Number(roundSeconds.value),
    totalRounds: Number(totalRounds.value),
    warningSeconds: Number(warningSeconds.value),
    sounds: Object.fromEntries(Object.entries(soundInputs).map(([cue, input]) => [cue, input.value.trim()]))
  };
  if (!form.checkValidity()) { form.reportValidity(); return; }
  if (next.roundMinutes * 60 + next.roundSeconds === 0) {
    message.textContent = "Die Rundenzeit muss mindestens eine Sekunde betragen.";
    return;
  }
  if (next.warningSeconds > next.roundMinutes * 60 + next.roundSeconds) {
    message.textContent = "Die Rundenwarnung muss innerhalb der Rundenzeit liegen.";
    return;
  }
  if (!Object.values(next.sounds).every(isValidFilename)) {
    message.textContent = "Bitte nur Dateinamen ohne Verzeichnisangaben eintragen.";
    return;
  }
  try {
    localStorage.setItem("fightTimerConfig", JSON.stringify(next));
    message.textContent = "Einstellungen gespeichert.";
  } catch (_) {
    message.textContent = "Die Einstellungen konnten nicht im Browser gespeichert werden.";
  }
});
