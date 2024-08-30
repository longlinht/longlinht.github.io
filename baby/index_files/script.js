(function($) {

	"use strict";

	// init jarallax parallax
	var initJarallax = function () {
		jarallax(document.querySelectorAll(".jarallax"));
	
		jarallax(document.querySelectorAll(".jarallax-keep-img"), {
		  keepImg: true,
		});
	  }

	var initChocolat = function() {
		Chocolat(document.querySelectorAll('.image-link'), {
			imageSize: 'contain',
			loop: true,
		});
	}

	var initSlider = function() {

		var swiper = new Swiper(".main-swiper", {
			spaceBetween: 30,
			effect: "fade",
			navigation: {
				nextEl: ".swiper-arrow-next",
				prevEl: ".swiper-arrow-prev",
			},
		});

		var swiper = new Swiper(".product-swiper", {
			slidesPerView: 5,
			spaceBetween: 30,
			navigation: {
				nextEl: '.chevron-arrow-right',
				prevEl: '.chevron-arrow-left',
			},
			breakpoints: {
				0: {
					slidesPerView: 1,
					spaceBetween: 20,
				},
				580: {
					slidesPerView: 2,
					spaceBetween: 20,
				},
				800: {
					slidesPerView: 3,
					spaceBetween: 20,
				},
				1299: {
					slidesPerView: 4,
					spaceBetween: 20,
				},
			},
		});

		var swiper = new Swiper(".review-swiper", {
			spaceBetween: 30,
			pagination: {
				el: ".swiper-pagination",
				clickable: true,
			},
		});
	};

	// input spinner
	var initQuantitySpinner = function(){

		$('.product-qty').each(function(){
	
		  var $el_product = $(this);
		  var quantity = 0;
	
		  $el_product.find('.quantity-right-plus').click(function(e){
			  e.preventDefault();
			  var quantity = parseInt($el_product.find('#quantity').val());
			  $el_product.find('#quantity').val(quantity + 1);
		  });
	
		  $el_product.find('.quantity-left-minus').click(function(e){
			  e.preventDefault();
			  var quantity = parseInt($el_product.find('#quantity').val());
			  if(quantity>0){
				$el_product.find('#quantity').val(quantity - 1);
			  }
		  });
	
		});
	
	  }
	

    // window load
	  $(window).load(function() {
		$(".preloader").fadeOut("slow");
	  })


	// ------------------------------------------------------------------------------ //
	// Scroll Top 
	// ------------------------------------------------------------------------------ //
	
	var btn = $('#scroll-top-btn');

	$(window).scroll(function() {
	  if ($(window).scrollTop() > 300) {
		btn.addClass('show');
	  } else {
		btn.removeClass('show');
	  }
	});
	
	btn.on('click', function(e) {
	  e.preventDefault();
	  $('html, body').animate({scrollTop:0}, '300');
	});


	// document ready
	$(document).ready(function() {
		initSlider();
		initChocolat();
		initQuantitySpinner();
		initJarallax();
	}); // document ready

})(jQuery);