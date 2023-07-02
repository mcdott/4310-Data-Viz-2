function main() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  class Bar {
    constructor(x, y, width, height, color) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.color = color;
    }
    update(micInput) {
      this.height = micInput * 1000;
    }
    draw(context) {
      context.fillStyle = this.color;
      context.fillRect(this.x, this.y, this.width, this.height);
    }
  }
  const microphone = new Microphone();
  let bars = [];
  let barWidth = canvas.width / 256;
  function createBars() {
    for (let i = 0; i < 256; i++) {
      let color = "hsl(" + i * 2 + ", 100%, 50%)";
      let bar = new Bar(i * barWidth, 150, 2, canvas.height / 2, color);
      bars.push(bar);
    }
  }
  createBars();

  function animate() {
    if (microphone.initialized) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // generates audio samples from the microphone
      const samples = microphone.getSamples();
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
