
$(document).ready(function(){
    $(".txtb input").each(function(index) {
        if ($(this).val() != "") {
            $(this).addClass("focus");
        }
    })
});

$(".txtb input").on("focus",function(){
    $(this).addClass("focus");
});

$(".txtb input").on("blur",function(){
    if($(this).val() == "")
        $(this).removeClass("focus");
});