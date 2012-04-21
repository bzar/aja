window.onload = function() {
  var canvas = new aja.Canvas("canvas");
  canvas.verbosity = 3;
  
  
  bgImage = new Image();
  bgImage.src = "plains.png";
  bgImage.onload = function() {
    var bg = canvas.background.getContext("2d");
    bg.drawImage(bgImage, 0, 0);
    canvas.forceRedraw();
  }
  
  
  var image = new aja.Image("infantry.png");
  var image2 = new aja.Image("infantry.png");
  var animation = new aja.SequentialAnimation([
    new aja.ParallelAnimation([
      new aja.PositionAnimation(image, 0, 400, 150, 400, 1000),
      new aja.PositionAnimation(image2, 400, 50, 300, 50, 1000)
    ]),
    new aja.PauseAnimation(500),
    new aja.ParallelAnimation([
      new aja.PositionAnimation(image, 150, 400, 150, 50, 1000),
      new aja.PositionAnimation(image2, 300, 50, 300, 400, 1000)
    ]),
    new aja.PauseAnimation(500),
    new aja.ParallelAnimation([
      new aja.PositionAnimation(image, 150, 50, 300, 200, 1000),
      new aja.PositionAnimation(image2, 300, 400, 150, 200, 2000)
    ]),
    new aja.PauseAnimation(500),
    new aja.ParallelAnimation([
      new aja.PositionAnimation(image, 300, 200, 0, 400, 1000),
      new aja.PositionAnimation(image2, 150, 200, 400, 50, 1000)
    ])
  ]);
  animation.loops = 3;
  canvas.addEntity(image);
  canvas.addEntity(image2);
  canvas.addAnimation(animation);
  
  var image3 = new aja.Image("infantry.png");
  var animation2 = new aja.SequentialAnimation([
    new aja.PositionAnimation(image3, 50, 400, 400, 400, 2000),
    new aja.PositionAnimation(image3, 400, 400, 400, 50, 2000),    
    new aja.PositionAnimation(image3, 400, 50, 50, 50, 2000),
    new aja.PositionAnimation(image3, 50, 50, 50, 400, 2000)
  ]);
  
  animation2.loops = aja.Animation.Infinite;
  canvas.addEntity(image3);
  canvas.addAnimation(animation2);
}