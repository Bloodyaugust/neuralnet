$(function () {
  setTimeout(function () {
    $('body').addClass('loaded');

    setTimeout(function () {
      var $canvas = $('canvas');

      $('header').addClass('show');
      $('canvas').addClass('show');
    }, 1000);
  }, 500);
});
