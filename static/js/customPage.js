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
//handler to expand an album when its clicked on
var expandAlbum = function(){
	var elem = this;
	$.get("../../data/" + $(elem).attr("data-user"),function(albums){
		var tracks = albums[$(elem).data("albumnum")];
		var src = "https://embed.spotify.com/?uri=spotify:trackset:"+tracks[0].album+ ":";
		for (var i = 0; i < tracks.length; i++){
			console.log(tracks[i].title);
			if (i == tracks.length - 1 ){
				src += tracks[i].track_id;
			}else{
				src += tracks[i].track_id + ",";
			}
		}
		$('#header').fadeOut();
		$('#contentView').fadeOut();
		$('body').prepend('<div class="bg"></div>');
		$('.bg').css("background-image","url("+tracks[0].art_lg+")");
		$('.bg').css("background-size","cover");
		$('.bg').css("-webkit-filter","blur(25px)");
		$('.bg').css("width",$('body').width());
		$('.bg').css("height",$('body').height());
		$('body').prepend('<div class="overlay"></div>');
		$('.overlay').css("width",$('body').width());
		$('.overlay').css("height",$('body').height());
		$('.overlay').append('<div class="bigAlb"></div>');
		$('.overlay').append('<iframe frameborder="0" allowtransparency="true" src="'+src+'"'+'</iframe>');
		$('.bg').fadeIn();
		$('.overlay').fadeIn();
	});
};