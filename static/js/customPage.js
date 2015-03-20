$(document).ready(function(){
	$('#sortCont').hide();
	$('#sortCont').css('opacity', '1.0');
	$('#alb').on('click',switchMode);
	$('#lib').on('click',switchMode);
});

var switchMode = function(){
	var oldView;
	var newView;
	if ($(this)[0] != $('#alb')[0]){
		oldView = '#alb';
		newView = '#lib';
		// $('#sortCont').removeClass('hide');
		$('#sortCont').fadeIn();
		$('#contentView').fadeOut();
	}else{
		oldView = '#lib';
		newView = '#alb';
		// $('#sortCont').addClass('hide');
		$('#sortCont').fadeOut();
		$('#contentView').fadeIn();
	}
	$(oldView).removeClass('highlighted').addClass('normal');
	$(newView).addClass('highlighted').removeClass('normal');
};