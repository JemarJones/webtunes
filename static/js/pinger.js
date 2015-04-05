$(document).ready(function(){
	setInterval(function(){
		console.log("Checking if done on user: "+user);
		$.post("/ping_user", {
			user: user
		}).done(function(data){
			if(data == "done"){
				console.log("We're done! Redirecting");
				location.replace("http://app-webtunes.rhcloud.com/u/"+user);
			} else {
				console.log("Not done yet");
			}
		});
	},5000);
});