$(function () {
    'use strict';

    //set up our file upload script
    $("#uploader").html5Uploader({
        url: $("#uploader").data("path"),
        maxFileSize: $("#uploader").data("max-size")
    });
});
