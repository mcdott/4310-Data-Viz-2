// Define the setup and draw functions for p5.js
let lookup;
let maxBallRadius;
let lookupGridSize;
let invLookupGridSize;
let lookupWidth;
let balls;
let frequencyArray = [];

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight).canvas;
  canvas.style.touchAction = "none";
  //pixelDensity(1);
  colorMode(HSB, 360, 100, 100, 100);
  background(100);

  // Init ball max radius
  maxBallRadius = min(width, height) * 0.03;
  // Init lookup grid stuff
  lookupGridSize = ceil(maxBallRadius * 2);
  invLookupGridSize = 1 / lookupGridSize;
  lookupWidth = ceil(width / lookupGridSize);
  lookup = [];

  mouseHistory = [];

  // generate balls
  balls = new Array(300).fill().map((_, i) => {
    return new Ball({
      x: random(-1, 1) * width * 0.2 + width / 2,
      y: random(1) * height,
      radius: map(random(1) ** 5, 0, 1, 0.5, 1) * maxBallRadius,
      damping: 0.999,
    });
  });

  // Audio setup
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
    })
    .catch((err) => {
      console.log("Error: " + err);
    });
}

// This replaces the 'mouseHistory' from the Googlies sketch with 'bars' from the audio visualizer
// each bar is treated as a line segment for collision with the googlie balls
function draw() {
  background(210, 50, 30);
  // begin the path
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width / 100;
  const bars = frequencyArray.length;
  const step = (Math.PI * 2) / bars;
  const minVolumeThreshold = 100;

  // get the frequency data
  analyser.getByteFrequencyData(frequencyArray);

  // Draws frequency bars from the visualizer here - `frequencyArray` is the array of frequency data from the audio visualizer
  frequencyArray.forEach((f, i) => {
    if (f > minVolumeThreshold) {
      // draw the bar
      const barLength = f;
      const x1 = Math.cos(step * i) * radius + centerX;
      const y1 = Math.sin(step * i) * radius + centerY;
      const x2 = Math.cos(step * i) * (radius + barLength) + centerX;
      const y2 = Math.sin(step * i) * (radius + barLength) + centerY;
      // Draw the line/bar representing the audio frequency
      stroke(0, 100, 100, 50);
      strokeWeight(2);
      line(x1, y1, x2, y2);
    }
  });

  blendMode(BLEND);
  for (let t = 6; t--; ) {
    let nextLookup = [];
    balls = balls.map((ball, i, _balls) => {
      if (t === 0) {
        // DRAW
        // ... your drawing code ...
        return ball;
      } else {
        // UPDATE
        const newBall = ball.copy();

        const closeBy = getLookupRadius(newBall.x, newBall.y, 1);
        closeBy.forEach((otherBall) => {
          if (ball !== otherBall) {
            newBall.repel(
              otherBall.x,
              otherBall.y,
              otherBall.radius + maxBallRadius * 0.02,
              -1
            );
            newBall.collideBall(otherBall);
          }
        });

        newBall.attract(width / 2, height / 2, 0.005);
        newBall.constrain(0, 0, width, height);

        // // REPLACE THIS PART
        // frequencyArray.forEach((f, i) => {
        //   if (f > minVolumeThreshold) {
        //     const barLength = f;
        //     const x1 = Math.cos(step * i) * radius + centerX;
        //     const y1 = Math.sin(step * i) * radius + centerY;
        //     const x2 = Math.cos(step * i) * (radius + barLength) + centerX;
        //     const y2 = Math.sin(step * i) * (radius + barLength) + centerY;
        //     newBall.collideLine(x1, y1, x2, y2);
        //   }
        // });

        newBall.update(0.2);
        addToLookup(newBall, nextLookup);
        return newBall;
      }
    });
    lookup = nextLookup;
  }
}

// This adds the audio setup and render functions

// Canvas and drawing variables
// const canvas = document.getElementById("canvas");
// const ctx = canvas.getContext("2d");
// const centerX = canvas.width / 2;
// const centerY = canvas.height / 2;
// const radius = canvas.width / 100;

// Audio variables
let analyser;

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

// function render() {
//   // begin the path
//   ctx.beginPath();

//   const bars = frequencyArray.length;
//   const step = (Math.PI * 2) / bars;

//   // get the frequency data and render it
//   analyser.getByteFrequencyData(frequencyArray);

//   const minVolumeThreshold = 100;

//   frequencyArray.forEach((f, i) => {
//     if (f > minVolumeThreshold) {
//       const barLength = f;
//       const x1 = Math.cos(step * i) * radius + centerX;
//       const y1 = Math.sin(step * i) * radius + centerY;
//       const x2 = Math.cos(step * i) * (radius + barLength) + centerX;
//       const y2 = Math.sin(step * i) * (radius + barLength) + centerY;

//       // draw lines
//       ctx.lineTo(x1, y1);
//       ctx.lineTo(x2, y2);
//     }
//   });

//   // stroke path
//   ctx.strokeStyle = "red";
//   ctx.lineWidth = 2;
//   ctx.lineCap = "round";
//   ctx.stroke();

//   // Call the p5.js draw function
//   draw();

//   // request next frame
//   requestAnimationFrame(render);
// }

// Event listener for the start button
const playButton = document.getElementById("button-play");
playButton.addEventListener("click", startAudio);

/*****************************
 ** Look up stuff for balls **
 *****************************/
function lookupAtPos(x, y) {
  const lookupIndex = getLookupIndex(x, y);
  return lookupAtIndex(lookupIndex);
}

function lookupAtIndex(i) {
  return lookup[i];
}

function addToLookup(p, lookupRef) {
  const lookupIndex = getLookupIndex(p.x, p.y);
  if (!lookupRef[lookupIndex]) {
    lookupRef[lookupIndex] = [];
  }
  lookupRef[lookupIndex].push(p);
}

function getLookupIndex(x, y) {
  // const lookupX = (x / lookupGridSize) | 0;
  // const lookupY = (y / lookupGridSize) | 0;
  return (
    ((y * invLookupGridSize) | 0) * lookupWidth + ((x * invLookupGridSize) | 0)
  );
}

function getLookupRadius(x, y, r = 1) {
  let result = [];
  const lookupIndex = getLookupIndex(x, y);
  for (let j = -r; j < r + 1; j++) {
    for (let i = -r; i < r + 1; i++) {
      // const offset = j * lookupWidth + i;
      const partialResult = lookupAtIndex(lookupIndex + j * lookupWidth + i);
      if (partialResult) {
        result = result.concat(partialResult);
      }
    }
  }
  return result;
}

/*** BALL CLASS ***/
class Ball {
  constructor({ x, y, radius, damping, friction, parent, color = 0 }) {
    this.x = x;
    this.y = y;
    this.oldx = x;
    this.oldy = y;
    this.nextx = x;
    this.nexty = y;
    this.delayedx = x;
    this.delayedy = y;
    this.radius = radius || 10;
    this.originalRadius = radius;
    this.damping = damping || 0.9;
    this.friction = friction || 0.1;
    this.parent = parent;
    this.maxVelocity = 50;
    this.color = color;
  }

  copy() {
    let newBall = new Ball({ ...this });
    newBall.oldx = this.oldx;
    newBall.oldy = this.oldy;
    newBall.nextx = this.nextx;
    newBall.nexty = this.nexty;
    newBall.delayedx = this.delayedx;
    newBall.delayedy = this.delayedy;
    newBall.maxVelocity = this.maxVelocity;
    return newBall;
  }

  addForce(x, y, instant = false) {
    this.nextx += x;
    this.nexty += y;

    if (false && instant) {
      this.delayedx = lerp(this.delayedx, this.nextx, 0.25);
      this.delayedy = lerp(this.delayedy, this.nexty, 0.25);
    }
  }

  attract(otherX, otherY, strength = 1) {
    const diffx = otherX - this.x;
    const diffy = otherY - this.y;
    const mag = diffx * diffx + diffy * diffy;
    if (mag > 0.01) {
      const magSqrt = 1 / sqrt(mag);
      this.addForce(
        diffx * magSqrt * strength, // force x
        diffy * magSqrt * strength // force y
      );
    }
  }

  repel(otherX, otherY, radius = 1, strength = 1) {
    const diffx = this.x - otherX;
    const diffy = this.y - otherY;
    const mag = diffx * diffx + diffy * diffy;
    const combinedRadius = radius + this.radius;
    const minDist = combinedRadius * combinedRadius;
    if (mag > 0 && mag < minDist) {
      const magSqrt = 1 / sqrt(mag);
      const forceX = diffx * magSqrt * strength;
      const forceY = diffy * magSqrt * strength;
      this.addForce(forceX, forceY);
      return { x: forceX, y: forceY };
    }

    return null;
  }

  collideBall(otherBall) {
    const diffx = otherBall.x - this.x;
    const diffy = otherBall.y - this.y;
    let diffMag = diffx * diffx + diffy * diffy;
    const combinedRadius = otherBall.radius + this.radius;
    if (diffMag < combinedRadius * combinedRadius) {
      diffMag = sqrt(diffMag);
      const forceMag = ((diffMag - combinedRadius) / diffMag) * 0.5;
      const velX = 0; //((otherBall.x - otherBall.oldx) - (this.x - this.oldx))/4;
      const velY = 0; //((otherBall.y - otherBall.oldy) - (this.y - this.oldy))/4;
      this.addForce((diffx - velX) * forceMag, (diffy - velY) * forceMag, true);
    }
  }

  collide(otherX, otherY, otherRadius) {
    const diffx = otherX - this.x;
    const diffy = otherY - this.y;
    let diffMag = diffx * diffx + diffy * diffy;
    const combinedRadius = otherRadius + this.radius;
    if (diffMag < combinedRadius * combinedRadius) {
      diffMag = sqrt(diffMag);
      const forceMag = ((diffMag - combinedRadius) / diffMag) * 0.5;
      this.addForce(diffx * forceMag, diffy * forceMag, true);
    }
  }

  constrain(left, top, right, bottom) {
    const { x, y, oldx, oldy, friction, radius } = this;
    const vx = (x - oldx) * friction;
    const vy = (y - oldy) * friction;

    left += radius;
    top += radius;
    right -= radius;
    bottom -= radius;

    if (x > right) {
      this.x = right;
      this.oldx = x + vx;
    } else if (x < left) {
      this.x = left;
      this.oldx = x + vx;
    }
    if (y > bottom) {
      this.y = bottom;
      this.oldy = y + vy;
    } else if (y < top) {
      this.y = top;
      this.oldy = y + vy;
    }
  }

  update(dt = 1) {
    let vx = this.x - this.oldx;
    let vy = this.y - this.oldy;
    this.oldx = this.x - vx * this.damping * (1 - dt);
    this.oldy = this.y - vy * this.damping * (1 - dt);
    this.x = this.nextx + vx * this.damping * dt;
    this.y = this.nexty + vy * this.damping * dt;
    this.delayedx = lerp(this.delayedx, this.x, 0.05);
    this.delayedy = lerp(this.delayedy, this.y, 0.05);
    this.nextx = this.x;
    this.nexty = this.y;
  }
}
