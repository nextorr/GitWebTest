/// <reference path="../jquery21/jquery-2.1.0-vsdoc.js" />

//TODO: call this function when the document is ready
moviEditor();

//------------------HANDLING THE RESULT SPACE ELEMENTS------------------
//subscribe to the moviUserControlAdded event
//this is trigged when a new element is added to the player preview
$(document).on("moviUserControlAdded", addedControlHandler);
//handle the moviUserControlAdded event
function addedControlHandler(e) {
    //generate an ID for the new DIV
    //TODO: i dont like this cross reference because
    //we need to guarantee that utility.js is loaded before this script
    var itemId = randomIdGenerator();
    //add a new component in the results div
    //TODO: what happens when the tag does not exists
    var literal = "<div id="+itemId+" class='resultElement'>" +
                "<p>" + e.message.title + "</p>" +
                "<p>" + e.message.startTime + "  =>  " + e.message.endTime + "</p>" +
                "</div>"
    $('#results').append(literal)
    //now add the even handler to the just added div
    $('#results').find('div').last().click(function () { enableEditMenu(e.message, itemId);});
}
//and enable the edit menu when the control is clicked
function enableEditMenu(_message, _callerId) {
    $('#title').val(_message.title);
    $('#dsc').val(_message.content);
    $('#startTime').val(_message.startTime);
    $('#endTime').val(_message.endTime);
    $('#controlToEditId').text(_message.elementId);
    $('#callerControlId').text(_callerId);
    $('#saveHL').attr("disabled", "disabled");
    $('#editHL').removeAttr("disabled");
}

//subscribe to the moviUserControlEdited event
$(document).on("moviUserControlEdited", editedControlHandler);
//handle the moviUserControlEdited event
function editedControlHandler(e) {
    var moviSelector = e.message.callerId;
    $('#' + moviSelector).children('p').first().text(e.message.title);
    $('#' + moviSelector).children('p').first().next().text(e.message.startTime + "  =>  " + e.message.endTime);
    //update the onlick event handler
    //moviSelector contains the direct id of the caller div
    $('#' + moviSelector).click(function () { enableEditMenu(e.message, moviSelector); });
}
//------------------END HANDLING THE RESULT SPACE ELEMENTS------------------

function moviEditor() {
    var pivot = document.getElementById("moviEditor");
    //replace the id to be used by the youtube player
    pivot.id = "player";
    
    //var editor = document.createElement("div");
    //editor.id = "player"
    //this replaces the ID 
    //pivot.parentNode.replaceChild(editor, pivot);

}

//------------------youtube API functions------------------

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
        playerVars: { wmode: "opaque"},
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
    // Also check that at least one function exists since when IE unloads the
    // page, it will destroy the SWF before clearing the interval.

    //TODO: look on the YT doc if there is a way to get a faster o finer time resolution.
    //Possible state values are unstarted (-1), ended (0), playing (1), paused (2), buffering (3), video cued (5).
    if (player && player.getDuration && player.getPlayerState() == 1) {
        //start to draw if there is at least one moviTrackedUserControl

        //tracking engine v2
        mainController.render(player.getCurrentTime());

        //tracking engine v1
        //if (trackDataReady != false) {
        //    for (var i = 0; i < trackingAds.length; i++) {
        //        trackingAds[i].render(player.getCurrentTime());
        //    }
        //}
    }
}


//------------------END of youtube API functions------------------
var trackingAds = [];
var trackDataReady = false;

function moviCanvasController() {
    //TODO: lazy apporach calling directly the DOM elements
    //to be cleaner use references instead 
    

    var diabled = true;

    function toggleCanvasEditor() {
        if (diabled) {
            //adjusting the size of the SVG container and show the canvas
            var parentWidth = $('#videoContainer').width();
            var parentHeight = $('#videoContainer').height();
            $('#svgRoot').css("width", parentWidth);
            $('#svgRoot').css("height", parentHeight - 35);
            $('#svgRoot').css("visibility", "visible");
            //begin accepting click events
            //TODO: it creates a new objet or it uses the previos one?
            //check for strange behaviour in both cases
            //TODO: always make sure that one event handler is attached per object.
            $('#svgRoot').click(function (event) {new areaSelector(event, $('#svgRoot'), $('#svgRoot').offset().left, $('#svgRoot').offset().top); });
            diabled = false;
            //disable the select track button to avoid multiple area selection
            $('#enableTrackEditorBtn').attr("disabled", "disabled");
        }
        else {
            //this a small height for testing
            $('#svgRoot').css("height", 35);
            diabled = true;
            //the click event was already detached
            //TODO: more testin of the click event workflow

            //enable the button
            $('#enableTrackEditorBtn').removeAttr("disabled");
        }
    }

    return {
        toggle: toggleCanvasEditor
    }
}

function areaSelector(eventAS, parentSVG, offsetX, offsetY) {
    var Xtl = eventAS.pageX - offsetX;
    var Ytl = eventAS.pageY - offsetY;
    var width;
    var height;
    var initialTime;
    //create the rectangle select area
    var domNode = document.createElementNS("http://www.w3.org/2000/svg", "rect");


    // Set initial position 
    domNode.setAttribute("x", Xtl);
    domNode.setAttribute("y", Ytl);
    domNode.setAttribute("width", 50);
    domNode.setAttribute("height", 50);
    domNode.setAttribute("opacity", 0.3);
    domNode.setAttribute("stroke", "white");
    domNode.setAttribute("stroke-width", "2");
    domNode.setAttribute("visibility", "visible");



    //add the rectangle to the DOM
    //get(0) means dereferencing the jquery object
    //to the first matched element
    parentSVG.get(0).appendChild(domNode);

    //begin accepting on mouse move event
    parentSVG.mousemove(function (eventMV) {
        width = eventMV.pageX - offsetX - Xtl;
        height = eventMV.pageY - offsetY - Ytl;
        domNode.setAttribute("width", width);
        domNode.setAttribute("height", height);
    });
    //get video time and pause the video
    initialTime = player.getCurrentTime()
    $('#startTime').val(initialTime);
    pauseVideo();
    //detaching the original event caller 
    parentSVG.off("click");

    //and call the requiered actions when the rectangle is completed
    parentSVG.click(function () {
        //stop accepting the mouse move event
        parentSVG.off("mousemove");
        //enable the process button
        $('#sendToProcessBtn').removeAttr("disabled");
        //enable the tracking processor function 
        //Since this is a dinamic attachement we need to remove when we are done with it
        //to prevent multiple adittions
        $('#sendToProcessBtn').click(function () { sendToTracker() });
    });

    var sendToTracker = function () {
        //disble the button to avoid multiple calls and remove the event to avoid call nesting on the event
        $('#sendToProcessBtn').off("click");
        $('#sendToProcessBtn').attr("disabled", "disabled");
        //remove the previos click event on the parentSVG  so we have consistent workflow of event handling
        parentSVG.off("click");
        

        //remove the select rectangle tool
        parentSVG.get(0).removeChild(domNode);


        $.ajax({
            url: "http://moviserver.cloudapp.net/service1.svc/web/processTrackingData",
            type: "POST",
            cache: false,
            //CARE: the parameter name MUST match the parameter definition on wcf
            //TODO: we are using a harcoded edit session for testing
            //the height - 35 indicate the youtube video controls height
            //the service expects time in millisecons
            data: JSON.stringify({
                Xtl: Xtl,
                Ytl: Ytl,
                width: width,
                height: height,
                time: initialTime * 1000,
                playerHeight: $('#videoContainer').height() - 35,
                playerWidth: $('#videoContainer').width(),
                sessionToken: '74EE24D6-EB74-42F2-90AE-F69BB6478D50'
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            //note: complete responds with data.responseJSON
            // success responds with data directly
            success: function (data) {
                //mapping the received data to the expected format
                var receivedTrack= {
                    Xtl: data.d.Xtl,
                    Ytl: data.d.Ytl,
                    Xbr: data.d.Xbr,
                    Ybr: data.d.Ybr,
                    timeLine: data.d.timeLine
                };
                //this supports the twitter api
                //TODO: we need a clean way to support this in the code
                //meanwhile just sent and empty list
                //trackingAds.push(new Visualization(data.d, counter, parentSVG, getTweets(data.d.token)));

                //tracking engineV1 as 2/06/2015
                //trackingAds.push(new moviTrackedUserControl(parentSVG.get(0), receivedTrack));
                //trackDataReady = true;

                //tracking engineV2
                //TODO: make sure this object exists on the model
                mainController.addTrack(parentSVG.get(0), receivedTrack);
                //TODO: this cross references are ok?
                // canvas controller is a global but is used as a really
                //needed definition for the front and to work properly
                //canvasController.toggle();

                //temporary visual indication that the service succeded
                alert('success');

            },
            error: function (response) {
                alert('Failed: ' + response.statusText);
            }
        });
    }
}


//this function is intended to be used on the editor as 27/05/2015
function moviTrackedUserControl() {
    var title;
    var content;
    var starTime;
    var endTime;
    var userControl;
    var parentSvgDOM;
    var trackData;
    var hasTrack = false;
    var rectangle ;

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

    function setTrack(_parentSvgDOM, _trackData) {
        parentSvgDOM = _parentSvgDOM;
        trackData = _trackData;
        if (rectangle == null) {
            rectangle = new trackingRectangle(parentSvgDOM);
        }
        hasTrack = true;
    }


    function setData(_title, _content, _startTime, _endTime) {
        //save the info into the structure
        title = _title;
        content = _content;
        starTime = _startTime;
        endTime = _endTime;
    }

    return {
        render: render,
        setData: setData,
        setTrack: setTrack,
    }

}

function moviEditorController(userControlContainerId) {
    var trackingAreaAndInfo = [];
    var trackDataReady = false;
    var activeTool = false;
    //mode will tell me how the control reacts to some function calls
    var mode;
    //make a reference to the front end render controller
    userControl = new moviUserControls(userControlContainerId);
    canvasControl = new moviCanvasController();

    //used as a proxy in every mode creation
    var helperConstructor;

    //mode initiators
    function selectMode(_mode) {
        mode = _mode;
        activeTool = true;
        switch (mode) {
            case "highlight":
                helperConstructor = new moviTrackedUserControl();
                //push it to the array so the user can preview the render
                //its a reference, so we can later modify this info using helperConstructor
                trackingAreaAndInfo.push(helperConstructor);
                break;
        }
    }

    //the main controller must coordinate all aspects of data strcucture creation
    function enableTrackSelectTool() {
        switch (mode) {
            case "highlight":
                //TODO: some error and type checking on the paremeter info
                //TODO: toggle is prone to bugs
                //be explicit and call enable editor.
                canvasControl.toggle();
                break;
        }
    }

    //add the trak info to the data structure
    function addTrack(_parentSvgDOM, _receivedTrack) {
        switch (mode) {
            case "highlight":
                //TODO: some error and type checking on the paremeter info
                helperConstructor.setTrack(_parentSvgDOM, _receivedTrack);
                trackDataReady = true;
                canvasControl.toggle();
                break;
        }
    }


    //generic creation, specific is controlled by the mode
    //parameter is a generic Object, specifics is controlled by the mode
    //TODO: how to extend this functionality to the other user controls like bookmarks
    function addUserControlToDOM(parameter) {
        var tempConstructor = new moviTrackedUserControl();
        switch (mode) {
            case "highlight":
                //NOTE: highlight expects title, content, startTime and endTime
                //TODO: some error and type checking on the paremeter info
                helperConstructor.setData(parameter.title, parameter.content, parameter.startTime, parameter.endTime);
                //then render the element on the HTML DOM.
                userControl.addHightlight(parameter.title, parameter.content, parameter.startTime, parameter.endTime);
                break;
        }
        //ready to accept new command
        activeTool = false;
        mode = "";
    }

    function render(time, offset) {
        if (trackDataReady) {
            for (var i = 0; i < trackingAreaAndInfo.length; i++) {
                //tracking engine v2
                trackingAreaAndInfo[i].render(time, offset);
            }
        }
    }

    function isActiveTool() {
        return activeTool;
    }

    return {
        selectMode: selectMode,
        enableTrackTool: enableTrackSelectTool,
        addTrack: addTrack,
        addUserControlToDOM: addUserControlToDOM,
        render: render,
        isActiveTool: isActiveTool,
    }
}