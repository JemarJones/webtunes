//Router functions for the customPage
exports.customPage = function(req, res){
	res.render('customPage',{css: ['./css/customPage.css']});
};