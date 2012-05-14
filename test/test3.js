window.onload = function() {
  var canvas = new aja.Canvas("canvas");
  canvas.verbosity = 3;
  canvas.setBackgroundImage("plains.png");

  var image = new aja.Image("infantry.png");

  image.effects = [new aja.OpacityEffect];
  image.opacity = 1.0;
  
  var animation = new aja.SequentialAnimation([
    new aja.PropertyAnimation(image, {x: 200}, 1000),
    new aja.PropertyAnimation(image, {x: 0, y: 50}, 1000),
    new aja.PropertyAnimation(image, {x: {delta: 100}}, 1000),
    new aja.PropertyAnimation(image, {x: {to: 300}}, 1000),
    new aja.PropertyAnimation(image, {y: 200, opacity: 0.0}, 1000),
    new aja.PropertyAnimation(image, {x: {from: 0, to: 300}, opacity: 1.0}, 1000)
  ]);
  
  canvas.addEntity(image);
  canvas.addAnimation(animation);
  
  var quad = new aja.Image("infantry.png"); quad.x = 100; quad.y = 400;
  var sine = new aja.Image("infantry.png"); sine.x = 200; sine.y = 400;
  var expo = new aja.Image("infantry.png"); expo.x = 300; expo.y = 400;
  
  var quadAnimation = new aja.SequentialAnimation([
    new aja.PropertyAnimation(quad, {y:{delta: -100}}, 500, aja.easing.QuadOut),
    new aja.PropertyAnimation(quad, {y:{delta: 100}}, 500, aja.easing.QuadIn),
  ]);
  quadAnimation.loops = aja.Animation.Infinite;
  
  var sineAnimation = new aja.SequentialAnimation([
    new aja.PropertyAnimation(sine, {y:{delta: -100}}, 500, aja.easing.SineOut),
    new aja.PropertyAnimation(sine, {y:{delta: 100}}, 500, aja.easing.SineIn),
  ]);
  sineAnimation.loops = aja.Animation.Infinite;
  
  var expoAnimation = new aja.SequentialAnimation([
    new aja.PropertyAnimation(expo, {y:{delta: -100}}, 500, aja.easing.ExpOut),
    new aja.PropertyAnimation(expo, {y:{delta: 100}}, 500, aja.easing.ExpIn),
  ]);
  expoAnimation.loops = aja.Animation.Infinite;
  
  canvas.addEntity(quad);
  canvas.addAnimation(quadAnimation);
  
  canvas.addEntity(sine);
  canvas.addAnimation(sineAnimation);
  
  canvas.addEntity(expo);
  canvas.addAnimation(expoAnimation);
}
