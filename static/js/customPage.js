$(document).ready(function(){
	$('#alb').on('click',switchMode);
	$('#lib').on('click',switchMode);
});

var switchMode = function(){
	var oldView;
	var newView;
	if ($(this)[0] != $('#alb')[0]){
		oldView = '#alb';
		newView = '#lib';
		$('#sortCont').removeClass('hide');
		$('#contentView').fadeOut();
	}else{
		oldView = '#lib';
		newView = '#alb';
		$('#sortCont').addClass('hide');
		$('#contentView').fadeIn();
	}
	$(oldView).removeClass('highlighted').addClass('normal');
	$(newView).addClass('highlighted').removeClass('normal');
};