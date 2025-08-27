(function($) {

  "use strict";

  /* globals jQuery */

  var panel = $('#mfn-demo-panel');
  var body = $('body');

  /**
   * Pre-built websites images list height
   */

  function demosSliderH() {

    var panelH = panel.height() - $('.header', panel).height() - $('.footer', panel).height();
    $('.demos-slider', panel).height(panelH);

  }

  /**
   * Source = iframe
   */

  function iframe(){

    if( ! body.hasClass('source-iframe') ){
      return;
    }

    // gdpr 2.0
    $( '#consent_deny', body ).trigger('click');
    $( '#mfn-consent-mode', body ).remove();

    // gdpr 1.0
    $( '.mfn-gdpr-button', body ).trigger('click');
    $( '#mfn-gdpr', body ).remove();

    // remove popups
    $( '.mfn-popup-tmpl-display-on-start, .mfn-popup-tmpl-display-on-scroll, .mfn-popup-tmpl-display-scroll-to-element', body ).remove();

    // prevent scroll
    $('html').removeClass('mfn-popup-browser-scroll-disabled');

    $(window).on('scroll', function(){
      $('html').removeClass('mfn-popup-browser-scroll-disabled');
    });

  }

  /**
   * $(document).ready
   * Specify a function to execute when the DOM is fully loaded.
   */

  $(function() {

    /*
     * sliding panel open/close
     */

    panel.on('click', '.control.sliding', function(e) {

      e.preventDefault();

      if (panel.hasClass('active')) {

        panel.removeClass('active');

        if ($('body').hasClass('header-rtl')) {
          panel.animate({
            'left': -367
          }, 500);
        } else {
          panel.animate({
            'right': -367
          }, 500);
        }

      } else {

        panel.addClass('active');

        if ($('body').hasClass('header-rtl')) {
          panel.animate({
            'left': 0
          }, 500);
        } else {
          panel.animate({
            'right': 0
          }, 500);
        }

        if ($().niceScroll) {
          setTimeout(function(){
            $('.demos-slider', panel).niceScroll().doScrollTop(0, 500);
          }, 0);
        }

      }

    });

    /**
     * nice scroll
     */

    if ( panel.length && $().niceScroll ) {
      $('.demos-slider', panel).niceScroll({
        autohidemode: false,
        cursorborder: '0',
        cursorborderradius: '5',
        cursorcolor: '#222222',
        cursorwidth: '0',
        horizrailenabled: false,
        mousescrollstep: '40',
        scrollspeed: '60'
      }).doScrollTop(620, 0);
    }

    /**
     * .ready functions
     */

    iframe();
    demosSliderH();

    /**
     * debouncedresize
     */

    $(window).on('debouncedresize', function() {

      demosSliderH();

    });

  });

})(jQuery);
