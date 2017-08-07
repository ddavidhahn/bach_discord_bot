var queue = [];
var currentSong;

$(function(){
    $('#select_link').click(function(e){
        e.preventDefault();
        console.log('select_link clicked');

         /*$.ajax({
            dataType: 'jsonp',
            data: "data=yeah",
            jsonp: 'callback',
            url: 'http://localhost:3000/endpoint?callback=?',
            success: function(data) {
                console.log('success');
                console.log(JSON.stringify(data));
            }
        });*/
        var data = {};
        data.title = "title";
        data.message = "message";

        // TODO: Need visual indication of syncing
        $.ajax({
            type: 'GET',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: 'http://localhost:3000/endpoint',
            success: function(data) {
                console.log(data);
                queue = JSON.parse(data);
                // console.log(queue);
            }
        });
        /*$.ajax('http://localhost:3000/endpoint', {
                type: 'POST',
                data: JSON.stringify(data),
                contentType: 'application/json',
                success: function() { console.log('success');},
                error  : function() { console.log('error');}
        });*/
    });
});

var updateQueue = function() {
    var $queue = $("#queue");
    if (queue.length > 0) {
        var htmlString = "";
        queue.forEach(function(song) {
            htmlString += '<li class="list-group-item clearfix song-entry">' +
                '<span class="pull-left">' + song.title + '</span>' +
                // '<span class="pull-right">' +
                    // '<span class="glyphicon glyphicon-play-circle" aria-hidden="true"></span>' +
                // '</span>' +
            '</li>';
        });
        $queue.empty();
        $queue.html(htmlString);

        if (!$queue.is(":visible")) {
            $queue.slideDown();
            $("#default-queue").hide();
        }
    } else {
        if ($queue.is(":visible")) {
            $queue.slideUp(function () {
                $("#default-queue").show();
            });
        }
    }
};

// Poll the server for updates to the playlist every second.
var pollUpdates = function () {
    $.ajax({
        type: 'GET',
        contentType: 'application/json',
        url: 'http://localhost:3000/endpoint',
        success: function(data) {
            console.log(data);
            var payload = JSON.parse(data);
            queue = payload['songs'];
            currentSong = payload['currentSong'];
            updateQueue();
        }
    });
}
pollUpdates();
// setInterval(pollUpdates, 1000);
