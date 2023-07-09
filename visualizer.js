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
    update(micInput) {
      const sound = micInput * 1000;
      if (sound > this.height) {
        this.height = sound;
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

    // Bars above and below horizontal line
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

  function animate() {
    if (microphone.initialized) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // generates audio samples from the microphone
      const samples = microphone.getSamples();
      const volume = microphone.getVolume();
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      // animate bars based on microphone input data
      bars.forEach((bar, i) => {
        bar.update(samples[i]);
        bar.draw(ctx, volume);
      });
      ctx.restore();
    }
    requestAnimationFrame(animate);
  }
  animate();
}
