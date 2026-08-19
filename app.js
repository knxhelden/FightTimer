const DEFAULT_CONFIG = { roundMinutes: 2, roundSeconds: 0, totalRounds: 3 };

const ui = {
  shell: document.querySelector(".timer-shell"), clock: document.querySelector("#clock"),
  phase: document.querySelector("#phaseLabel"), caption: document.querySelector("#clockCaption"),
  round: document.querySelector("#roundNumber"), totalRounds: document.querySelector("#totalRoundsDisplay"),
  progress: document.querySelector("#progressBar"), status: document.querySelector("#statusText"),
  start: document.querySelector("#startButton"), startText: document.querySelector("#startButtonText"),
  pause: document.querySelector("#pauseButton"), pauseText: document.querySelector("#pauseButtonText"),
  pauseIcon: document.querySelector("#pauseIcon"), reset: document.querySelector("#resetButton"),
  audioError: document.querySelector("#audioError")
};

const sounds = {
  start: new Audio("round-start.mp3"), warning: new Audio("ten-seconds.mp3"),
  end: new Audio("round-end.mp3"), fightEnd: new Audio("fight-end.mp3")
};
Object.values(sounds).forEach((audio) => { audio.preload = "auto"; });

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
  return { ...DEFAULT_CONFIG };
}

let config = loadConfig();
let state = "ready";
let roundNumber = 1;
let remainingMs = getRoundDuration();
let breakElapsedMs = 0;
let anchorTime = 0;
let paused = false;
let warningPlayed = false;
let animationFrame = null;

function getRoundDuration() { return (config.roundMinutes * 60 + config.roundSeconds) * 1000; }

function formatTime(milliseconds, countUp = false) {
  const totalSeconds = countUp ? Math.floor(Math.max(0, milliseconds) / 1000) : Math.ceil(Math.max(0, milliseconds) / 1000);
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function durationLabel() {
  const parts = [];
  if (config.roundMinutes) parts.push(`${config.roundMinutes} ${config.roundMinutes === 1 ? "Minute" : "Minuten"}`);
  if (config.roundSeconds) parts.push(`${config.roundSeconds} Sekunden`);
  return parts.join(" ");
}

function playCue(cue) {
  Object.values(sounds).forEach((audio) => { audio.pause(); audio.currentTime = 0; });
  sounds[cue].play().then(() => { ui.audioError.textContent = ""; })
    .catch(() => { ui.audioError.textContent = "Audiodatei konnte nicht abgespielt werden."; });
}

function render() {
  ui.shell.dataset.mode = state;
  ui.round.textContent = roundNumber;
  ui.totalRounds.textContent = config.totalRounds;
  ui.pause.disabled = state === "ready" || state === "finished";
  ui.pauseText.textContent = paused ? "Fortsetzen" : "Pause";
  ui.pauseIcon.textContent = paused ? "▶" : "Ⅱ";

  if (state === "round") {
    ui.clock.textContent = formatTime(remainingMs);
    ui.clock.dateTime = `PT${Math.ceil(remainingMs / 1000)}S`;
    ui.phase.textContent = paused ? "RUNDE PAUSIERT" : "RUNDE LÄUFT";
    ui.caption.textContent = `Runde ${roundNumber} von ${config.totalRounds} · ${durationLabel()}`;
    ui.status.textContent = paused ? "Pausiert" : "Kampfzeit";
    ui.startText.textContent = "Runde neu starten";
    ui.progress.style.transform = `scaleX(${remainingMs / getRoundDuration()})`;
  } else if (state === "break") {
    ui.clock.textContent = formatTime(breakElapsedMs, true);
    ui.clock.dateTime = `PT${Math.floor(breakElapsedMs / 1000)}S`;
    ui.phase.textContent = paused ? "PAUSE ANGEHALTEN" : "RUNDENPAUSE";
    ui.caption.textContent = `Runde ${roundNumber} von ${config.totalRounds} abgeschlossen`;
    ui.status.textContent = paused ? "Pausiert" : "Pause läuft";
    ui.startText.textContent = "Nächste Runde starten";
    ui.progress.style.transform = "scaleX(1)";
  } else if (state === "finished") {
    ui.clock.textContent = "00:00";
    ui.clock.dateTime = "PT0S";
    ui.phase.textContent = "KAMPF BEENDET";
    ui.caption.textContent = `${config.totalRounds} Runden abgeschlossen`;
    ui.status.textContent = "Kampf beendet";
    ui.startText.textContent = "Neuen Kampf starten";
    ui.progress.style.transform = "scaleX(0)";
  } else {
    ui.clock.textContent = formatTime(getRoundDuration());
    ui.clock.dateTime = `PT${getRoundDuration() / 1000}S`;
    ui.phase.textContent = "BEREIT FÜR DIE NÄCHSTE RUNDE";
    ui.caption.textContent = `${config.totalRounds} Runden · ${durationLabel()}`;
    ui.status.textContent = "Bereit";
    ui.startText.textContent = "Runde starten";
    ui.progress.style.transform = "scaleX(1)";
  }
}

function tick(now) {
  if (paused) return;
  const elapsed = now - anchorTime;
  anchorTime = now;
  if (state === "round") {
    remainingMs = Math.max(0, remainingMs - elapsed);
    if (!warningPlayed && remainingMs <= 10000) { warningPlayed = true; playCue("warning"); }
    if (remainingMs === 0) {
      if (roundNumber >= config.totalRounds) { playCue("fightEnd"); state = "finished"; }
      else { playCue("end"); state = "break"; breakElapsedMs = 0; anchorTime = now; }
    }
  } else if (state === "break") breakElapsedMs += elapsed;
  render();
  if (state !== "finished") animationFrame = requestAnimationFrame(tick);
}

function startRound() {
  cancelAnimationFrame(animationFrame);
  if (state === "finished") { resetTimer(); }
  else if (state === "break") roundNumber += 1;
  state = "round";
  remainingMs = getRoundDuration();
  warningPlayed = false; paused = false; anchorTime = performance.now();
  playCue("start"); render(); animationFrame = requestAnimationFrame(tick);
}

function togglePause() {
  if (state === "ready" || state === "finished") return;
  paused = !paused; cancelAnimationFrame(animationFrame);
  if (!paused) { anchorTime = performance.now(); animationFrame = requestAnimationFrame(tick); }
  render();
}

function resetTimer() {
  cancelAnimationFrame(animationFrame);
  Object.values(sounds).forEach((audio) => { audio.pause(); audio.currentTime = 0; });
  state = "ready"; roundNumber = 1; remainingMs = getRoundDuration(); breakElapsedMs = 0;
  paused = false; warningPlayed = false; ui.audioError.textContent = ""; render();
}

ui.start.addEventListener("click", startRound);
ui.pause.addEventListener("click", togglePause);
ui.reset.addEventListener("click", resetTimer);
document.addEventListener("keydown", (event) => {
  if (event.repeat || event.target.matches("button, input")) return;
  if (event.code === "Space") { event.preventDefault(); startRound(); }
  else if (event.key.toLowerCase() === "p") togglePause();
  else if (event.key === "Escape") resetTimer();
});

render();
