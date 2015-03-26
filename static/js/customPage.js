var expanded = false;
$(document).ready(function(){
	//A hack-y way to intially hide sorting options.. More difficult with css.
	$('#sortCont').hide();
	$('#sortCont').css('opacity', '1.0');
	$('#songView').hide();
	$('#songView').css('opacity', '1.0');
	//Assigning event handlers to switch modes
	$('#alb').on('click',switchMode);
	$('#lib').on('click',switchMode);
	$('.albumCont').on('click',expandAlbum);
	$('.song').on('click',expandSongs);
});

//handler to fade between modes nicely
var switchMode = function(){
	var oldView;
	var newView;
	if ($(this)[0] != $('#alb')[0]){
		oldView = '#alb';
		newView = '#lib';
		$('#albumView').fadeOut();
		$('#sortCont').fadeIn();
		$('#songView').fadeIn();
	}else{
		oldView = '#lib';
		newView = '#alb';
		$('#songView').fadeOut();
		$('#sortCont').fadeOut();
		$('#albumView').fadeIn();
	}
	$(oldView).removeClass('highlighted').addClass('normal');
	$(newView).addClass('highlighted').removeClass('normal');
};
//handler to expand an album when its clicked on
var expandAlbum = function(){
	// var _window = window.open("https://play.spotify.com/trackset",'_blank');
	if (!expanded){
		expanded = true;
		var elem = this;
		$.get("../../data/" + $(elem).attr("data-user"),function(albums){
			var tracks = albums[$(elem).data("albumnum")];
			var src = "https://embed.spotify.com/?uri=spotify:trackset:"+tracks[0].album+ ":";
			for (var i = 0; i < tracks.length; i++){
				if (i == tracks.length - 1 ){
					src += tracks[i].track_id;
				}else{
					src += tracks[i].track_id + ",";
				}
			}
			var iframe = $('<iframe frameborder="0" allowtransparency="true" src="'+src+'"'+'</iframe>');
			$('#header').fadeOut();
			$('#albumView').fadeOut();
			$('body').prepend('<div class="bg"></div>');
			$('.bg').css("background-image","url("+tracks[0].art_lg+")");
			$('body').prepend('<div class="overlay"></div>');
			$('.overlay').append('<img class="bigAlb">');
			$('.bigAlb').attr("src",tracks[0].art_lg);
			$('.overlay').append('<div class="songInfo"></div>');
			$('.overlay').append(iframe);
			$('.songInfo').append('<p class="songAlbum"></p>');
			$('.songAlbum').text(tracks[0].album);
			$('.songInfo').append('<p class="songArtist"></p>');
			$('.songArtist').text(tracks[0].artist);
			$('.bg').fadeIn();
			$('.overlay').fadeIn();
			$('.overlay').on('click',closeAlbum);
			$('.bg').on('click',closeAlbum);
		});
}
};

var closeAlbum = function(){
	$('.overlay').fadeOut();
	$('.bg').fadeOut();
	$('#header').fadeIn();
	$('#albumView').fadeIn();
	$('.overlay').remove();
	$('.bg').remove();
	expanded = false;
};
var expandSongs = function(){
	if (!expanded){
		expanded = true;
		var elem = this;
		$.get("../../data/" + $(elem).attr("data-user"),function(albums){
			var src = "https://embed.spotify.com/?uri=spotify:trackset:Library:";
			var add = false;
			for (var i = 0; i < albums.length; i++){
				for (var j = 0; j < albums[i].length; j++){
					if (albums[i][j].track_id == $(elem).attr("data-id")){
						add = true;
					}
					if (add){
						if (i == albums.length - 1 && j == albums[i].length - 1){
							src += albums[i][j].track_id;
						}else{
							src += albums[i][j].track_id + ",";
						}
					}
				}
			}
			$('#songView').append($('<iframe frameborder="0" allowtransparency="true" src="'+src+'"'+'</iframe>'));
		});
	}
};