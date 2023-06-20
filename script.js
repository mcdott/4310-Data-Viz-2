// Canvas and drawing variables
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = canvas.width / 5;

// Audio variables
let analyser;
let frequencyArray;

function startAudio() {
  const audio = new Audio();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  audio.src = "birds.mp3";

  // Create an audio analyser
  analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  frequencyArray = new Uint8Array(analyser.frequencyBinCount);

  audio.play();
  render();
}

function render() {
  ctx.clearRect(0, 0, 300, 300);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = "red";
  ctx.stroke();

  const bars = 200;
  const step = (Math.PI * 2) / bars;

  analyser.getByteFrequencyData(frequencyArray);

  frequencyArray.forEach((f, i) => {
    const barLength = f * 0.5;
    const x1 = Math.cos(step * i) * radius + centerX;
    const y1 = Math.sin(step * i) * radius + centerY;
    const x2 = Math.cos(step * i) * (radius + barLength) + centerX;
    const y2 = Math.sin(step * i) * (radius + barLength) + centerY;

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  });

  ctx.stroke();
  requestAnimationFrame(render);
}

const playButton = document.getElementById("button-play");
playButton.addEventListener("click", (e) => {
  startAudio();
});
