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
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Get user's microphone
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      // Create an audio analyser
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      frequencyArray = new Uint8Array(analyser.frequencyBinCount);
      render();
    })
    .catch((err) => {
      console.log("Error: " + err);
    });
}

function render() {
  ctx.clearRect(0, 0, 300, 300);
  ctx.beginPath();

  const bars = 200;
  const step = (Math.PI * 2) / bars;

  analyser.getByteFrequencyData(frequencyArray);
  console.log(frequencyArray);

  frequencyArray.forEach((f, i) => {
    const barLength = f;
    const x1 = Math.cos(step * i) * radius + centerX;
    const y1 = Math.sin(step * i) * radius + centerY;
    const x2 = Math.cos(step * i) * (radius + barLength) + centerX;
    const y2 = Math.sin(step * i) * (radius + barLength) + centerY;

    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
  });

  ctx.strokeStyle = "red";
  ctx.stroke();
  requestAnimationFrame(render);
}

const playButton = document.getElementById("button-play");
playButton.addEventListener("click", startAudio);
