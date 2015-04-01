//Client side js for customPage
var expanded = false;//Stores whether the player is currently expanded or not
var viewToRestore;
$(document).ready(function(){
	//Assigning event handlers to switch modes
	$('.navDiv').on('click',switchMode);
	$('.albumCont').on('click',expandAlbum);
	$('.song').on('click', expandSong);
	$('.song').on('click', playRemaining);
	// $('#overlay').on('click',closePlayer);
	// $('#bg').on('click',closePlayer);
	$('#closeBar').on('click',closePlayer);
	$('#albWrapper').on('click', playFull);
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
				$('#trackList').append('<li class="track hover" data-id="'+ tracks[i].track_id+ '" data-num='+ i+ '>' +'<img class="trkImg" src="../images/play_button.png"/>  '+tracks[i].title + " - " + tracks[i].artist + '</li>');
			}
			$('#albWrapper').addClass('hover');
			displayPlayer([tracks[0].art_lg,tracks[0].album,tracks[0].artist],$('#albumView'));
			$('#albWrapper').attr('data-ids', src);
			$('.track').on('click', playRemaining);
		});
	}
};
//Code to close up the spotify player
var closePlayer = function(){
	console.log("CLOSING DIS!");
	$('#bg').fadeOut();
	$('#overlay').fadeOut(400,function(){
		$('#header').fadeIn();
		viewToRestore.fadeIn();
		$('.track').remove();
		$('iframe').remove();
	});
	expanded = false;
};
//Funciton to expand a chosen song
var expandSong = function(){
	if (!expanded){
		expanded = true;
		var elem = this;
		$.get("../../data/" + $(elem).attr("data-user"),function(albums){
			var index = 0;
			for (var i = 0; i < albums.length; i++){
				for (var j = 0; j < albums[i].length;j++){
					if (index == $(elem).attr("data-num")){
						displayPlayer([albums[i][j].art_lg,$(elem).attr("data-user") +"'s Library" ,""],$('#songView'));
					}
					index = index + 1;
				}
			}
		});
		$('#albWrapper').removeClass('hover');
	}
};
//Loads provided data into spotify player and displays
var displayPlayer = function(displayData,oldView){
	viewToRestore = oldView;
	$('#bg').css("background-image","url("+displayData[0]+")");
	$('#bigAlb').attr("src",displayData[0]);
	$('#songAlbum').text(displayData[1]);
	$('#songArtist').text(displayData[2]);
	$('#header').fadeOut();
	viewToRestore.fadeOut(400,function(){
		$('#bg').fadeIn();
		$('#overlay').fadeIn();
	});
};
//Plays up to around 70 songs after a clicked song (for library and inside album)
var playRemaining = function(){
	var num = parseInt($(this).attr('data-num'),10);
	var src = "https://embed.spotify.com/?uri=spotify:trackset:"+$('#songAlbum').text()+ ":";
	var elemClass = $(this).hasClass("track") ? ".track" : ".song";
	$(elemClass).each(function(){
		if (parseInt($(this).attr('data-num'),10) >= num && (parseInt($(this).attr('data-num'),10) - num) <= 70){
			src += $(this).attr('data-id') + ",";
		}
	});
	src = src.substring(0,src.length-1);
	$('iframe').remove();
	var iframe = $('<iframe frameborder="0" allowtransparency="true" src="'+src+'">'+'</iframe>');
	$('#overlay').append(iframe);
};
//Plays a full album
var playFull = function(){
	$('iframe').remove();
	var iframe = $('<iframe frameborder="0" allowtransparency="true" src="'+$(this).attr('data-ids')+'">'+'</iframe>');
	$('#overlay').append(iframe);
};
