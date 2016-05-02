$(function () {
  setTimeout(function () {
    $('body').addClass('loaded');

    setTimeout(function () {
      $('header').addClass('show');
    }, 1000);
  }, 500);
});
