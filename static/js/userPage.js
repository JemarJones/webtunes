//Client side js for customPage
var albums;//The albums currently being displayed for this user
var songs;
var user;//Username for this user
var expanded = false;//Stores whether the player is currently expanded or not
var viewToRestore;//Keeps track of view that was being shown before player expansion
var lastKey = "";//Keeps track of last search to help fend off async issues
var sortBy = 'title';
var playableOnly = false;
$(document).ready(function(){
	initData();//Getting intial album and user data
	$('#search').keyup(search);
	$('.navDiv').on('click',switchMode);
	$('.albumCont').on('click',expandAlbum);
	$('.song').on('click', expandSong);
	$('.song').on('click', playRemaining);
	$('#closeBar').on('click',closePlayer);
	$('#albWrapper').on('click', playFull);
	$('.sorter').on('click', sort);
	$('.playCol').on('click',togglePlayable);
});
var initData = function(){
	user = $('meta[name="user"]').attr('content');
	$.get("../../data/" + user,function(res){
		albums = res[0];
		songs = res[1];
	});
};
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
//Searches for and displays all music matching the key in the search box
var search = function(){
	var key = $('#search').val();
	lastKey = key;
	var keySection;
	if (lastKey === ""){
		keySection = "";
	}else{
		keySection = "/" + lastKey;
	}
	$.get("../../organize/" + user + keySection + "/" + sortBy , function(searchMatches){
		if (lastKey == key){//Due to async if a new key has been requested since this one, we stop trying to do this one
			populateLib(searchMatches[0],playableOnly);//Loading matches songs into library
			songs = searchMatches[0];
			//Populating album view with matched albums
			$('.albumCont').remove();//My testing shows that removing everything and repopulating is faster and simpler than going through and removing things that don't match
			albums = searchMatches[1];//Updating this global variable so the code to play albums works as expected
			//Adding each album with matched songs to album view
			for (var i = 0; i < searchMatches[1].length; i++){
				//Constructing album with album data
				var alb = $('<div class="albumCont" data-albumnum="' + i + '"></div');
				alb.append($('<img class="albCover"src="' + searchMatches[1][i][0].art_md + '">'));
				alb.append($('<p class="albTitle">'+searchMatches[1][i][0].album+'</p>'));
				alb.append($('<p class="albArtist"> -'+searchMatches[1][i][0].artist+'</p>'));
				//Adding album to album view
				$('#albumView').append(alb);
			}
			//Giving newly created albums their event handlers
			$('.albumCont').on('click',expandAlbum);
		}
	});
};
var sort = function(){
	$('.sorter').removeClass('highlighted');
	$(this).addClass('highlighted');
	sortBy = $(this).text().toLowerCase();
	var keySection;
	if (lastKey === ""){
		keySection = "";
	}else{
		keySection = "/" + lastKey;
	}
	$.get("../../organize/" + user + keySection + "/" + sortBy, function(matches){
		songs = matches[0];
		populateLib(matches[0],playableOnly);
	});//Loading in sorted songs into library
};
var togglePlayable = function(){
	playableOnly = !playableOnly;
	populateLib(songs,playableOnly);
};
//Populates library view with given tracks
var populateLib = function(songArray,showPlayableOnly){
	$('.song').remove();//My testing shows that removing everything and repopulating is faster and simpler than going through and removing things that shouldnt be there
	//Adding each song to the song view
	var skipped = 0;
	for (var i = 0; i < songArray.length; i++){
		if (!(songArray[i].track_id == "-" && showPlayableOnly)){
			//Figuring out the correct class to assign for styling purposes
			var classToAdd = "";
			if ((i-skipped) % 2 === 0){
				classToAdd = "even";
			}else{
				classToAdd = "odd";
			}
			//Constructing table row with song data
			var row = $('<tr data-num="' + i + '" data-id="' + songArray[i].track_id+'" class="song '+ classToAdd + '"></tr>');
			row.append($('<td class="title">' + songArray[i].title + '</td>'));
			row.append($('<td class="album">' + songArray[i].album + '</td>'));
			row.append($('<td class="artist">' + songArray[i].artist + '</td>'));
			row.append($('<td class="playcount">' + songArray[i].playcount + '</td>'));
			var playStatus;
			if (songArray[i].track_id == "-"){
				playStatus = "notplayable";
			}else{
				playStatus = "playable";
			}
			row.append($('<td class="' + playStatus + '"></td>'));
			//Adding row to table
			$('#songView').append(row);
		}else{
			skipped++;
		}
	}
	//Giving newly created songs their event handlers
	$('.song').on('click', expandSong);
	$('.song').on('click', playRemaining);
};
//handler to expand an album when its clicked on
var expandAlbum = function(){
	// var _window = window.open("https://play.spotify.com/trackset",'_blank');
	if (!expanded){
		expanded = true;
		var elem = this;
		var tracks = albums[$(elem).data("albumnum")];
		var src = "https://embed.spotify.com/?uri=spotify:trackset:"+tracks[0].album+ ":";
		for (var i = 0; i < tracks.length; i++){
			if (i == tracks.length - 1 ){
				src += tracks[i].track_id;
			}else{
				src += tracks[i].track_id + ",";
			}
			$('#trackList').append('<li class="track hover" data-id="'+ tracks[i].track_id+ '"data-title="'+ tracks[i].title+ '"data-artist="'+ tracks[i].artist+ '" data-num='+ i+ '>' +'<img class="trkImg" src="../images/play_button.png"/>  '+tracks[i].title + " - " + tracks[i].artist + '</li>');
		}
		$('#albWrapper').addClass('hover');
		displayPlayer([tracks[0].art_lg,tracks[0].album,tracks[0].artist],$('#albumView'));
		$('#albWrapper').attr('data-ids', src);
		$('.track').on('click', playTrack);
	}
};
//Code to close up the spotify player
var closePlayer = function(){
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
		var index = 0;
		for (var i = 0; i < albums.length; i++){
			for (var j = 0; j < albums[i].length;j++){
				if (index == $(elem).attr("data-num")){
					displayPlayer([albums[i][j].art_lg,albums[i][j].title ,albums[i][j].artist],$('#songView'));
				}
				index = index + 1;
			}
		}
		$('#albWrapper').removeClass('hover');
	}
};
//Loads provided data into spotify player and displays
var displayPlayer = function(displayData,oldView){
	viewToRestore = oldView;
	if (displayData[0] != ""){
		$('#bg').css("background-image","url("+displayData[0]+")");
		$('#bigAlb').attr("src",displayData[0]);
	}
	$('#songAlbum').text(displayData[1]);
	$('#songArtist').text(displayData[2]);
	$('#header').fadeOut();
	viewToRestore.fadeOut(400,function(){
		$('#bg').fadeIn();
		$('#overlay').fadeIn();
	});
};
var playTrack = function(){
	displayPlayer(["",$(this).attr('data-title') ,$(this).attr('data-artist')],$('#albumView'));
	$('.track').fadeOut();
	if ($(this).attr('data-id') != "-"){
		var src = "https://embed.spotify.com/?uri=spotify:trackset:"+$(this).attr('data-title')+ ":" + $(this).attr('data-id');
		$('iframe').remove();
		var iframe = $('<iframe frameborder="0" allowtransparency="true" src="'+src+'">'+'</iframe>');
		$('#overlay').append(iframe);
	}
	$('#albWrapper').removeClass('hover');
};
//Plays up to around 70 songs after a clicked song (for library and inside album)
var playRemaining = function(){
	// var num = parseInt($(this).attr('data-num'),10);
	var src = "https://embed.spotify.com/?uri=spotify:trackset:"+$('#songAlbum').text()+ ":" + $(this).attr('data-id');
	// var elemClass = $(this).hasClass("track") ? ".track" : ".song";
	// $(elemClass).each(function(){
	// 	// if (parseInt($(this).attr('data-num'),10) >= num && (parseInt($(this).attr('data-num'),10) - num) <= 70){
	// 	if (parseInt($(this).attr('data-num'),10) == num){
	// 		src += $(this).attr('data-id');
	// 	}
	// });
	// src = src.substring(0,src.length-1);
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
