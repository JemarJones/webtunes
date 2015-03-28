//Client side js for customPage
var expanded = false;//Stores whether the player is currently expanded or not
var viewToRestore;
$(document).ready(function(){
	//A hack-y way to intially hide sorting options.. More difficult with css.
	$('.hide').hide();
	$('.hide').css('opacity', '1.0');
	//Assigning event handlers to switch modes
	$('.navDiv').on('click',switchMode);
	$('.albumCont').on('click',expandAlbum);
	$('.song').on('click',expandSong);
});
//handler to fade between modes nicely
var switchMode = function(){
	var fadeIn = $(this).attr("data-cont");
	$('.navDiv').each(function(){
		if (fadeIn != $(this).attr("data-cont")){
			$(this).removeClass('highlighted').addClass('normal');
			$($(this).attr("data-cont")).fadeOut();
		}else{
			$(this).addClass('highlighted').removeClass('normal');
			$($(this).attr("data-cont")).fadeIn();
		}
	});
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
			displayPlayer(src,[tracks[0].art_lg,tracks[0].album,tracks[0].artist],$('#albumView'));
		});
	}
};
//Code to close up the spotify player
var closePlayer = function(){
	$('.overlay').fadeOut();
	$('.bg').fadeOut();
	$('#header').fadeIn();
	viewToRestore.fadeIn();
	expanded = false;
};
//Funciton to expand a chosen song
var expandSong = function(){
	if (!expanded){
		expanded = true;
		var elem = this;
		$.get("../../data/" + $(elem).attr("data-user"),function(albums){
			var src = "https://embed.spotify.com/?uri=spotify:trackset:";
			var index = 0;
			for (var i = 0; i < albums.length; i++){
				for (var j = 0; j < albums[i].length;j++){
					if (index == $(elem).attr("data-id")){
						// console.log(album);
						src = src + albums[i][j].title+":"+albums[i][j].track_id;
						displayPlayer(src,[albums[i][j].art_lg,albums[i][j].title,albums[i][j].artist],$('#songView'));
					}
					index = index + 1;
				}
			}
		});
	}
};
//Loads provided data into spotify player and displays
var displayPlayer = function(src,displayData,oldView){
	viewToRestore = oldView;
	var iframe = $('<iframe frameborder="0" allowtransparency="true" src="'+src+'"'+'</iframe>');
	$('#header').fadeOut();
	viewToRestore.fadeOut();
	$('.bg').css("background-image","url("+displayData[0]+")");
	$('.bigAlb').attr("src",displayData[0]);
	$('.overlay').append(iframe);
	$('.songAlbum').text(displayData[1]);
	$('.songArtist').text(displayData[2]);
	$('.bg').fadeIn();
	$('.overlay').fadeIn();
	$('.overlay').on('click',closePlayer);
	$('.bg').on('click',closePlayer);
};