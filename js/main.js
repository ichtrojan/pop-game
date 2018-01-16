window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||

    function(callback) {
      window.setTimeout(callback, 1000 / 60);
    };
})();

var POP = {
  WIDTH: 320,
  HEIGHT: 480,
  scale: 1,

  // the position of the canvas in relation to the screen
  offset: {
    top: 0,
    left: 0
  },

  entities: [],
  nextBubble: 100,

  score: {
    taps: 0,
    hit: 0,
    escaped: 0,
    accuracy: 0
  },

  RATIO: null,
  currentWidth: null,
  currentHeight: null,
  canvas: null,
  ctx: null,
  ua: null,
  android: null,
  ios: null,

  init: function() {

    POP.RATIO = POP.WIDTH / POP.HEIGHT;
    POP.currentWidth = POP.WIDTH;
    POP.currentHeight = POP.HEIGHT;
    POP.canvas = document.getElementsByTagName('canvas')[0];
    POP.canvas.width = POP.WIDTH;
    POP.canvas.height = POP.HEIGHT;
    POP.ctx = POP.canvas.getContext('2d');
    POP.ua = navigator.userAgent.toLowerCase();
    POP.android = POP.ua.indexOf('android') > -1 ? true : false;
    POP.ios = (POP.ua.indexOf('iphone') > -1 || POP.ua.indexOf('ipad') > -1) ? true : false;

    POP.wave = {
      x: -25,
      y: -40,
      r: 50,
      time: 0,
      offset: 0
    };

    POP.wave.total = Math.ceil(POP.WIDTH / POP.wave.r) + 1;

    // listen for clicks
    window.addEventListener('click', function(e) {
      e.preventDefault();
      POP.Input.set(e);
    }, false);

    // listen for touches
    window.addEventListener('touchstart', function(e) {
      e.preventDefault();
      POP.Input.set(e.touches[0]);
    }, false);

    window.addEventListener('touchmove', function(e) {
      e.preventDefault();
    }, false);

    window.addEventListener('touchend', function(e) {
      e.preventDefault();
    }, false);

    POP.resize();

    POP.loop();
  },


  resize: function() {

    POP.currentHeight = window.innerHeight;
    POP.currentWidth = POP.currentHeight * POP.RATIO;

    if (POP.android || POP.ios) {
      document.body.style.height = (window.innerHeight + 50) + 'px';
    }

    POP.canvas.style.width = POP.currentWidth + 'px';
    POP.canvas.style.height = POP.currentHeight + 'px';
    POP.scale = POP.currentWidth / POP.WIDTH;
    POP.offset.top = POP.canvas.offsetTop;
    POP.offset.left = POP.canvas.offsetLeft;

    window.setTimeout(function() {
      window.scrollTo(0, 1);
    }, 1);
  },

  update: function() {
    var i, checkCollision = false;

    POP.nextBubble -= 1;

    if (POP.nextBubble < 0) {
      POP.entities.push(new POP.Bubble());
      POP.nextBubble = (Math.random() * 100) + 100;
    }

    if (POP.Input.tapped) {
      POP.score.taps += 1;
      POP.entities.push(new POP.Touch(POP.Input.x, POP.Input.y));
      POP.Input.tapped = false;
      checkCollision = true;
    }

    // cycle through all entities and update as necessary
    for (i = 0; i < POP.entities.length; i += 1) {
      POP.entities[i].update();

      if (POP.entities[i].type === 'bubble' && checkCollision) {
        hit = POP.collides(POP.entities[i], {
          x: POP.Input.x,
          y: POP.Input.y,
          r: 7
        });

        if (hit) {
          for (var n = 0; n < 5; n += 1) {
            POP.entities.push(new POP.Particle(
              POP.entities[i].x,
              POP.entities[i].y,
              2,
              'rgba(255,255,255,' + Math.random() * 1 + ')'
            ));
          }
          POP.score.hit += 1;
        }

        POP.entities[i].remove = hit;
      }

      if (POP.entities[i].remove) {
        POP.entities.splice(i, 1);
      }
    }

    POP.wave.time = new Date().getTime() * 0.002;
    POP.wave.offset = Math.sin(POP.wave.time * 0.8) * 5;

    // calculate accuracy
    POP.score.accuracy = (POP.score.hit / POP.score.taps) * 100;
    POP.score.accuracy = isNaN(POP.score.accuracy) ? 0 : ~~(POP.score.accuracy);

  },


  // this is where we draw all the entities
  render: function() {

    var i;

    POP.Draw.rect(0, 0, POP.WIDTH, POP.HEIGHT, '#036');

    for (i = 0; i < POP.wave.total; i++) {
      POP.Draw.circle(
        POP.wave.x + POP.wave.offset + (i * POP.wave.r),
        POP.wave.y,
        POP.wave.r,
        '#fff'
      );
    }

    // cycle through all entities and render to canvas
    for (i = 0; i < POP.entities.length; i += 1) {
      POP.entities[i].render();
    }

    // display scores
    POP.Draw.text('Hit: ' + POP.score.hit, 20, 30, 14, '#fff');
    POP.Draw.text('Escaped: ' + POP.score.escaped, 20, 50, 14, '#fff');
    POP.Draw.text('Accuracy: ' + POP.score.accuracy + '%', 20, 70, 14, '#fff');

  },

  loop: function() {
    requestAnimFrame(POP.loop);
    POP.update();
    POP.render();
  }
};

// checks if two entties are touching
POP.collides = function(a, b) {
  var distance_squared = (((a.x - b.x) * (a.x - b.x)) + ((a.y - b.y) * (a.y - b.y)));
  var radii_squared = (a.r + b.r) * (a.r + b.r);

  if (distance_squared < radii_squared) {
    return true;
  } else {
    return false;
  }
};

POP.Draw = {
  clear: function() {
    POP.ctx.clearRect(0, 0, POP.WIDTH, POP.HEIGHT);
  },

  rect: function(x, y, w, h, col) {
    POP.ctx.fillStyle = col;
    POP.ctx.fillRect(x, y, w, h);
  },

  circle: function(x, y, r, col) {
    POP.ctx.fillStyle = col;
    POP.ctx.beginPath();
    POP.ctx.arc(x + 5, y + 5, r, 0, Math.PI * 2, true);
    POP.ctx.closePath();
    POP.ctx.fill();
  },


  text: function(string, x, y, size, col) {
    POP.ctx.font = 'bold ' + size + 'px Monospace';
    POP.ctx.fillStyle = col;
    POP.ctx.fillText(string, x, y);
  }
};



POP.Input = {
  x: 0,
  y: 0,
  tapped: false,

  set: function(data) {
    this.x = (data.pageX - POP.offset.left) / POP.scale;
    this.y = (data.pageY - POP.offset.top) / POP.scale;
    this.tapped = true;
  }
};

POP.Touch = function(x, y) {

  this.type = 'touch'; // we'll need this later
  this.x = x; // the x coordinate
  this.y = y; // the y coordinate
  this.r = 5; // the radius
  this.opacity = 1; // inital opacity. the dot will fade out
  this.fade = 0.05; // amount by which to fade on each game tick
  // this.remove = false; // flag for removing this entity. POP.update
  // will take care of this

  this.update = function() {
    this.opacity -= this.fade;
    this.remove = (this.opacity < 0) ? true : false;
  };

  this.render = function() {
    POP.Draw.circle(this.x, this.y, this.r, 'rgba(255,0,0,' + this.opacity + ')');
  };
};

POP.Bubble = function() {

  this.type = 'bubble';
  this.r = (Math.random() * 20) + 10;
  this.speed = (Math.random() * 3) + 1;

  this.x = (Math.random() * (POP.WIDTH) - this.r);
  this.y = POP.HEIGHT + (Math.random() * 100) + 100;
  this.waveSize = 5 + this.r;
  this.xConstant = this.x;
  this.remove = false;

  this.update = function() {
    var time = new Date().getTime() * 0.002;

    this.y -= this.speed;
    this.x = this.waveSize * Math.sin(time) + this.xConstant;

    if (this.y < -10) {
      POP.score.escaped += 1; // update score
      this.remove = true;
    }
  };

  this.render = function() {
    POP.Draw.circle(this.x, this.y, this.r, 'rgba(255,255,255,1)');
  };

};

POP.Particle = function(x, y, r, col) {

  this.x = x;
  this.y = y;
  this.r = r;
  this.col = col;
  this.dir = (Math.random() * 2 > 1) ? 1 : -1;
  this.vx = ~~(Math.random() * 4) * this.dir;
  this.vy = ~~(Math.random() * 7);
  this.remove = false;

  this.update = function() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.99;
    this.vy *= 0.99;
    this.vy -= 0.25;

    if (this.y < 0) {
      this.remove = true;
    }
  };

  this.render = function() {
    POP.Draw.circle(this.x, this.y, this.r, this.col);
  };
};

window.addEventListener('load', POP.init, false);
window.addEventListener('resize', POP.resize, false);
