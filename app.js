const ROUND_DURATION_MS = 2 * 60 * 1000;

const ui = {
  shell: document.querySelector(".timer-shell"),
  clock: document.querySelector("#clock"),
  phase: document.querySelector("#phaseLabel"),
  caption: document.querySelector("#clockCaption"),
  round: document.querySelector("#roundNumber"),
  progress: document.querySelector("#progressBar"),
  status: document.querySelector("#statusText"),
  start: document.querySelector("#startButton"),
  startText: document.querySelector("#startButtonText"),
  pause: document.querySelector("#pauseButton"),
  pauseText: document.querySelector("#pauseButtonText"),
  pauseIcon: document.querySelector("#pauseIcon"),
  reset: document.querySelector("#resetButton"),
  audioError: document.querySelector("#audioError")
};

const sounds = {
  start: new Audio("round-start.mp3"),
  warning: new Audio("ten-seconds.mp3"),
  end: new Audio("round-end.mp3")
};
Object.values(sounds).forEach((audio) => { audio.preload = "auto"; });

let state = "ready";
let roundNumber = 1;
let remainingMs = ROUND_DURATION_MS;
let breakElapsedMs = 0;
let anchorTime = 0;
let paused = false;
let warningPlayed = false;
let animationFrame = null;

function formatTime(milliseconds, countUp = false) {
  const totalSeconds = countUp
    ? Math.floor(Math.max(0, milliseconds) / 1000)
    : Math.ceil(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function playCue(cue) {
  Object.values(sounds).forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  sounds[cue].play()
    .then(() => { ui.audioError.textContent = ""; })
    .catch(() => { ui.audioError.textContent = "Audiodatei konnte nicht abgespielt werden."; });
}

function render() {
  ui.shell.dataset.mode = state;
  ui.round.textContent = roundNumber;
  ui.pause.disabled = state === "ready";
  ui.pauseText.textContent = paused ? "Fortsetzen" : "Pause";
  ui.pauseIcon.textContent = paused ? "▶" : "Ⅱ";

  if (state === "round") {
    ui.clock.textContent = formatTime(remainingMs);
    ui.clock.dateTime = `PT${Math.ceil(remainingMs / 1000)}S`;
    ui.phase.textContent = paused ? "RUNDE PAUSIERT" : "RUNDE LÄUFT";
    ui.caption.textContent = `Runde ${roundNumber} · 2 Minuten`;
    ui.status.textContent = paused ? "Pausiert" : "Kampfzeit";
    ui.startText.textContent = "Runde neu starten";
    ui.progress.style.transform = `scaleX(${remainingMs / ROUND_DURATION_MS})`;
  } else if (state === "break") {
    ui.clock.textContent = formatTime(breakElapsedMs, true);
    ui.clock.dateTime = `PT${Math.floor(breakElapsedMs / 1000)}S`;
    ui.phase.textContent = paused ? "PAUSE ANGEHALTEN" : "RUNDENPAUSE";
    ui.caption.textContent = "Pausenzeit · zählt aufwärts";
    ui.status.textContent = paused ? "Pausiert" : "Pause läuft";
    ui.startText.textContent = "Nächste Runde starten";
    ui.progress.style.transform = "scaleX(1)";
  } else {
    ui.clock.textContent = "02:00";
    ui.clock.dateTime = "PT2M";
    ui.phase.textContent = "BEREIT FÜR DIE NÄCHSTE RUNDE";
    ui.caption.textContent = "Rundenzeit";
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
    if (!warningPlayed && remainingMs <= 10000) {
      warningPlayed = true;
      playCue("warning");
    }
    if (remainingMs === 0) {
      playCue("end");
      state = "break";
      breakElapsedMs = 0;
      anchorTime = now;
    }
  } else if (state === "break") {
    breakElapsedMs += elapsed;
  }

  render();
  animationFrame = requestAnimationFrame(tick);
}

function startRound() {
  cancelAnimationFrame(animationFrame);
  if (state === "break") roundNumber += 1;
  state = "round";
  remainingMs = ROUND_DURATION_MS;
  warningPlayed = false;
  paused = false;
  anchorTime = performance.now();
  playCue("start");
  render();
  animationFrame = requestAnimationFrame(tick);
}

function togglePause() {
  if (state === "ready") return;
  paused = !paused;
  cancelAnimationFrame(animationFrame);
  if (!paused) {
    anchorTime = performance.now();
    animationFrame = requestAnimationFrame(tick);
  }
  render();
}

function resetTimer() {
  cancelAnimationFrame(animationFrame);
  Object.values(sounds).forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  state = "ready";
  roundNumber = 1;
  remainingMs = ROUND_DURATION_MS;
  breakElapsedMs = 0;
  paused = false;
  warningPlayed = false;
  ui.audioError.textContent = "";
  render();
}

ui.start.addEventListener("click", startRound);
ui.pause.addEventListener("click", togglePause);
ui.reset.addEventListener("click", resetTimer);
document.addEventListener("keydown", (event) => {
  if (event.repeat || event.target.matches("button")) return;
  if (event.code === "Space") {
    event.preventDefault();
    startRound();
  } else if (event.key.toLowerCase() === "p") {
    togglePause();
  } else if (event.key === "Escape") {
    resetTimer();
  }
});

render();
