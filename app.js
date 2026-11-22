"use strict";

const tracks = {
  "count-on-me": { speeds: [70, 89, 100, 120, 130], bpm: 89 },
  "listen-to-mom": { speeds: [60, 75, 90, 101, 115, 125], bpm: 90 },
};

const audio = document.querySelector("#audio");
const speedChoices = document.querySelector("#speeds");
const play = document.querySelector("#play");
const playText = document.querySelector("#play-text");
const restart = document.querySelector("#restart");
const progress = document.querySelector("#progress");
const elapsed = document.querySelector("#elapsed");
const duration = document.querySelector("#duration");
const status = document.querySelector("#status");
let currentSource;

function checked(name) {
  return document.querySelector(`input[name="${name}"]:checked`).value;
}

function showSpeeds() {
  const track = tracks[checked("song")];
  speedChoices.replaceChildren(...track.speeds.map((bpm) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "bpm";
    input.value = bpm;
    input.checked = bpm === track.bpm;
    const choice = document.createElement("span");
    choice.className = "choice";
    choice.textContent = bpm;
    label.append(input, choice);
    return label;
  }));
}

function showStatus(message = "") {
  status.textContent = message;
  status.hidden = !message;
}

function timeLabel(seconds) {
  const value = Math.floor(seconds);
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

function refreshTime() {
  const ready = Number.isFinite(audio.duration) && audio.duration > 0;
  progress.disabled = !ready;
  progress.max = ready ? audio.duration : 1;
  progress.value = ready ? audio.currentTime : 0;
  elapsed.textContent = timeLabel(audio.currentTime);
  duration.textContent = ready ? timeLabel(audio.duration) : "–:––";
}

function refreshPlayButton() {
  const playing = !audio.paused && !audio.ended;
  play.dataset.playing = String(playing);
  playText.textContent = playing ? "暂停" : "播放";
}

function resetSelection(event) {
  if (event.target.name === "song") showSpeeds();
  if (event.target.name === "bpm") tracks[checked("song")].bpm = Number(checked("bpm"));
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  currentSource = undefined;
  showStatus();
  refreshTime();
  refreshPlayButton();
}

async function playSelection(fromStart) {
  const source = `./audio/${checked("song")}-${checked("bpm")}-${checked("piano")}.mp3`;
  if (currentSource !== source || audio.error) {
    audio.src = source;
    currentSource = source;
  } else if (fromStart || audio.ended) {
    audio.currentTime = 0;
  }
  showStatus();
  try {
    await audio.play();
  } catch (error) {
    if (currentSource === source && error.name !== "AbortError") {
      showStatus("音频暂时无法播放，请再点一次播放。");
    }
  }
  refreshPlayButton();
}

showSpeeds();
document.querySelector(".practice").addEventListener("change", (event) => {
  if (event.target.type === "radio") resetSelection(event);
});
play.addEventListener("click", () => {
  if (audio.paused || audio.ended) playSelection(false);
  else audio.pause();
});
restart.addEventListener("click", () => playSelection(true));
progress.addEventListener("input", () => {
  if (!progress.disabled) audio.currentTime = Number(progress.value);
});
for (const event of ["timeupdate", "loadedmetadata", "durationchange", "seeked", "emptied"]) {
  audio.addEventListener(event, refreshTime);
}
for (const event of ["play", "pause", "ended", "emptied", "error"]) {
  audio.addEventListener(event, refreshPlayButton);
}
audio.addEventListener("waiting", () => {
  if (currentSource && !audio.paused) showStatus("正在加载音频…");
});
audio.addEventListener("playing", () => showStatus());
audio.addEventListener("pause", () => showStatus());
audio.addEventListener("error", () => {
  if (audio.error && currentSource) showStatus("音频暂时无法播放，请再点一次播放。");
});
