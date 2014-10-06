$(function () {
    'use strict';

    //set up our file upload script
    $("#uploader").html5Uploader({
        url: '/upload',
        maxFileSize: 1024 * 1024 * 50
    });

    // Load informations about the already uploaded files (We don't use this, but maybe you will need. Check the console.)
    $.ajax({
        url: $('#uploader').html5Uploader('option', 'url'),
        dataType: 'json',
        context: $('#uploader')[0]
    }).always(function () {

    }).done(function (result) {
        console.log(result.files);
    });
});