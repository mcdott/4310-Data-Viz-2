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
      this.height = micInput * 1000;
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
    draw(context, volume) {
      context.fillStyle = this.color;
      context.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  let fftSize = 512;
  const microphone = new Microphone(fftSize);
  let bars = [];
  let barWidth = canvas.width / (fftSize / 2);
  function createBars() {
    for (let i = 0; i < fftSize / 2; i++) {
      //   let color = "hsl(" + i * 2 + ", 100%, 50%)";
      let bar = new Bar(i * barWidth, 300, 0.5, 250, "red", i);
      bars.push(bar);
    }
  }
  createBars();

  function animate() {
    if (microphone.initialized) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // generates audio samples from the microphone
      const samples = microphone.getSamples();
      console.log(samples);
      // animate bars based on microphone input data
      bars.forEach((bar, i) => {
        bar.update(samples[i]);
        bar.draw(ctx);
      });
    }
    requestAnimationFrame(animate);
  }
  animate();
}
