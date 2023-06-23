let lookup;
let maxBallRadius;
let lookupGridSize;
let invLookupGridSize;
let lookupWidth;
let mouseHistory;
let balls;
let smoothing = 0.8;
let binCount = 16; // Group every 20 bars into one

let colorPalette = ["#02073c", "#fd3a69", "#fecd1a", "#d0e1f9", "#ffffff"];
let ballArray = [];
let fft, mic;
let fftBands;
let minVolumeThreshold = 200;

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

  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT(smoothing, binCount);
  fft.setInput(mic);
}

function draw() {
  fftBands = fft.analyze(); // this is where fftBands gets defined
  background(210, 50, 30);

  while (mouseHistory.length && mouseHistory[mouseHistory.length - 1][2] < 0) {
    mouseHistory.pop();
  }
  if (pmouseX !== mouseX || pmouseY !== mouseY) {
    const mx = mouseX;
    const my = mouseY;
    const mouseTTL = 10;
    if (mouseHistory.length) {
      const [prevx, prevy] = mouseHistory[0];
      const dx = mx - prevx;
      const dy = my - prevy;
      const d = sqrt(dx * dx + dy * dy);
      if (d > 10) {
        const fillCount = floor(d / 10);
        for (let t = 0; t < fillCount; t++) {
          const dt = 1 - t / fillCount;
          mouseHistory.unshift([
            lerp(prevx, mx, dt),
            lerp(prevy, my, dt),
            mouseTTL,
          ]);
        }
      }
    }
    mouseHistory.unshift([mouseX, mouseY, mouseTTL]);
  }

  blendMode(ADD);
  noFill();
  stroke(0, 100, 100, 50);
  strokeWeight(10);
  beginShape();
  mouseHistory = mouseHistory.map(([x, y, t]) => {
    vertex(x, y);
    return [x, y, t - 1];
  });
  endShape();

  blendMode(BLEND);
  for (let t = 6; t--; ) {
    let nextLookup = [];
    balls = balls.map((ball, i, _balls) => {
      if (t === 0) {
        // DRAW
        push();
        const isEye = i % 10 === 0;
        const idd = i % 6;
        const huu = (idd * 30 + 200) % 360;
        const sat = 40 + idd * 3;
        const bri = isEye ? 100 : 100 - idd * 4;
        translate(ball.delayedx, ball.delayedy);
        rotate(
          i * 77.77 + (noise(i * 33.333, frameCount * 0.005) * 2 - 1) * TWO_PI
        );

        const eyeMult = isEye ? 1.25 : 1;

        /*
				strokeWeight(ball.radius*1.75*eyeMult+10);
				stroke(huu,2,0,20);
				point(0,0);
				*/

        strokeWeight(ball.radius * 2 - 5);
        stroke(huu - 80, isEye ? 0 : sat, bri);
        point(0, 0);

        if (isEye) {
          strokeWeight(ball.radius * 0.87);
          stroke(0);
          point(
            ball.radius *
              (noise(i * 77.77 + 123, frameCount * 0.01) * 2 - 1) *
              0.5,
            0
          );
        }

        pop();

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

        //newBall.addForce(0,0.05);
        newBall.attract(width / 2, height / 2, 0.005);
        newBall.constrain(0, 0, width, height);
        mouseHistory.forEach(([mx, my]) => {
          newBall.collide(mx, my, 20);
        });
        fftBands.forEach((energy, index) => {
          // Only process bands with energy above the threshold
          if (energy > minVolumeThreshold) {
            // Calculate the position of the top of the bar
            let barX = map(index, 0, fftBands.length, 0, width);
            let barY = map(energy, 0, 255, height, 0);

            // Tip of bar position to use for collision detection
            newBall.collide(barX, barY, 10); // Adjust the radius as needed
          }
        });
        newBall.update(0.2);
        addToLookup(newBall, nextLookup);
        return newBall;
      }
    });
    lookup = nextLookup;
  }

  // draw audio visualizer colour spectrum
  let spectrum = fft.analyze();
  noStroke();
  for (let i = 0; i < spectrum.length; i++) {
    // Only draw bars for bands with energy above the threshold
    if (spectrum[i] > minVolumeThreshold) {
      let x = map(i, 0, spectrum.length, 0, width);
      let h = -height + map(spectrum[i], 0, 255, height, 0);
      fill(i, 255, 255);
      rect(x, height, width / spectrum.length, h);

      // repel balls from the audio visualizer bars
      let barHeight = map(spectrum[i], 0, 255, 0, height);
      balls.forEach((ball) => {
        ball.repel(x, height - barHeight, (width / spectrum.length) * 2, -0.5);
      });
    }
  }
}

/******************
 ** Look up stuff **
 ******************/
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
