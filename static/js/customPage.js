$(document).ready(function(){
	//A hack-y way to intially hide sorting options.. More difficult with css.
	$('#sortCont').hide();
	$('#sortCont').css('opacity', '1.0');
	//Assigning event handlers to switch modes
	$('#alb').on('click',switchMode);
	$('#lib').on('click',switchMode);
	$('.albumCont').on('click',expandAlbum);
});

//handler to fade between modes nicely
var switchMode = function(){
	var oldView;
	var newView;
	if ($(this)[0] != $('#alb')[0]){
		oldView = '#alb';
		newView = '#lib';
		$('#sortCont').fadeIn();
		$('#contentView').fadeOut();
	}else{
		oldView = '#lib';
		newView = '#alb';
		$('#sortCont').fadeOut();
		$('#contentView').fadeIn();
	}
	$(oldView).removeClass('highlighted').addClass('normal');
	$(newView).addClass('highlighted').removeClass('normal');
};
var expandAlbum = function(){
	var elem = this;
	$.get("../../data/" + $(elem).attr("data-user"),function(albums){
		console.log(albums[$(elem).data("albumNum")]);
	});
};