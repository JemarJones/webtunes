$(document).ready(function(){
	$("#second_screen").hide();
	$("#xml_file").change(function(){
		$("#first_screen").hide();
		$("#second_screen").show();
	});
	$("#submit_xml").click(function(){
		$("#upload_xml_form").submit();
	})
});