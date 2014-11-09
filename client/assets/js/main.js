(function($) {

	$(document).ready(function() {
		header.init();
	});


	var header = {
		dropdownBtn: {},
		dropdown: function(){
			console.log(header.dropdownBtn);
			$(document).on("click", '.dropdownBtn', function(e){
				e.preventDefault();
				console.log('clicked');
				$('.dropdown').toggleClass("open");
			});
		},
		init: function(){
			console.log('header init');
			header.dropdownBtn = $('.dropdownBtn');
			header.dropdown();
		}
	}

})(jQuery);