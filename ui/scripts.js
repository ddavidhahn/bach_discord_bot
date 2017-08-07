var queue = [];
var currentSong;
var firstRun = true;
var $fadeDivsIn;

$(document).ready(function () {
    $fadeDivsIn = $('body .container div.initial-animate');
    var fadeInTime = 0;

    // Stagger initial fade in animation
    $fadeDivsIn.each(function (index, value) {
        var $targetDiv = $(value);
        setTimeout(function () {
            $targetDiv.fadeIn();
        }, fadeInTime);
        fadeInTime += 500;

        if (index == $fadeDivsIn.length - 1) {
            setTimeout(pollUpdates, fadeInTime);
        }
    });
    // setInterval(pollUpdates, 1000); // TODO: Revert after testing
});

var updateCurrentSong = function() {
    var $currentSong = $("#current-song-info");
    var $defaultCurrentSong = $("#default-current-song");

    if (firstRun) {
        if (currentSong == '') {
            $defaultCurrentSong.fadeIn(1000, 'linear');
        } else {
            $currentSong.html(currentSong);
            $currentSong.fadeIn(1000, 'linear');
        }
        firstRun = false;
        return;
    }

    if ($currentSong.is(":visible") && currentSong == '') {
        $defaultCurrentSong.fadeIn(200, function () {
            $currentSong.fadeOut(200);
        });
    } else if (!$currentSong.is(":visible") && currentSong != '') {
        $defaultCurrentSong.fadeOut(200, function () {
            $currentSong.html(currentSong);
            $currentSong.fadeIn(200);
        });
    }
};

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
    console.log("Polling")
    $.ajax({
        type: 'GET',
        contentType: 'application/json',
        url: 'http://localhost:3000/endpoint',
        success: function(data) {
            console.log(data);
            var payload = JSON.parse(data);
            queue = payload['songs'];
            currentSong = payload['current_song'];
            updateCurrentSong();
            updateQueue();
        }
    });
}
