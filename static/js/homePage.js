$(document).ready(function(){
    $("#second_screen").hide();
    $("#xml_file").change(showNext);
    $("#submit_xml").click(submitForm);
    $('#username').keyup(validateUser);
});
var showNext = function(){
    $("#first_screen").hide();
    $("#second_screen").show();
};
var submitForm = function(){
    $("#upload_xml_form").submit();
};
var validateUser = function(){
    var username = $('#username').val();
    if (username.length > 0){
        //Username is of valid format so now we'll check if its available
        $.get("../../checkuser/" + username, function(usernameTaken){
            if (usernameTaken){
                //If its taken we indicate that the user must choose a new name
                $('#usernameStatus').text('Username taken, Try another!');
                $('#usernameStatus').css('color', 'red');
                $('#webtunes_submit').attr('disabled',true);//Actually stopping them from submiting
                $('#webtunes_submit').css('background-color', 'rgba(0,0,0,0.5)');
            }else{
                //Otherwise inform them that its okay to use this name
                $('#usernameStatus').text('Username good!');
                $('#usernameStatus').css('color', 'green');
                $('#webtunes_submit').attr('disabled',false);//Letting them submit
                $('#webtunes_submit').css('background-color', '#445878');
            }
        });
    }else{
        //This username isn't even valid, so we inform the user
        $('#usernameStatus').text('Pick a Username');
        $('#usernameStatus').css('color', 'black');
        $('#webtunes_submit').attr('disabled',true);//Actually stopping them from submiting
        $('#webtunes_submit').css('background-color', 'rgba(0,0,0,0.5)');
    }
};