//A little hack to open up the spotify trackset window without loosing focus
if (window.name != "final"){
	var url = window.location.href;
	var newWin = window.open(url,"final");
	if(!newWin || newWin.closed || typeof newWin.closed=='undefined'){
		//This breaks down quickly with popup blockers
		newWin = undefined;
		alert("Please disable your popup blocker to enjoy Webtunes. We promise to be responsible!");
	}else{
		window.location = "https://play.spotify.com/trackset";
	}
}
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
	$('#search').keyup(search);
	$('#search').on('search',search);
	$('#searchForm').submit(function(e){
		//This makes it so the page doesn't refresh on 'Enter'
		e.preventDefault();
		return false;
	});
	$('.navDiv').on('click',switchMode);
	$('.albumCont').on('click',expandAlbum);
	$('.song').on('click', expandSong);
	$('#closeBar').on('click',closePlayer);
	$('#albWrapper').on('click', playFull);
	$('.sorter').on('click', sort);
	$('.playCol').on('click',togglePlayable);
});
//handler to fade between views nicely
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
	//Getting key to search for
	var key = $('#search').val();
	lastKey = key;//We use this later to validate that we're displaying the latest key
	//Dealing with the 1 case where our url scheme breaks down a bit
	var keySection;
	if (lastKey === ""){
		keySection = "";
	}else{
		keySection = "/" + lastKey;
	}
	//Making the actual request to the server to do the searching
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
//Sorts the users library according to there sorting choice
var sort = function(){
	//Making it clear which column we're sorting by
	$('.sorter').removeClass('highlighted');
	$(this).addClass('highlighted');
	//Getting the comparision to sortby
	sortBy = $(this).text().toLowerCase();
	var keySection;
	//Dealing with the 1 case where our url scheme breaks down a bit
	if (lastKey === ""){
		keySection = "";
	}else{
		keySection = "/" + lastKey;
	}
	//Making the actual request for the server to do the sorting
	$.get("../../organize/" + user + keySection + "/" + sortBy, function(matches){
		songs = matches[0];//Updating our list of songs to this new sorted version
		populateLib(matches[0],playableOnly);//Loading the songs into the lib view
	});
};
//This is used to switch between displaying all songs and only playable ones
var togglePlayable = function(){
	//Note that we don't need to make a server request, we can just load the curreny songs and exclude unplayables
	playableOnly = !playableOnly;
	populateLib(songs,playableOnly);
};
//Populates library view with given tracks
var populateLib = function(songArray,showPlayableOnly){
	$('.song').remove();//My testing shows that removing everything and repopulating is faster and simpler than going through and removing things that shouldnt be there
	//Adding each song to the song view
	var skipped = 0;//Number of songs skipped (unplayable ones)
	for (var i = 0; i < songArray.length; i++){
		if (!(songArray[i].track_id == "-" && showPlayableOnly)){//If we're not showing unplayables and this is one, we naturally skip it
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
			//We distinguish playable from not playable here and use css to make it clear
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
			skipped++;//We keep track of the skipped tracks so we can calculate index's correctly
		}
	}
	//Giving newly created songs their event handlers
	$('.song').on('click', expandSong);
};
//handler to expand an album when its clicked on
var expandAlbum = function(){
	if (!expanded){//Making sure you can only open one of these at a time
		expanded = true;
		var elem = this;
		var tracks = albums[$(elem).data("albumnum")];//Getting the associated album
		//Loading in the data for all tracks on this album
		var src = "https://embed.spotify.com/?uri=spotify:trackset:"+tracks[0].album+ ":";
		for (var i = 0; i < tracks.length; i++){
			if (i == tracks.length - 1 ){
				src += tracks[i].track_id;
			}else{
				src += tracks[i].track_id + ",";
			}
			$('#trackList').append('<li class="track hover" data-id="'+ tracks[i].track_id+ '"data-title="'+ tracks[i].title+ '"data-artist="'+ tracks[i].artist+ '" data-num='+ i+ '>' +'<img class="trkImg" src="../images/play_button.png"/>  '+tracks[i].title + " - " + tracks[i].artist + '</li>');
		}
		$('#albWrapper').addClass('hover');//Adding some css for reactivity
		//Setting up rest of player
		displayPlayer([tracks[0].art_lg,tracks[0].album,tracks[0].artist],$('#albumView'));
		$('#albWrapper').attr('data-ids', src);
		$('.track').on('click', playTrack);
	}
};
//Code to close up the spotify player
var closePlayer = function(){
	$('#bg').fadeOut();
	$('#overlay').fadeOut(400,function(){
		//So that the animation flows and it less jumpy
		$('#header').fadeIn();
		viewToRestore.fadeIn();
		$('.track').remove();
		$('iframe').remove();
	});
	expanded = false;
};
//Funciton to expand a chosen song
var expandSong = function(){
	if (!expanded){//Making sure you can only open one of these at a time
		expanded = true;
		var index = parseInt($(this).attr("data-num"),10);//Gettig the associated song
		displayPlayer([songs[index].art_lg,songs[index].title ,songs[index].artist],$('#songView'));
		$('#albWrapper').removeClass('hover');
		//Setting up iframe(spotify player) for this song
		if ($(this).attr("data-id") !== "-"){
			var src = "https://embed.spotify.com/?uri=spotify:trackset:"+$('#songAlbum').text()+ ":" + $(this).attr('data-id');
			$('iframe').remove();
			var iframe = $('<iframe frameborder="0" allowtransparency="true" src="'+src+'">'+'</iframe>');
			$('#overlay').append(iframe);
		}
	}
};
//Loads provided data into visual player
var displayPlayer = function(displayData,oldView){
	viewToRestore = oldView;//This will be needed when closing the player
	//Setting up player visually
	//Changes the image if one is given (if not then its likely already been set)
	if (displayData[0] !== ""){
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
//Plays individual track when already within an album
var playTrack = function(){
	//Updating player with new track specific info
	displayPlayer(["",$(this).attr('data-title') ,$(this).attr('data-artist')],$('#albumView'));
	$('.track').fadeOut();
	if ($(this).attr('data-id') != "-"){
		//Showing iframe if this track is playable
		var src = "https://embed.spotify.com/?uri=spotify:trackset:"+$(this).attr('data-title')+ ":" + $(this).attr('data-id');
		$('iframe').remove();
		var iframe = $('<iframe frameborder="0" allowtransparency="true" src="'+src+'">'+'</iframe>');
		$('#overlay').append(iframe);
	}
	$('#albWrapper').removeClass('hover');
};
//Plays a full album
var playFull = function(){
	//Settign up iframe with full album ids included
	$('iframe').remove();
	var iframe = $('<iframe frameborder="0" allowtransparency="true" src="'+$(this).attr('data-ids')+'">'+'</iframe>');
	$('#overlay').append(iframe);
};
