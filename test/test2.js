window.onload = function() {
  var canvas = new aja.Canvas("canvas");
  canvas.verbosity = 3;
  canvas.setBackgroundImage("plains.png");

  var image = new aja.Image("infantry.png");

  var animation = new aja.PositionDeltaAnimation(image, 200, 0, 1000);
  canvas.addEntity(image);
  canvas.addAnimation(animation);
  
  window.setTimeout(function() {
    canvas.addAnimation(animation);
  }, 3000);
}