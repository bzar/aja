window.onload = function() {
  var canvas = new aja.Canvas("canvas");
  canvas.verbosity = 3;
  canvas.setBackgroundImage("plains.png");

  var image = new aja.Image("infantry.png");

  function moveDownAndRedraw() {
    image.y += 50;
    canvas.redrawEntity(image);
  };
  
  var animation = new aja.SequentialAnimation([
    new aja.PropertyAnimation(image, {x: 200}, 1000),
    new aja.PropertyAnimation(image, {x: 0, y: 50}, 1000),
    new aja.PropertyAnimation(image, {x: {delta: 100}}, 1000),
    new aja.PropertyAnimation(image, {x: {to: 300}}, 1000),
    new aja.PropertyAnimation(image, {y: 200}, 1000),
    new aja.PropertyAnimation(image, {x: {from: 0, to: 300}}, 1000)
  ]);
  
  canvas.addEntity(image);
  canvas.addAnimation(animation);
}