window.onload = function() {
  var canvas = new aja.Canvas("canvas");
  canvas.verbosity = 3;
  canvas.setBackgroundImage("plains.png");

  var image = new aja.Image("infantry.png");

  function moveDownAndRedraw() {
    image.y += 50;
    canvas.redrawEntity(image);
  };
  
  var animation = new aja.PositionDeltaAnimation(image, 150, 0, 1000, moveDownAndRedraw);
  canvas.addEntity(image);
  canvas.addAnimation(animation);
  
  window.setTimeout(function() {
    canvas.addAnimation(animation);
  }, 3000);
  
  window.setTimeout(function() {
    image.visible = false;
    canvas.redrawEntity(image);
  }, 6000);
  
  window.setTimeout(function() {
    image.visible = true;
    canvas.redrawEntity(image);
  }, 7000);
}