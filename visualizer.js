function main() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  class Bar {
    constructor(x, y, width, height, color, index) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.color = color;
      this.index = index;
    }
    update(micInput, volumeThreshold) {
      const sound = micInput * 1000;
      if (volumeThreshold < micInput) {
        if (sound > this.height) {
          this.height = sound;
        }
      } else {
        this.height -= this.height * 0.03;
      }
    }

    // Horizontal bars
    // draw(context) {
    //   context.fillStyle = this.color;
    //   context.fillRect(this.x, this.y, this.width, this.height);
    // }

    // Radial bars around center point
    // draw(context) {
    //   context.strokeStyle = this.color;
    //   context.save();

    //   context.translate(canvas.width / 2, canvas.height / 2);
    //   context.rotate(this.index);
    //   context.beginPath();
    //   context.moveTo(0, 0);
    //   context.lineTo(0, this.height);
    //   context.stroke();

    //   context.restore();
    // }

    // Bars on bezier curve
    draw(context) {
      if (this.index % 3 === 0) {
        context.strokeStyle = this.color;
        context.lineWidth = this.width * 10;
        context.save();
        context.rotate(this.index * 0.043);
        context.beginPath();
        context.bezierCurveTo(
          this.x / 2,
          this.y / 2,
          this.height * -0.5 - 150,
          this.height + 50,
          this.x,
          this.y
        );
        context.stroke();

        // Adds circles on ends of bars
        if (this.index > 100) {
          context.fillStyle = this.color;
          context.beginPath();
          context.arc(
            this.x,
            this.y + this.height,
            this.height * 0.2,
            0,
            2 * Math.PI
          );
          context.stroke();
          context.fill();

          // Adds lines to connect circles to bars
          context.beginPath();
          context.moveTo(this.x, this.y);
          context.lineTo(this.x, this.y + this.height / 2);
          context.stroke();
        }
        context.restore();
      }
    }
  }

  let fftSize = 512;
  const microphone = new Microphone(fftSize);
  let bars = [];
  let barWidth = canvas.width / (fftSize / 2);
  function createBars() {
    for (let i = 0; i < fftSize / 2; i++) {
      let color = "hsl(" + i * 2 + ", 100%, 50%)";
      let bar = new Bar(0, i, 0.5, 250, color, i);
      bars.push(bar);
    }
  }
  createBars();

  let audioPlaying = false;
  const audioElement = new Audio(
    "http://localhost:5501/looperman-l-5384552-0327014-vintage-soul-keyboard.wav"
  );
  let audioStartTime = 0;
  let audioStopTime = 0;

  const audioPlayDuration = 5000; // 5 seconds
  const pauseAfterPlay = 1000; // 1 seconds

  function animate() {
    if (microphone.initialized) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const samples = microphone.getSamples();
      const volume = microphone.getVolume();
      console.log(`Volume: ${volume}`);

      const volumeThreshold = 0.2; // For animation
      const audioTriggerThreshold = 0.5; // For audio trigger
      const currentTime = performance.now();

      if (audioPlaying) {
        if (currentTime - audioStartTime > audioPlayDuration) {
          audioPlaying = false;
          audioElement.pause();
          audioElement.currentTime = 0;
          audioStopTime = currentTime;
        }
      } else if (
        !audioPlaying &&
        currentTime - audioStopTime > pauseAfterPlay &&
        volume > audioTriggerThreshold // Change here
      ) {
        audioPlaying = true;
        audioElement.play().catch((error) => {
          console.error("Error during audio playback:", error);
        });
        audioStartTime = currentTime;
      }

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      bars.forEach((bar, i) => {
        bar.update(samples[i], volumeThreshold); // Animation still based on volumeThreshold
        bar.draw(ctx, volume);
      });
      ctx.restore();
    }
    requestAnimationFrame(animate);
  }

  animate();
}
