/// <reference path="../jquery21/jquery-2.1.0-vsdoc.js" />

//TODO: call this function when the document is ready
moviPlayer();

function moviPlayer() {
    var pivot = document.getElementById("moviPlayer");
    //replace the id to be used by the youtube player
    pivot.id = "player";

    //var editor = document.createElement("div");
    //editor.id = "player"
    //this replaces the ID 
    //pivot.parentNode.replaceChild(editor, pivot);

}

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;

//TODO: we are using a hardcoded video ID for testing
//youtube api video M7lc1UVf-VE
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: $('#videoContainer').height(),
        width: $('#videoContainer').width(),
        videoId: 'RaQa201Hezs',
        playerVars: { wmode: "opaque" },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
    //setting up the renderer
    //TODO: the last elemente set the refresh time
    //but it seem that youtube API has a fixed refresh rate
    window.setInterval("updatePlayerInfo()", 17);
}
// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    event.target.playVideo();
}
// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        setTimeout(stopVideo, 6000);
        done = true;
    }
}
function stopVideo() {
    player.stopVideo();
}

function seekVideo(time) {
    player.seekTo(time, true);
}

function pauseVideo() {
    player.pauseVideo();
}
//setting up the tracking area renderer
function updatePlayerInfo() {
    if (player && player.getDuration && player.getPlayerState() == 1) {
        //tracking engine v2
        mainController.render(player.getCurrentTime());
    }
}

//-------------------- end of youtube api functions-----------------------------


function moviTrackedUserControl(parentSvgDOM, trackData) {
    
    var hasTrack = false;

    if (trackData != null) {
        var rectangle = new trackingRectangle(parentSvgDOM);
        hasTrack = true;
    }

    function render(time, offset) {
        if (!hasTrack) {
            return;
        }
        var innerIndex = binaryIndexOf.call(trackData.timeLine, time);
        if ((time < trackData.timeLine[0] || time > trackData.timeLine[trackData.timeLine.length - 1])) {
            //the asked time is outside the timeLine definition, hide the rectangle
            rectangle.collapse();
        }
        else if (offset == null) {
            //draw the position without any offset
            if (innerIndex < 0) {
                rectangle.draw(trackData.Xtl[-innerIndex], trackData.Xbr[-innerIndex], trackData.Ytl[-innerIndex], trackData.Ybr[-innerIndex]);
            } else {
                rectangle.draw(trackData.Xtl[innerIndex], trackData.Xbr[innerIndex], trackData.Ytl[innerIndex], trackData.Ybr[innerIndex]);
            }
            //the parameter is the data to be sent to the areaVisible event handler
            //TODO: a text is set until we implement the twitter functionality
            rectangle.visible("tweet list");
        }
        else {
            //draw the position applying the offset
            //TODO: this only works on the standard wide screen ratio
            if (innerIndex < 0) {
                rectangle.draw(trackData.Xtl[-innerIndex] * offset, trackData.Xbr[-innerIndex] * offset, trackData.Ytl[-innerIndex] * offset, trackData.Ybr[-innerIndex] * offset);
            } else {
                rectangle.draw(trackData.Xtl[innerIndex] * offset, trackData.Xbr[innerIndex] * offset, trackData.Ytl[innerIndex] * offset, trackData.Ybr[innerIndex] * offset);
            }
            //the parameter is the data to be sent to the areaVisible event handler
            //TODO: a text is set until we implement the twitter functionality
            rectangle.visible("tweet list");
        }
    }
    return {
        render: render,
    }

}

function moviPlayerController(userControlContainerId, sourceWidth, sourceHeight, queryToken) {
    var trackingAreaAndInfo = [];
    var trackDataReady = false;

    //scale control variables
    var myScaler = scaler($('#videoContainer').width(), $('#videoContainer').height(), sourceWidth, sourceHeight);

    //make a reference to the front end render controller
    userControl = new moviUserControls(userControlContainerId);
    
    //call the service and initialice the data structures
    getSessionInfo();

    function render(time, offset) {
        if (trackDataReady) {
            for (var i = 0; i < trackingAreaAndInfo.length; i++) {
                //tracking engine v2
                trackingAreaAndInfo[i].render(time, offset);
            }
        }
    }

    //get the highlights to render
    //TODO: this is temporal, adjust this to use a session token
    //and an arbitraty trackArea type
    function getSessionInfo ()
    {
        $.ajax({
            url: "http://moviserver.cloudapp.net/service1.svc/web/getHighlights",
            type: "POST",
            cache: false,
            //CARE: the parameter name MUST match the parameter definition on wcf
            data: JSON.stringify({
                //this is an existin project, this id must come from the session.
                projectToken: queryToken,
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            //note: complete responds with data.responseJSON
            // success responds with data directly
            success: function (data) {
                //TODO: the service respond with the trackarea tokens, 
                //we can use them to allow data edit.
                
                trackDataReady = true;

                for (var i = 0; i < data.d.length; i++) {
                    if (data.d[i].trackData != null) {
                        myScaler.scaleReceived(data.d[i].trackData.Xtl, data.d[i].trackData.Ytl,
                                            data.d[i].trackData.Xbr, data.d[i].trackData.Ybr)
                    }
                    trackingAreaAndInfo.push(new moviTrackedUserControl($('#svgRoot').get(0), data.d[i].trackData));
                    userControl.addHightlight(data.d[i].title, data.d[i].content, data.d[i].startTime, data.d[i].endTime);
                }
                alert('get highlight success');

            },
            error: function (response) {
                alert('Failed: ' + response.statusText);
            }
        });
    }

    return {
        render: render,
    }
}