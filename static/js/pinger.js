$(document).ready(function(){
	$(".progress_bar").width("0px");
	setInterval(function(){
		console.log("Checking if done on user: "+user);
		$.post("/ping_user", {
			user: user
		}).done(function(data){
			if(data.complete){
				console.log("We're done! Redirecting");
				location.replace("http://app-webtunes.rhcloud.com/u/"+user);
			} else {
				console.log(data.progress);
				$(".progress_bar").animate({
					width: 100*(parseInt(data.progress)/total)+'%'
				},6000);
			}
		});
	},5000);
});