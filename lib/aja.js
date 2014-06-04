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
  
  function addColliding(entity, result, left) {
    for(var i = 0; i < left.length; ++i) {
      var e = left[i];
      if(e !== entity && e.visible !== false 
         && collideRect(entity.rect(), e.rect())) {
        result.push(e);
        // Move last entity here, process it next
        left[i] = left[left.length - 1];
        left.pop();
        --i;
      }
    }
  }

  function findColliding(entities, all) {
    var result = entities.concat([]);
    var left = all.filter(function(e) {
      return result.indexOf(e) === -1;
    });
    for(var i = 0; i < result.length; ++i) {
      // If rendering over half, give up and render all
      if(left.length < result.length) {
        result = result.concat(left);
        break;
      }
      addColliding(result[i], result, left);
    }
    return result;
  }
  
  /*
   * Canvas
   */
  
  this.Canvas = function(canvasId, highDpiTheme) {
    this.canvas = document.getElementById(canvasId);

    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.ctx = this.canvas.getContext('2d');

    this.initScalingRatio(this.ctx);
    this.isHighDpiTheme = !!highDpiTheme;

    this.entities = [];
    this.animations = [];
    this.animationsToAdd = [];
    this.background = document.createElement("canvas");
    this.background.width = this.canvas.width;
    this.background.height = this.canvas.height;
    this.background.getContext('2d').fillRect(0, 0, this.background.width, this.background.height);

    this.forceRedraw();
    this.timer = null;
    this.animating = false;
    this.fps = 60;
    this.verbosity = 0;
    this.lastTime = null;
    this.renderOrder = null;
  };

  this.Canvas.prototype.isHighDpiCanvas = function() {
    return this.scale > 1.0;
  }

  this.Canvas.prototype.initScalingRatio = function(context) {
    var devicePixelRatio = window.devicePixelRatio || 1;
    var backingStoreRatio = context.webkitBackingStorePixelRatio ||
      context.mozBackingStorePixelRatio ||
      context.msBackingStorePixelRatio ||
      context.oBackingStorePixelRatio ||
      context.backingStorePixelRatio || 1;

    this.scale = devicePixelRatio / backingStoreRatio;
  }

  this.Canvas.prototype.getScale = function() {
    return this.isHighDpiTheme ? this.scale : 1.0;
  }
  
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
    
    this.ctx.drawImage(this.background,
        0, 0, this.background.width, this.background.height,
        0, 0, this.canvas.width / this.getScale(), this.canvas.height / this.getScale());
    
    if(this.renderOrder !== null) {
      this.entities.sort(this.renderOrder);
    }

    for(var i = 0; i < this.entities.length; ++i) {
      this.drawEntity(this.entities[i]);
    }
  };
  
  this.Canvas.prototype.resize = function(width, height) {
    if(this.verbosity >= 2) console.log("resize called: current(%d, %d), new(%d, %d)", this.canvas.width, this.canvas.height, width, height);

    this.width = width;
    this.height = height;

    if (this.getScale() > 1.0) {
      this.canvas.style.width = width + "px";
      this.canvas.style.height = height + "px";
    }

    this.canvas.width = this.getScale() * width;
    this.canvas.height = this.getScale() * height;

    this.background.width = this.getScale() * width;
    this.background.height = this.getScale() * height;

    this.ctx.scale(this.getScale(), this.getScale());
    this.background.getContext('2d').scale(this.getScale(), this.getScale());
  };
  
  this.Canvas.prototype.addEntity = function(entity) {
    if(this.verbosity >= 2) console.log("Added entity " + this.entities.length);
    this.entities.push(entity);
    this.drawEntity(entity);
  };
  
  this.Canvas.prototype.removeEntity = function(entity) {
    var i = this.entities.indexOf(entity);
    if(i !== -1) {
      this.entities.splice(i, 1);
      var entitiesToDraw = findColliding([entity], this.entities);
      
      for(var i = 0; i < entitiesToDraw.length; ++i) {
        this.eraseEntity(entitiesToDraw[i]);
      }
      
      entity.visible = false;
      
      for(var i = 0; i < entitiesToDraw.length; ++i) {
        this.drawEntity(entitiesToDraw[i]);
      }
      
      if(this.verbosity >= 2) console.log("Removed entity " + i);
    }
  };
  
  this.Canvas.prototype.eraseEntity = function(entity) {
    var rect = entity.rect();
    rect.x = Math.max(0, rect.x - 1);
    rect.y = Math.max(0, rect.y - 1);
    rect.w = Math.min(this.width, rect.x + rect.w + 2) - rect.x;
    rect.h = Math.min(this.height, rect.y + rect.h + 2) - rect.y;
    this.ctx.drawImage(this.background, 
                       this.getScale() * rect.x, this.getScale() * rect.y,
                       this.getScale() * rect.w, this.getScale() * rect.h,
                       rect.x, rect.y,
                       rect.w, rect.h);
  };
  
  this.Canvas.prototype.drawEntity = function(entity) {
    if(entity.visible === false)
      return;
    
    if(entity.effects !== undefined) {
      for(var i = 0; i < entity.effects.length; ++i) {
        entity.effects[i].on(entity, this.ctx);
      }
      
      entity.draw(this.ctx);
      
      for(var i = entity.effects.length - 1; i >= 0 ; --i) {
        entity.effects[i].off(entity, this.ctx);
      }
    } else {
      entity.draw(this.ctx);
    }
  };
  
  this.Canvas.prototype.redrawEntity = function(entity) {
    this.redrawEntities([entity]);
  }
  
  this.Canvas.prototype.redrawEntities = function(entities) {
    var entitiesToDraw = findColliding(entities, this.entities);

    if(this.renderOrder !== null) {
      entitiesToDraw.sort(this.renderOrder);
    }

    for(var i = 0; i < entitiesToDraw.length; ++i) {
      this.eraseEntity(entitiesToDraw[i]);
    }
    for(var i = 0; i < entitiesToDraw.length; ++i) {
      this.drawEntity(entitiesToDraw[i]);
    }
  }
  
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
    if(this.animating) {
      return;
    }
    
    if(this.verbosity >= 2) console.log("Starting animation");
    this.animating = true;
    
    if(!this.scheduleFrame()) {
      var self = this;
      this.timer = setInterval(function() {
	self.animate();
      }, 1000/this.fps);
    }
  }
  
  this.Canvas.prototype.scheduleFrame = function() {
    var self = this;
    function anim() {
      self.animate();
    }
    
    if (window.requestAnimationFrame) window.requestAnimationFrame(anim);
    else if (window.msRequestAnimationFrame) window.msRequestAnimationFrame(anim);
    else if (window.mozRequestAnimationFrame) window.mozRequestAnimationFrame(anim);
    else if (window.webkitRequestAnimationFrame) window.webkitRequestAnimationFrame(anim);
    else return false;
    
    return true;
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
      var entity = this.animations[i].entity;
      if(entity !== undefined) {
        entitiesToDraw.push(entity);
      }
    }
    
    entitiesToDraw = findColliding(entitiesToDraw, this.entities);

    for(var i = 0; i < entitiesToDraw.length; ++i) {
      this.eraseEntity(entitiesToDraw[i]);
    }
    
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
    
    if(this.renderOrder !== null) {
      entitiesToDraw.sort(this.renderOrder);
    }
    
    for(var i = 0; i < entitiesToDraw.length; ++i) {
      this.drawEntity(entitiesToDraw[i]);
    }
    
    if(this.animations.length === 0 && this.animationsToAdd.length === 0) {
      if(this.verbosity >= 2) console.log("All animations finished");
      if(this.timer !== null) {
	window.clearInterval(this.timer);
	this.timer = null;
      }
      this.animating = false;
      this.lastTime = null;
    } else if(this.timer === null) {
      this.scheduleFrame();
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
   * Effect
   */
  
  this.Effect = function() {};
  this.Effect.prototype.on = function(entity, ctx) {};
  this.Effect.prototype.off = function(entity, ctx) {};
  
  /*
   * OpacityEffect
   */
  
  this.OpacityEffect = function() {
    this.oldOpacity = null;
  };
  this.OpacityEffect.prototype = new this.Effect();
  
  this.OpacityEffect.prototype.on = function(entity, ctx) { 
    this.oldOpacity = ctx.globalAlpha;
    ctx.globalAlpha = entity.opacity;
  };
  
  this.OpacityEffect.prototype.off = function(entity, ctx) {
    ctx.globalAlpha = this.oldOpacity;
  };
  
  /*
   * PropertyAnimation
   */
  
  this.PropertyAnimation = function(entity, properties, callback) {
    this.entity = entity;
    this.properties = properties;
    this.callback = callback;    
  }
  this.PropertyAnimation.prototype = new this.Animation();
  
  this.PropertyAnimation.prototype.animate = function(dt) {
    for(key in this.properties) {
      if(this.properties.hasOwnProperty(key)) {
        this.entity[key] = this.properties[key];
      }
    }
    return true;
  }
  
  this.PropertyAnimation.prototype.reset = function() {}

  
  /*
   * NumberAnimation
   */
  
  this.NumberAnimation = function(entity, properties,
                                    duration, easing, callback) {
    this.entity = entity;
    this.properties = properties;
    this.values = null;
    this.duration = duration;
    this.easing = easing;
    this.elapsed = 0;
    this.callback = callback;
  };
  this.NumberAnimation.prototype = new this.Animation();
  
  this.NumberAnimation.prototype.initialize = function() {
    this.values = {};
    for(key in this.properties) {
      if(this.properties.hasOwnProperty(key)) {
        var value = this.properties[key];
        if(typeof value == "number") {
          this.values[key] = {from: this.entity[key], to: value};
        } else if(typeof value == "object") {
          if(value.hasOwnProperty("delta")) {
            this.values[key] = {from: this.entity[key], to: this.entity[key] + value.delta};
          } else if(value.hasOwnProperty("to")) {
            if(value.hasOwnProperty("from")) {
              this.values[key] = {from: value.from, to: value.to};
            } else {
              this.values[key] = {from: this.entity[key], to: value.to};
            }
          }
        }            
      }
    }
  };
  
  this.NumberAnimation.prototype.animate = function(dt) {
    if(this.values === null) {
      this.initialize();
    }
    this.elapsed = Math.min(this.duration, this.elapsed + dt);
    var progress = this.elapsed / this.duration;
    var p = this.easing ? this.easing(progress) : progress;
    
    for(key in this.values) {
      if(this.values.hasOwnProperty(key)) {
        this.entity[key] = this.values[key].from + (this.values[key].to - this.values[key].from) * p;
      }
    }
    
    return progress >= 1.0;
  };
  
  this.NumberAnimation.prototype.reset = function() {
    this.elapsed = 0;
    this.values = null;
  }
  
  /*
   * PositionAnimation
   */
  
  this.PositionAnimation = function(entity, x1, y1, x2, y2, 
                                    duration, easing, callback) {
    this.entity = entity;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.duration = duration;
    this.elapsed = 0;
    this.easing = easing;
    this.callback = callback;
  };
  this.PositionAnimation.prototype = new this.Animation();
  
  this.PositionAnimation.prototype.animate = function(dt) {
    this.elapsed = Math.min(this.duration, this.elapsed + dt);
    var progress = this.elapsed / this.duration;
    var p = this.easing ? this.easing(progress) : progress;

    this.entity.x = this.x1 + (this.x2 - this.x1) * p;
    this.entity.y = this.y1 + (this.y2 - this.y1) * p;
    return progress >= 1.0;
  };
  
  this.PositionAnimation.prototype.reset = function() {
    this.elapsed = 0;
  }
  
  /*
   * PositionDeltaAnimation
   */
  
  this.PositionDeltaAnimation = function(entity, dx, dy, duration, easing, callback) {
    this.entity = entity;
    this.dx = dx;
    this.dy = dy;
    this.x0 = null;
    this.y0 = null;
    this.duration = duration;
    this.easing = easing;
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
    var p = this.easing ? this.easing(progress) : progress;
    this.entity.x = this.x0 + this.dx * p;
    this.entity.y = this.y0 + this.dy * p;
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
  
  this.easing = new function() {
    this.QuadIn = function(x) {
      return x * x;
    };
    
    this.QuadOut = function(x) {
      return 2*x - x*x
    };
    
    this.QuadInOut = function(x) {
      if(x < 0.5) {
        return 2 * x * x;
      } else {
        var xx = x - 0.5;
        return -2*xx*xx + 2*xx + 0.5;
      }
    };
    
    this.SineIn = function(x) {
      return 1 - Math.cos(x * Math.PI / 2);
    };

    this.SineOut = function(x) {
      return Math.sin(x * Math.PI / 2);
    };

    this.SineInOut = function(x) {
      return -0.5 * (Math.cos(Math.PI * x) - 1);
    };
  
    this.ExpIn = function(x) {
      return (Math.exp(x) - 1) / (Math.exp(1) - 1);
    }

    this.ExpOut = function(x) {
      return (Math.exp(1) - Math.exp(1 - x)) / (Math.exp(1) - 1);
    }

    this.ExpInOut = function(x) {
      if (x < Math.log(Math.E/2) / Math.log(1)) {
        return (Math.exp(x) - 1) / (Math.exp(1) - 1);
      } else {
        return (Math.exp(1) - Math.exp(1 - x)) / (Math.exp(1) - 1);
      }
    }
    this.Linear = null;
  };
};
