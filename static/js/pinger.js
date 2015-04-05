$(document).ready(function(){
	$(".progress_bar").width("0px");
	setInterval(function(){
		console.log("Checking if done on user: "+user);
		$.post("/ping_user", {
			user: user
		}).done(function(data){
			if(data.complete){
				console.log("We're done! Redirecting");
				//location.replace("http://app-webtunes.rhcloud.com/u/"+user);
			} else {
				console.log(data.progress);
			}
		});
	},5000);
});