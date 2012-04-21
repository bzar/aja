/*
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */

var aja = new function() {
  
  /*
   * Helper functions
   */
  
  function collideRect(r1, r2) {
    return !(r1.x > r2.x + r2.w || r2.x > r1.x + r1.w) 
          && !(r1.y > r2.y + r2.h || r2.y > r1.y + r1.h);
  }
  
  function addColliding(entity, result, all) {
    for(var i = 0; i < all.length; ++i) {
      var e = all[i];
      if(e !== entity && result.indexOf(e) === -1 
         && collideRect(entity.rect(), e.rect())) {
        result.push(e);
      }
    }
  }

  function findColliding(result, all) {
    for(var i = 0; i < result.length; ++i) {
      addColliding(result[i], result, all);
    }
    return result;
  }
  
  /*
   * Canvas
   */
  
  this.Canvas = function(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.width = this.canvas.width;
    this.height = this.canvas.width;
    this.ctx = this.canvas.getContext('2d');
    this.entities = [];
    this.animations = [];
    this.animationsToAdd = [];
    this.background = document.createElement("canvas");
    this.background.width = this.canvas.width;
    this.background.height = this.canvas.height;
    this.background.getContext('2d').fillRect(0, 0, this.background.width, this.background.height);
    this.forceRedraw();
    this.timer = null;
    this.fps = 60;
    this.verbosity = 0;
    this.lastTime = null;
  };
  
  this.Canvas.prototype.setBackgroundImage = function(url) {
    bgImage = new Image();
    bgImage.src = url;
    var self = this;
    bgImage.onload = function() {
      var bg = self.background.getContext("2d");
      bg.drawImage(bgImage, 0, 0);
      self.forceRedraw();
    }
  }
  
  this.Canvas.prototype.forceRedraw = function() {
    if(this.verbosity >= 2) console.log("Force redraw");
    
    this.ctx.drawImage(this.background, 0, 0);
    for(var i = 0; i < this.entities.length; ++i) {
      this.entities[i].draw(this.ctx);
    }
  };
  
  this.Canvas.prototype.resize = function(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.background.width = width;
    this.background.height = height;
    this.width = width;
    this.height = height;
  };
  
  this.Canvas.prototype.addEntity = function(entity) {
    if(this.verbosity >= 2) console.log("Added entity " + this.entities.length);
    this.entities.push(entity);
    this.drawEntity(entity);
  };
  
  this.Canvas.prototype.removeEntity = function(entity) {
    var i = this.entities.indexOf(entity);
    if(i !== -1) {
      this.eraseEntity(entity);
      if(this.verbosity >= 2) console.log("Removed entity " + i);
      this.entities.splice(i, 1);
    }
  };
  
  this.Canvas.prototype.eraseEntity = function(entity) {
    var rect = entity.rect();
    rect.x = Math.max(0, rect.x - 1);
    rect.y = Math.max(0, rect.y - 1);
    rect.w = Math.min(this.width, rect.x + rect.w + 2) - rect.x;
    rect.h = Math.min(this.height, rect.y + rect.h + 2) - rect.y;
    this.ctx.drawImage(this.background, 
                       rect.x, rect.y,
                       rect.w, rect.h,
                       rect.x, rect.y,
                       rect.w, rect.h);
  };
  
  this.Canvas.prototype.drawEntity = function(entity) {
    entity.draw(this.ctx);
  };
  
  this.Canvas.prototype.addAnimation = function(animation) {
    if(this.verbosity >= 2) console.log("Added animation " + this.animations.length);
    this.animationsToAdd.push(animation);
    animation.running = true;
    this.startAnimation();
  };
  
  this.Canvas.prototype.removeAnimation = function(animation) {
    var i = this.animations.indexOf(animation);
    if(i !== -1) {
      if(this.verbosity >= 2) console.log("Removed animation " + i);
      this.animations[i].running = false;
      this.animations.splice(i, 1);
    }
  };
  
  this.Canvas.prototype.startAnimation = function () {
    if(this.timer !== null) {
      return;
    }
    
    if(this.verbosity >= 2) console.log("Starting animation");

    var self = this;
    this.timer = setInterval(function() {
     self.animate();
    }, 1000/this.fps);
  }
  
  this.Canvas.prototype.animate = function() {
    var now = new Date().getTime();
    var dt = this.lastTime === null ? 1000/this.fps : now - this.lastTime;
    this.lastTime = now;
    
    if(this.animationsToAdd.length !== 0) {
      for(var i = 0; i < this.animationsToAdd.length; ++i) {
        this.animations.push(this.animationsToAdd[i]);
      }
      this.animationsToAdd = [];
    }
    
    var entitiesToDraw = [];
    for(var i = 0; i < this.animations.length; ++i) {
      var animation = this.animations[i];

      if(animation.entity !== undefined) {
        this.eraseEntity(animation.entity);
        entitiesToDraw.push(animation.entity);
      }
    }
    
    entitiesToDraw = findColliding(entitiesToDraw, this.entities);
    
    for(var i = 0; i < this.animations.length; ++i) {
      var animation = this.animations[i];

      if(animation.animate(dt, this)) {
        animation.reset();
        if(animation.loops !== animation.Infinite) {
          animation.loopCount += 1;
          if(animation.loopCount === animation.loops) {
            if(this.verbosity >= 3) console.log("Finished animation " + i);
            animation.loopCount = 0;
            animation.running = false;
            this.animations.splice(i, 1);
            i = i - 1;
            if(animation.callback !== undefined) {
              animation.callback();
            }
          }
        }
      }
    }
    
    for(var i = 0; i < entitiesToDraw.length; ++i) {
      this.drawEntity(entitiesToDraw[i]);
    }
    
    if(this.animations.length === 0) {
      if(this.verbosity >= 2) console.log("All animations finished");
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  /*
   * Image
   */
  
  var images = {};
  this.Image = function(url, x, y) {
    this.image = images[url];
    if(this.image === undefined) {
      this.image = new Image();
      this.image.src = url;
      images[url] = this.image;
    }
    this.x = x !== undefined ? x : 0;
    this.y = y !== undefined ? y : 0;
  };
  
  this.Image.prototype.draw = function(ctx) {
    ctx.drawImage(this.image, this.x, this.y);
  };
  
  this.Image.prototype.rect = function() {
    return {x: this.x, y: this.y,
            w: this.image.width,
            h: this.image.height};
  };
  
  /*
   * Animation
   */
  
  this.Animation = function() {
    this.loops = 1;
    this.loopCount = 0;
    this.running = false;
  };
  this.Animation.prototype.animate = function(dt, canvas) { return true; }
  this.Animation.prototype.reset = function() {}
  this.Animation.prototype.Infinite = -1;
  
  /*
   * PositionAnimation
   */
  
  this.PositionAnimation = function(entity, x1, y1, x2, y2, 
                                    duration, callback) {
    this.entity = entity;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.duration = duration;
    this.elapsed = 0;
    this.callback = callback;
  };
  this.PositionAnimation.prototype = new this.Animation();
  
  this.PositionAnimation.prototype.animate = function(dt) {
    this.elapsed = Math.min(this.duration, this.elapsed + dt);
    var progress = this.elapsed / this.duration;
    this.entity.x = this.x1 + (this.x2 - this.x1) * progress;
    this.entity.y = this.y1 + (this.y2 - this.y1) * progress;
    return progress >= 1.0;
  };
  
  this.PositionAnimation.prototype.reset = function() {
    this.elapsed = 0;
  }
  
  /*
   * PositionDeltaAnimation
   */
  
  this.PositionDeltaAnimation = function(entity, dx, dy, duration, callback) {
    this.entity = entity;
    this.dx = dx;
    this.dy = dy;
    this.x0 = null;
    this.y0 = null;
    this.duration = duration;
    this.elapsed = 0;
    this.callback = callback;
  };
  this.PositionDeltaAnimation.prototype = new this.Animation();
  
  this.PositionDeltaAnimation.prototype.animate = function(dt) {
    if(this.x0 === null || this.y0 === null) {
      this.x0 = this.entity.x;
      this.y0 = this.entity.y;
    }
    this.elapsed = Math.min(this.duration, this.elapsed + dt);
    var progress = this.elapsed / this.duration;
    this.entity.x = this.x0 + this.dx * progress;
    this.entity.y = this.y0 + this.dy * progress;
    return progress >= 1.0;
  };
  
  this.PositionDeltaAnimation.prototype.reset = function() {
    this.elapsed = 0;
    this.x0 = null;
    this.y0 = null;
  }
  
  /*
   * PauseAnimation
   */
  
  this.PauseAnimation = function(duration, callback) {
    this.duration = duration;
    this.elapsed = 0;
    this.callback = callback;
  }
  this.PauseAnimation.prototype = new this.Animation();
  
  this.PauseAnimation.prototype.animate = function(dt) {
    this.elapsed += dt;
    return this.elapsed >= this.duration;
  }
  
  this.PauseAnimation.prototype.reset = function() {
    this.elapsed = 0;
  }
  
  /*
   * SequentialAnimation
   */
  
  this.SequentialAnimation = function(animations, callback) {
    this.animations = animations;
    this.index = null;
    this.callback = callback;
  }
  this.SequentialAnimation.prototype = new this.Animation();
  
  this.SequentialAnimation.prototype.animate = function(dt, canvas) {
    if(this.index === null) {
      this.index = 0;
      canvas.addAnimation(this.animations[this.index])
    }
    
    if(!this.animations[this.index].running) {
      this.index += 1;
      if(this.animations.length <= this.index) {
        return true;
      }
      canvas.addAnimation(this.animations[this.index])
    }
    
    return false;
  }
  
  this.SequentialAnimation.prototype.reset = function() {
    this.index = null;
  }
  
  /*
   * ParallelAnimation
   */
  
  this.ParallelAnimation = function(animations, callback) {
    this.animations = animations;
    this.started = false;
    this.callback = callback;
  }
  this.ParallelAnimation.prototype = new this.Animation();
  
  this.ParallelAnimation.prototype.animate = function(dt, canvas) {
    if(!this.started) {
      this.started = true;
      for(var i = 0; i < this.animations.length; ++i) {
        canvas.addAnimation(this.animations[i])
      }
    }
    
    for(var i = 0; i < this.animations.length; ++i) {
      if(this.animations[i].running) {
        return false;
      }
    }
        
    return true;
  }
  
  this.ParallelAnimation.prototype.reset = function() {
    this.started = false;
  }
};