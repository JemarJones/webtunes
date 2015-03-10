//Router functions for the customPage
exports.customPage = function(req, res){
	res.render('customPage',{css: ['./css/customPage.css'], albums: [{img: './images/duck1.jpg', title: 'Quack', artist: 'Duck Squad'}]});
};