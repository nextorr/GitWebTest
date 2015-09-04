/// <reference path="../jquery21/jquery-2.1.0-vsdoc.js" />

//TODO: call this function when the document is ready
moviPlayer();

var urlParameters = queryString(window.location.search.substr(1).split('&'));
//load a default project if the token is not provided
var idToken = projectDefault;
if (urlParameters["token"] != null) {
    idToken = urlParameters["token"];
}

var mainController = moviPlayerController(rootID, videoSourceWidth, videoSourceHeight, idToken)

function moviPlayer() {
    var pivot = document.getElementById("moviPlayer");
    //replace the id to be used by the youtube player
    pivot.id = "player";

}

//this evaluates with every resize
//not that we must optimize for it, like the user is playing with the screen
//but cenrtaily we can make a better job.
$(window).resize(function () {
    mainController.rescaleRenderer($('#videoContainer').width(), $('#videoContainer').height());
});

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
var renderUpdateTime = 33;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: youtubeVideoURL,
        playerVars: { wmode: "opaque", fs: 0 },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
    //setting up the renderer
    //TODO: the last elemente set the refresh time
    //but it seem that youtube API has a fixed refresh rate
    window.setInterval("updatePlayerInfo()", renderUpdateTime);
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
    //if (event.data == YT.PlayerState.PLAYING && !done) {
    //    setTimeout(stopVideo, 6000);
    //    done = true;
    //}
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
//TODO encapsulate this global variables, maybe in the main engine object
var syncTime = 0;
var ytTime = 0;
var renderCounter = 0;
function updatePlayerInfo() {
    if (player && player.getDuration && player.getPlayerState() == 1) {

        //tracking engine v3
        //rendering all the returned track info data
        if (syncTime == player.getCurrentTime()) {
            ytTime = syncTime + (renderCounter * renderUpdateTime) / 1000;
            renderCounter = renderCounter + 1;
        }
        else {
            ytTime = player.getCurrentTime();
            syncTime = player.getCurrentTime();
            renderCounter = 0;
        }

        mainController.render(ytTime);

        //tracking engine v2
        //mainController.render(player.getCurrentTime());
    }
}


//-------------------- end of youtube api functions-----------------------------


function moviTrackedUserControl(parentSvgDOM, trackData) {
    
    var rectangle = new trackingRectangle(parentSvgDOM);
    function render(time, offset) {

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

    function getTrackData() {
        return trackData;
    }

    return {
        render: render,
        getTrackData: getTrackData,
    }

}

//******************************************************************************************************
//***************************OBJECT: MOVI HIGHLIGHT*****************************************************
var MoviHighlight = function (_moviObject, _parentSvgDOM, _rootElementId) {
    this.highlight = _moviObject;
    this.trackData = null;
    if (_moviObject.trackData != null)
    {
        this.trackData = moviTrackedUserControl(_parentSvgDOM, _moviObject.trackData);
    }
    this.writeInfoToDOM(_rootElementId);
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.writeInfoToDOM = function (rootElementId) {
    //then render the info in the HTML DOM.
    var itemID = randomIdGenerator();
    this.domID = itemID;
    $('#' + rootElementId).prepend('<h2 id=' + itemID + '>' + this.highlight.title + '</h2>' +
        '<div>' +
        '<p>' + this.highlight.content + '</p>' +
        '</div>');
    //enable the accordion functionality
    $('#' + rootElementId).find('h2').first().click(function () {
        //here, this is the current Jquery object
        $(this).next().slideToggle()
    }).next().hide();

    //bind the seek video functionality to the click event on the P
    $('#' + itemID).next().find('p').first().click(this, function (event) {
        seekVideo(event.data.highlight.startTime);
    });
}
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.render = function (_time, _offset) {
    if (this.trackData != null) {
        this.trackData.render(_time, _offset);
    }
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.getTrackData = function () {
    if (this.trackData == null) {
        return null;
    }
    return this.trackData.getTrackData();
};
//-------------------------------------------------------------------------------------------------------

//***************************OBJECT: MOVI HIHGLIGHT*****************************************************
//******************************************************************************************************

function moviPlayerController(userControlContainerId, sourceWidth, sourceHeight, queryToken) {
    var trackingAreaAndInfo = [];
    var trackDataReady = false;
    //keep a reference to the used size, for responsive rescaling
    var containerWidth = $('#videoContainer').width();
    var containerHeight = $('#videoContainer').height();

    //scale control variables
    var myScaler = scaler($('#videoContainer').width(), $('#videoContainer').height(), sourceWidth, sourceHeight);

    //responsive rescaling function
    function rescaleRender(newWidth, newHeight) {
        myScaler = scaler(newWidth, newHeight, containerWidth, containerHeight);
        containerWidth = newWidth;
        containerHeight = newHeight;
        var trackReference;
        for (var i = 0; i < trackingAreaAndInfo.length; i++) {
            //tracking engine v2
            trackReference = trackingAreaAndInfo[i].getTrackData();
            if (trackReference != null) {
                myScaler.scaleReceived(trackReference.Xtl, trackReference.Ytl,
                                                        trackReference.Xbr, trackReference.Ybr);
            }
        }
    }

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

    function getSessionInfo ()
    {
        $.ajax({
            url: "http://moviserver.cloudapp.net/service3.svc/web/moviGetData",
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
                //---------------------------V2 data structure------------------------
                var currentObject;
                for (var i = 0; i < data.d.dataStream.length; i++)
                {
                    currentObject = data.d.dataStream[i];
                    //first scale the track data if any
                    if (currentObject.trackData != null)
                    {
                        myScaler.scaleReceived(currentObject.trackData.Xtl, currentObject.trackData.Ytl,
                                            currentObject.trackData.Xbr, currentObject.trackData.Ybr)
                    }
                    //the create he corresponding object:
                    //the __type is a WCF convention, if we move to another system we might need to change that
                    switch (currentObject.__type)
                    {
                        case "moviHighlight:#moviDataLibrary":
                            trackingAreaAndInfo.push(new MoviHighlight(currentObject,
                                $('#svgRoot').get(0), userControlContainerId));
                            break;
                    }
                }
                trackDataReady = true;
                //--------------------end of-V2 data structure------------------------
                alert('get highlight success');

            },
            error: function (response) {
                alert('Failed: ' + response.statusText);
            }
        });
    }

    return {
        render: render,
        rescaleRenderer: rescaleRender,
    }
}