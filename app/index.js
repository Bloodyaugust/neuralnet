$(function () {
  var stage = new PIXI.Container(),
    network = new synaptic.Architect.Perceptron(40, 25, 3),
    renderer;

  setTimeout(function () {
    $('body').addClass('loaded');

    setTimeout(function () {
      var $canvas = $('canvas');

      $('header').addClass('show');
      $('canvas').addClass('show');

      renderer = new PIXI.autoDetectRenderer($canvas.innerWidth(), $canvas.innerHeight(), {
        view: $canvas[0]
      });
    }, 1000);
  }, 500);

  function render () {
    renderer.render(stage);
    requestAnimationFram(render);
  }
});
