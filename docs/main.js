var Vector = {
  LEFT:       [-1, 0],
  RIGHT:      [ 1, 0],
  UP:         [ 0,-1],
  DOWN:       [ 0, 1],
  UP_LEFT:    [-1,-1],
  UP_RIGHT:   [ 1,-1],
  DOWN_LEFT:  [-1, 1],
  DOWN_RIGHT: [ 1, 1],
  add: function(a, b) {
    a[0] += b[0];
    a[1] += b[1];
    return a
  },
  added: function(a, b) {
    return [a[0] + b[0], a[1] + b[1]]
  },
  subtract: function(a, b) {
    a[0] -= b[0];
    a[1] -= b[1];
    return a
  },
  subtracted: function(a, b) {
    return [a[0] - b[0], a[1] - b[1]]
  },
  multiply: function(a, b) {
    a[0] *= b[0];
    a[1] *= b[1];
    return a
  },
  multiplied: function(a, b) {
    return [a[0] * b[0], a[1] * b[1]]
  },
  divide: function(a, b) {
    a[0] /= b[0];
    a[1] /= b[1];
    return a
  },
  divided: function(a, b) {
    return [a[0] / b[0], a[1] / b[1]]
  },
  round: function(vector) {
    vector[0] = Math.round(vector[0]);
    vector[1] = Math.round(vector[1]);
  },
  rounded: function(vector) {
    return [Math.round(vector[0]), Math.round(vector[1])]
  },
  invert: function(vector) {
    vector[0] *= -1;
    vector[1] *= -1;
    return vector
  },
  inverted: function(vector) {
    return [-vector[0], -vector[1]]
  },
  scale: function(vector, scalar) {
    vector[0] *= scalar;
    vector[1] *= scalar;
    return vector
  },
  scaled: function(vector, scalar) {
    return [vector[0] * scalar, vector[1] * scalar]
  },
  magnitude: function(vector) {
    return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1])
  },
  normalize: function(vector) {
    var magnitude = this.magnitude(vector);
    vector[0] /= magnitude;
    vector[1] /= magnitude;
    return vector
  },
  normalized: function(vector) {
    var magnitude = this.magnitude(vector);
    return this.scaled(vector, 1 / magnitude)
  },
  clone: function(vector) {
    return [vector[0], vector[1]]
  },
  fromDegrees: function(degrees) {
    var radians = (degrees - 90) * Math.PI / 180;
    return [Math.cos(radians), Math.sin(radians)]
  },
  toDegrees: function(vector) {
    return Math.atan2(vector[1], vector[0]) * 180 / Math.PI + 90
  },
  getNormal: function(direction) {
    var n, t = typeof direction;
    if (t === 'number') {
      n = this.fromDegrees(direction);
    } else if (t === 'object') {
      n = this.normalized(direction);
    }
    return n
  }
};

var Rect = {
  getCenter: function(rect) {
    var x, y, w, h;
    if (rect.length === 2) {
      x = 0;
      y = 0;
      w = rect[0];
      h = rect[1];
      if (w.length === 2) {
        x = w[0];
        y = w[1];
      }
      if (h.length === 2) {
        w = h[0];
        h = h[1];
      }
    } else {
      throw 'RectError: Rectangle for `getCenter` has invalid number of arguments'
    }
    return [x + w / 2, y + h / 2]
  },
  isColliding: function(a, b) {
    var ax, ay, aw, ah, al, at, ar, ab, bx, by, bw, bh, bl, bt, br, bb;
    ax = a[0][0];
    ay = a[0][1];
    aw = a[1][0];
    ah = a[1][1];

    bx = b[0][0];
    by = b[0][1];
    bw = b[1][0];
    bh = b[1][1];

    // console.log(ax, ay, aw, ah)

    al = ax - aw / 2;
    at = ay - ah / 2;
    ar = ax + aw / 2;
    ab = ay + ah / 2;

    bl = bx - bw / 2;
    bt = by - bh / 2;
    br = bx + bw / 2;
    bb = by + bh / 2;

    return al < br && at < bb && ar > bl && ab > bt
  }
};

var stage = [100, 100];
var stageCenter = Rect.getCenter(stage);

var app = document.getElementById('app');

var sprites = [];
var enemies = [];
var players = [];
var powerups = [];

var xmlns = "http://www.w3.org/2000/svg";
var xlinkns = "http://www.w3.org/1999/xlink";

var paused = false;

var shakeSequence = [
  Vector.UP,
  Vector.DOWN_RIGHT,
  Vector.LEFT,
  Vector.UP_RIGHT,
  Vector.DOWN,
  Vector.UP_LEFT,
  Vector.RIGHT,
  Vector.DOWN_LEFT
];

var shakeTimer = 0;
var shakeIndex = 0;
var shakeDegree;
function shake(el, degree) {
  shakeTimer += 12;
  shakeDegree = degree || 3;
}

function flash(el) {
  el = el || app;
  el.style.background = 'white';
  requestAnimationFrame(function() {
    el.style.background = '';
  });
}

var stuttering = false;
function stutter() {
  stuttering = true;
}

function reset() {
  shakeTimer = 0;
  shakeIndex = 0;
  var i = sprites.length;
  while (i--) {
    sprites[i].kill(true);
  }
  ship = new Ship();
  ship.spawn(Vector.multiplied(stageCenter, [1, 1.5]));
  new Wave(5, Vector.multiplied(stageCenter, [1.5, 0]), 1.25).send(function() {
    new Boss().spawn([stageCenter[0], -Boss.prototype.size[1] / 2]);
  });
  new Star().spawn(Vector.scaled(stageCenter, .25));
  new Star().spawn(stageCenter);
  new Star().spawn(Vector.scaled(stageCenter, 1.75));
}

var cache = document.getElementById('cache');
var externals = ['boss', 'circle', 'enemy', 'explosion', 'laser', 'powerup', 'ship', 'shot', 'sphere', 'spinny'];
externals.some(function(sprite) {
  var ajax = new XMLHttpRequest();
  ajax.open("GET", "images/" + sprite + ".svg", true);
  ajax.send();
  ajax.onload = function(e) {
    var div = document.createElement("div");
    div.className = sprite + '-cached';
    div.innerHTML = ajax.responseText;
    cache.appendChild(div);
  };
});

function Sprite() {
  this.active = false;
}

Sprite.prototype = Object.assign(Sprite.prototype, {
  size: [8, 8],
  friction: 0,
  spawn: function(pos) {
    var use = document.createElementNS(xmlns, 'use');
    use.setAttributeNS(xlinkns, 'xlink:href', '#' + this.sprite);
    this.el = document.createElementNS(xmlns, 'svg');
    this.el.setAttribute('fill', this.color);
    this.el.appendChild(use);
    this.pos = Vector.clone(pos);
    this.rect = [this.pos, this.size];
    this.vel = [0, 0];
    this.active = true;
    this.draw();
    sprites.push(this);
    app.appendChild(this.el);
    return this
  },
  kill: function() {
    this.pos = null;
    this.vel = null;
    this.active = false;
    var index = sprites.indexOf(this);
    if (index !== -1) {
      sprites.splice(index, 1);
    }
    if (this.el.parentNode === app) {
      app.removeChild(this.el);
    }
  },
  move: function(direction) {
    var normal = Vector.getNormal(direction);
    direction = Vector.scaled(normal, this.speed);
    Vector.add(this.vel, direction);
  },
  update: function() {
    if (!this.hit) {
      Vector.add(this.pos, this.vel);
      Vector.scale(this.vel, this.friction);
    }
    this.draw();
  },
  draw: function() {
    var sprite = this.el.style;
    sprite.left = this.pos[0] - this.size[0] / 2 + 'em';
    sprite.top = this.pos[1] - this.size[1] / 2 + 'em';
    sprite.width = this.size[0] + 'em';
    sprite.height = this.size[1] + 'em';
  }
});

function Actor() {
  Sprite.call(this);
}

Actor.prototype = Object.assign(Object.create(Sprite.prototype), {
  size: [8, 8],
  defense: 1,
  shotsPer: 1,
  colorHit: 'white',
  spawn: function(pos) {
    this.shots = [];
    this.burst = 0;
    this.overheating = 0;
    this.hit = false;
    this.health = 1;
    return Sprite.prototype.spawn.call(this, pos)
  },
  kill: function(silent) {
    if (!silent) {
      new Explosion().spawn(this.pos);
      shake();
      flash();
    }
    Sprite.prototype.kill.call(this);
  },
  damage: function(damage) {
    this.health -= damage / this.defense;
    this.hit = true;
    stutter();
  },
  shoot: function(pos) {
    var offset, origin, config = this.shot;
    pos = pos || this.pos;
    offset = [0, -this.size[1] / 2];
    origin = Vector.added(pos, offset);

    if (!this.charging && !this.laser && this.overheating <= 0 && this.burst < this.shotsMax) {
      var step  = 2;
      var offset = [step / 2 - (this.shotsPer / 2) * step, 0];
      var start = Vector.added(origin, offset);
      var i = 0;
      var j = 0;
      while (i < this.shotsPer) {
        var current = Vector.added(start, [step * i, -1 * j]);
        var shot = new Projectile(config).spawn(current, this);
        this.shots.push(shot);
        i++;
        if (i < this.shotsPer / 2)
          j++;
        else if (i > this.shotsPer / 2)
          j --;
      }
      new Explosion([12, 12], 'lime').spawn(origin);
      this.burst ++;
      if (this.burst >= this.shotsMax) {
        this.overheating = this.shotsCooldown;
        this.burst = 0;
      }
    } else {
      this.overheating --;
    }
  },
  update: function() {
    if (this.health <= 0) {
      return this.kill()
    }
    Sprite.prototype.update.call(this);
  },
  draw: function() {
    if (this.hit) {
      this.el.setAttribute('fill', this.colorHit);
      this.hit = false;
    } else {
      this.el.setAttribute('fill', this.color);
    }
    this.el.style.transform = 'rotateY(' + Math.round(this.vel[0] * 30) + 'deg) rotateY(' + Math.round(-this.vel[1] * 15) + 'deg)';
    Sprite.prototype.draw.call(this);
  }
});

function Star() {
  this.speed = Math.random() * 1.25 + 0.25;
}

Star.prototype = Object.assign(Object.create(Sprite.prototype), {
  size: [2, 2],
  sprite: 'explosion',
  color: 'rgba(255, 255, 255, .25)',
  update: function() {
    this.pos[1] += this.speed;
    if (this.pos[1] > stage[1])
      this.pos[1] -= stage[1];
    Sprite.prototype.update.call(this);
  }
});

function Explosion(size, color) {
  this.sizeMax = size || [24, 24];
  this.size = this.sizeMax;
  this.color = color || 'orange';
  Sprite.call(this);
}

Explosion.prototype = Object.assign(Object.create(Sprite.prototype), {
  sprite: 'explosion',
  color: 'orange',
  update: function() {
    resizeRate = Vector.added(Vector.scaled(this.sizeMax, 1 / 3), [1, 1]);
    Vector.subtract(this.size, resizeRate);
    if (this.size[0] <= 0)
      return this.kill()
    Sprite.prototype.update.call(this);
  }
});

function Laser() {
  Sprite.call(this);
}

Laser.prototype = Object.assign(Object.create(Sprite.prototype), {
  speed: 8,
  power: 1,
  lifeMax: 90,
  enemies: enemies,
  sprite: 'laser',
  color: 'cyan',
  spawn: function(pos, parent) {
    parent.laser = this;
    this.parent = parent;
    this.life = this.lifeMax;
    this.size = [0, 0];
    Sprite.prototype.spawn.call(this, pos);
  },
  kill: function() {
    this.parent.laser = null;
    Sprite.prototype.kill.call(this);
  },
  update: function() {
    shakeTimer = 2;
    shakeDegree = 2;
    if (this.life) {
      this.life--;
      if (this.pos[1] > 0)
        this.size[1] += this.speed;
      if (this.size[0] < 12) {
        this.size[0] += (12 - this.size[0]) / 36;
      }
    } else {
      if (this.size[0] > 1) {
        this.size[0] += -this.size[0] / 9;
      } else {
        return this.kill()
      }
    }
    if (this.parent && this.parent.active) {
      this.pos[0] = this.parent.pos[0];
      this.pos[1] = this.parent.pos[1] - this.parent.size[1] /2 - this.size[1] / 2;
    } else {
      this.life = 0;
      this.pos[1] -= this.speed / 2;
    }
    var hit = false;
    this.enemies.some(function(enemy) {
      if (enemy.active && Rect.isColliding(this.rect, enemy.rect)) {
        hit = true;
        enemy.damage(this.power);
        new Explosion([4, 4]).spawn(this.pos);
      }
      return hit
    }, this);
    Sprite.prototype.update.call(this);
  }
});

function PowerUp() {

}

PowerUp.prototype = Object.assign(Object.create(Sprite.prototype), {
  sprite: 'powerup',
  speed: .5,
  size: [6, 6],
  spawn: function(pos) {
    powerups.push(this);
    Sprite.prototype.spawn.call(this, pos);
  },
  kill: function() {
    var index = powerups.indexOf(this);
    if (index !== -1) {
      powerups.splice(index, 1);
    }
    Sprite.prototype.kill.call(this);
  },
  update: function() {
    this.move(Vector.DOWN);
    Sprite.prototype.update.call(this);
  }
});

function Projectile(config) {
  Object.assign(this, config);
  Sprite.call(this);
}

Projectile.prototype = Object.assign(Object.create(Sprite.prototype), {
  color: 'orange',
  sprite: 'sphere',
  size: [1, 1],
  speed: 1,
  friction: 0.1,
  power: 1,
  spawn: function(pos, parent) {
    this.parent = parent;
    this.rotation = 0;
    return Sprite.prototype.spawn.call(this, pos)
  },
  kill: function() {
    var index = this.parent.shots.indexOf(this);
    this.parent.shots.splice(index, 1);
    Sprite.prototype.kill.call(this);
  },
  update: function() {
    this.move(this.direction);
    if (this.pos[0] < 0 || this.pos[0] > stage[0]) {
      return this.kill()
    }
    if (this.direction[1] < 0 && this.pos[1] < 0 || this.direction[1] > 1 && this.pos[1] > stage[1])
      return this.kill()
    var hit = false;
    this.enemies.some(function(enemy) {
      if (enemy.active) {
        if (Rect.isColliding(this.rect, enemy.rect)) {
          var dist = Vector.magnitude(Vector.subtracted(enemy.pos, this.pos));
          if (dist < enemy.size[0] / 2 + this.size[0] / 2) {
            hit = true;
            enemy.damage(this.power);
            new Explosion([3, 3]).spawn(this.pos);
          }
        }
      }
      return hit
    }, this);
    if (hit) {
      return this.kill()
    }
    this.rotation += this.rotationSpeed;
    Sprite.prototype.update.call(this);
  },
  draw: function() {
    this.el.style.transform = 'rotateZ(' + this.rotation + 'deg)';
    Sprite.prototype.draw.call(this);
  }
});

function Worm(config) {
  Object.assign(this, config);
  this.config = config || null;
  this.length = this.lengthMax;
  this._speed = this._speed || -1;
  Projectile.call(this);
}

Worm.prototype = Object.assign(Object.create(Projectile.prototype), {
  color: 'orange',
  sprite: 'circle',
  size: [3, 3],
  speed: 0,
  power: 2,
  lengthMax: 8,
  update: function() {
    if (this.length === this.lengthMax) {
      this._speed += 0.05;
      var pos = Vector.added(this.pos, Vector.scaled(this.direction, this._speed));
      var config = Object.assign(this.config, {
        _speed: this._speed
      });
      new Worm(config).spawn(pos, this.parent);
    }
    if (!--this.length) {
      return this.kill()
    }
    Projectile.prototype.update.call(this);
  }
});

function Boss() {
  Actor.call(this);
}

Boss.prototype = Object.assign(Object.create(Actor.prototype), {
  speed: .001,
  friction: 0.995,
  direction: [0, 1],
  defense: 512,
  size: [32, 32],
  sprite: 'enemy',
  color: 'gray',
  shot: {
    color: 'orange',
    sprite: 'spinny',
    size: [2, 2],
    enemies: players,
    power: 1,
    rotationSpeed: 36,
  },
  shotInterval: 15,
  shotIntervalAlt: 150,
  shotsMax: 7,
  shotsCooldown: 7,
  spawn: function(pos) {
    enemies.push(this);
    this.shotTimer = this.shotInterval;
    this.shotTimerAlt = this.shotIntervalAlt;
    this.shotIndex = 0;
    return Actor.prototype.spawn.call(this, pos)
  },
  shoot: function() {
    var that = this;
    function shoot(direction) {
      var config = Object.assign(that.shot, {
        direction: direction
      });
      var radius = that.size[0] / 2;
      var normal = Vector.fromDegrees(direction);
      var origin = Vector.added(that.pos, Vector.scaled(normal, radius));
      new Projectile(config).spawn(origin, that);
    }
    if (!this.overheating && this.burst < this.shotsMax) {
      if (ship && ship.active) {
        var direction = Vector.subtracted(ship.pos, this.pos);
        var angle     = Vector.toDegrees(direction);
        var step = 45 / 3;
        var shots = 7 - this.shotIndex % 2;
        var i = 0;
        while (i < shots) {
          var a = angle + (-shots / 2 + i + .5) * step;
          shoot(a);
          i ++;
        }
      }
      this.burst ++;
      if (this.burst >= this.shotsMax) {
        this.overheating = this.shotsCooldown;
        this.burst = 0;
      }
    } else {
      this.overheating --;
    }
    this.shotIndex ++;
  },
  update: function() {
    if (-this.direction[1] * (this.pos[1] - stage[1] * .25) < 1) {
      this.direction[1] *= -1;
    }
    this.move(this.direction);
    if (this.pos[1] - this.size[1] / 2 > 0) {
      if (!--this.timer) {
        this.timer = this.shotInterval;
        this.shoot();
      }
      if (!--this.timerAlt) {
        this.timerAlt = this.shotIntervalAlt;
        if (ship && ship.active) {
          var direction = Vector.subtracted(ship.pos, this.pos);
          var radius = -this.size[0] / 2;
          var normal = Vector.normalized(direction);
          var origin = Vector.added(this.pos, Vector.scaled(normal, radius));
          var config = {
            direction: normal,
            enemies: [ship]
          };
          new Worm(config).spawn(origin, this);
        }
      }
    }
    Actor.prototype.update.call(this);
  }
});

function Enemy(special) {
  this.direction = [-1, .1];
  this.timerMax = 10;
  this.timer = this.timerMax;
  this.special = !!special;
  if (special) {
    this.color = 'lime';
  }
  Actor.call(this);
}

Enemy.prototype = Object.assign(Object.create(Actor.prototype), {
  speed: .05,
  friction: .999,
  defense: 11,
  size: [12, 12],
  sprite: 'boss',
  color: 'gray',
  shot: {
    color: 'orange',
    sprite: 'sphere',
    size: [1, 1],
    enemies: players,
    speed: 1.25,
    power: 1
  },
  special: false,
  shotsMax: 1,
  shotsCooldown: 10,
  spawn: function(pos) {
    enemies.push(this);
    return Actor.prototype.spawn.call(this, pos)
  },
  kill: function(silent) {
    var index = enemies.indexOf(this);
    if (index !== -1) {
      enemies.splice(index, 1);
    }
    if (!silent) {
      if (this.special) {
        new PowerUp().spawn(this.pos);
      }
    }
    Actor.prototype.kill.call(this, silent);
  },
  shoot: function() {
    var that = this;
    function shoot(direction) {
      var config = Object.assign(that.shot, {
        direction: direction
      });
      new Projectile(config).spawn(that.pos, that);
    }
    if (!this.overheating && this.burst < this.shotsMax) {
      if (ship && ship.active) {
        // new Worm({
        //   direction: Vector.normalized(Vector.subtracted(ship.pos, this.pos)),
        //   enemies: [ship]
        // }).spawn(this.pos, this)
        var direction = Vector.subtracted(ship.pos, this.pos);
        var angle     = Vector.toDegrees(direction);
        var step = 45 / 3;
        var shots = 3;
        var i = 0;
        while (i < shots) {
          var a = angle + (-shots / 2 + i + .5) * step;
          shoot(a);
          i ++;
        }
      }
      this.burst ++;
      if (this.burst >= this.shotsMax) {
        this.overheating = this.shotsCooldown;
        this.burst = 0;
      }
    } else {
      this.overheating --;
    }
  },
  update: function() {
    if (this.pos[1] > stage[1] + this.size[1] / 2) {
      return this.kill(true)
    }
    if (-this.direction[0] * (this.pos[0] - stageCenter[0]) < 0) {
      this.direction[0] *= -1;
    }
    if (!--this.timer) {
      this.timer = this.timerMax;
      this.shoot();
    }
    this.move(this.direction);
    Actor.prototype.update.call(this);
  }
});

function Ship() {
  Actor.call(this);
}

var healthbar = document.querySelector('.-health .bar');
var healthbarTrail = document.querySelector('.-health .bar-trail');

var energybar = document.querySelector('.-energy .bar');

function updateHealth(value) {
  var width = 'calc(100% * ' + value + ')';
  healthbar.style.width = width;
  healthbarTrail.style.width = width;
}

function updateEnergy(value) {
  energybar.style.width = 'calc(100% * ' + value + ')';
  if (value === 1) {
    energybar.classList.add('flashing');
  } else {
    energybar.classList.remove('flashing');
  }
}

Ship.prototype = Object.assign(Object.create(Actor.prototype), {
  speed: .2,
  friction: 0.8,
  sprite: 'ship',
  color: 'crimson',
  colorHit: 'black',
  shot: {
    color: 'lime',
    sprite: 'shot',
    size: [4, 4],
    direction: Vector.UP,
    enemies: enemies,
    speed: 2,
    power: 1,
  },
  shotsPer: 2,
  shotsMax: 5,
  shotsCooldown: 4,
  energy: 0,
  charging: false,
  chargeTime: 1.5,
  spawn: function(pos) {
    var actor = Actor.prototype.spawn.call(this, pos);
    players.push(this);
    this.laser = false;
    updateHealth(this.health);
    updateEnergy(this.energy);
    return actor
  },
  damage: function(damage) {
    flash();
    shake();
    Actor.prototype.damage.call(this, damage);
    updateHealth(this.health);
  },
  kill: function() {
    this.energy = 0;
    updateEnergy(this.energy);
    Actor.prototype.kill.call(this);
    setTimeout(reset, 1000);
  },
  chargeLaser: function() {
    this.charging = true;
    if (this.energy < 1) {
      this.energy += 1 / (this.chargeTime * 60);
    } else {
      this.energy = 1;
    }
    updateEnergy(this.energy);
  },
  shootLaser: function(pos) {
    pos = pos || this.pos;
    if (!this.laser && this.energy === 1) {
      new Laser().spawn(Vector.subtracted(pos, [0, this.size[1] / 2]), this);
    }
    this.charging = false;
    this.energy = 0;
    updateEnergy(this.energy);
  },
  update: function() {
    powerups.some(function(powerup) {
      if (Rect.isColliding(powerup.rect, this.rect)) {
        powerup.kill();
        this.shotsPer ++;
      }
    }, this);
    Actor.prototype.update.call(this);
    if (this.pos) {
      if (this.pos[0] < 0) {
        this.pos[0] = 0;
      }
      if (this.pos[0] > stage[0]) {
        this.pos[0] = stage[0];
      }
      if (this.pos[1] < 0) {
        this.pos[1] = 0;
      }
      if (this.pos[1] > stage[1]) {
        this.pos[1] = stage[1];
      }
    }
  }
});

var ship;
var wave;
function Wave(amount, pos, interval) {
  wave = this;
  this.sent = 0;
  this.amount = amount;
  this.pos = pos;
  this.interval = interval;
  this.timer = 0;
  this.callback = null;
}

Wave.prototype = {
  send: function(callback) {
    this.sent = 0;
    this.spawn();
    this.callback = callback;
  },
  spawn: function() {
    var pos, special;
    if (this.sent % 2 === 0) {
      pos = Vector.multiplied(stage, [0.25, 0]);
    } else {
      pos = Vector.multiplied(stage, [0.75, 0]);
    }
    this.amount--;
    this.sent++;
    if (this.amount) {
      this.timer = this.interval * 60;
    } else {
      this.callback && this.callback.call(window);
    }
    special = !this.amount;
    new Enemy(special).spawn([pos[0], -Enemy.prototype.size[1] / 2]);
  }
};

reset();

var keyPressed = {};
var keyTapped = {};
var keyReleased = {};
var keyTime = {};
window.addEventListener('keydown', function(e) {
  if (!keyPressed[e.code]) {
    keyTapped[e.code] = true;
    keyTime[e.code] = 0;
  }
  keyPressed[e.code] = true;
});

window.addEventListener('keyup', function(e) {
  keyPressed[e.code] = false;
  keyTime[e.code] = 0;
});

var mouse;
function handleMouse(e) {
  var flag = e.type === 'mousedown';
  var button = e.button === 0 ? 'MouseLeft' : e.button === 2 ? 'MouseRight' : null;
  if (flag) {
    if (!keyPressed[button]) {
      keyTapped[button] = true;
      keyTime[button] = 0;
    }
  } else {
    if (keyPressed[button]) {
      keyReleased[button] = true;
      keyTime[button] = 0;
    }
  }
  keyPressed[button] = flag;
}

app.addEventListener('mousedown', handleMouse);
app.addEventListener('mouseup',   handleMouse);
window.addEventListener('mousemove', function(e) {
  var rect = app.getBoundingClientRect();
  mouse = Vector.multiplied([(e.pageX - rect.left) / rect.width, (e.pageY - rect.top) / rect.height], stage);
});
app.addEventListener('contextmenu', function(e) {
  e.preventDefault();
  return false
});

function loop() {
  if (shakeTimer) {
    shakeTimer--;
    var pos = Vector.scaled(shakeSequence[shakeIndex], shakeDegree);
    app.style.transform = 'translate(' + pos[0] + 'px, ' + pos[1] + 'px)';
    if (++shakeIndex >= shakeSequence.length)
      shakeIndex -= shakeSequence.length;
    if (!shakeTimer) {
      app.style.transform = '';
    }
  }
  if (!paused) {
    if (!stuttering) {
      if (wave) {
        if (!--wave.timer) {
          wave.spawn();
        }
      }
      if (ship.active) {
        var direction, directionX = 0, directionY = 0;
        if (keyPressed.MouseLeft) {
          if (keyTime.MouseLeft % 4 === 0) {
            ship.shoot();
          }
        } else {
          ship.burst = 0;
        }
        if (keyPressed.MouseRight) {
          ship.chargeLaser();
        }
        if (keyReleased.MouseRight) {
          ship.shootLaser();
        }
        if (directionX || directionY) {
          direction = [directionX, directionY];
        } else
        if (mouse) {
          // ship.pos[0] = mouse[0]
          // ship.pos[1] = mouse[1]
          ship.friction = 1;
          ship.vel = Vector.scaled(Vector.subtracted(mouse, ship.pos), 1 / 8);
          // var distance = Vector.subtracted(mouse, ship.pos)
          // var normal = Vector.normalized(distance)
          // var speed = .5
          // var velocity = Vector.scaled(normal, speed)
          // if (Vector.magnitude(distance) < speed) {
          //   ship.pos[0] = mouse[0]
          //   ship.pos[1] = mouse[1]
          //   ship.vel = [0, 0]
          // } else {
          //   Vector.add(ship.vel, velocity)
          // }
        }
        direction && ship.move(direction);
      }
      var i = sprites.length;
      while (i--) {
        sprites[i].update();
      }
    } else {
      stuttering = false;
    }
  }
  if (keyTapped.KeyP) {
    paused = !paused;
    app.classList.toggle('paused');
  }
  window.requestAnimationFrame(loop);
  for (var code in keyPressed) {
    if (keyPressed[code])
      keyTime[code] ++;
  }
  for (var code in keyTapped) {
    keyTapped[code] = false;
  }
  for (var code in keyReleased) {
    keyReleased[code] = false;
  }
}

loop();
