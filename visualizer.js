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
      this.height = micInput;
      //   this.x++;
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
      let color = "hsl(" + i + ", 100%, 50%)";
      let bar = new Bar(i * barWidth, 150, 2, canvas.height / 2, color);
      bars.push(bar);
    }
  }
  createBars();
  console.log(bars);

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // generate audio samples from the microphone
    // animate bars based on microphone input data
    bars.forEach((bar) => {
      bar.draw(ctx);
    });
    requestAnimationFrame(animate);
  }
  animate();
}
