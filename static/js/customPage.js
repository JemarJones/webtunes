$(document).ready(function(){
	$('#alb').on('click',switchMode);
	$('#lib').on('click',switchMode);
});

var switchMode = function(){
	var oldView;
	var newView;
	if ($(this)[0] != $('#alb')[0]){
		console.log('Switching to alb');
		oldView = '#alb';
		newView = '#lib';
		$('#sort').show();
		$('#sortOpt').show();
		$('#contentView').hide();
	}else{
		console.log('Switching to lib');
		oldView = '#lib';
		newView = '#alb';
		$('#sort').hide();
		$('#sortOpt').hide();
		$('#contentView').show();
	}
	$(oldView).removeClass('highlighted').addClass('normal');
	$(newView).addClass('highlighted').removeClass('normal');
};