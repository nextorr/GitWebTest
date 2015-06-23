/// <reference path="../jquery21/jquery-2.1.0-vsdoc.js" />

//TODO: call this function when the document is ready
moviEditorInitialization();

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

var mainController = new moviEditorController(rootID, youtubeVideoURL, videoSourceWidth, videoSourceHeight);

function moviEditorInitialization() {
    var pivot = document.getElementById("moviEditor");
    //replace the id to be used by the youtube player
    pivot.id = "player";
    
    //initializing all the components, routing events 
    //and variuos housekeeping
    $('#highlightForm').slideToggle(0);
    $('#bookmarkForm').slideToggle(0);

    //private data initialization for the requiered elements
    $('#highlightEditor').attr("data-toggleCall", "false");

    //event initialization for all the HTML elements
    $('#highlightEditor').click(function (event) { showControl(event); });
    $('#bookmarkEditor').click(function (event) { showControl(event); });
    $('#saveHL').click(function () { saveHighlight(); });
    $('#editHL').click(function () { editHighlight(); });
    $('#publishButton').click(function () { publishData() });

    //common actions 
    //this actions are selected by class because 
    //they are common across the different input forms
    $('.enableTrackEditorBtn').click(function () { enableTrackEditor(); });
    $('#endTime').change(function () {
        if ($('#endTime').val() > $('#startTime').val())
        {
            $('#endTime').val(mainController.setEndTime($('#endTime').val()));
        }
        else {
            $('#endTime').val(parseFloat($('#startTime').val()) + 0.1);
        }
        
    });

    function saveHighlight() {
        mainController.addUserControlToDOM({
            title: $('#title').val(),
            content: $('#dsc').val(),
            startTime: $('#startTime').val(),
            endTime: $('#endTime').val(),
        })

        //clear the boxes
        $('#title').val(""); $('#dsc').val(""); $('#startTime').val(""); $('#endTime').val("");
        $('#highlightForm').slideToggle();
        //enable the button
        $('#highlightEditor').removeAttr("disabled");
    }

    function editHighlight() {
        userController.editHighlight($('#controlToEditId').text(), $('#callerControlId').text(), $('#title').val(), $('#dsc').val(), $('#startTime').val(), $('#endTime').val())
        $('#title').val(""); $('#dsc').val(""); $('#startTime').val(""); $('#endTime').val("");
        $('#editHL').attr("disabled", "disabled");
        $('#saveHL').removeAttr("disabled");
    }

    function enableTrackEditor() {
        mainController.enableTrackTool();
    }

    function showControl(e) {
        
        switch (e.target.id) {
            case "highlightEditor":
                toolVisualization("#highlightForm", e.target);
                mainController.selectToolMode("highlight", "new");
                break;

            case "bookmarkEditor":
                toolVisualization("#bookmarkForm", e.target);
                mainController.selectToolMode("bookmark", "new");
                break;
        }
        
    }

    function publishData() {
        mainController.storeData();
        //$('#publishButton').attr("disabled", "disabled");
    }
}
//-------------------SOME UTILITY FUNCTIONS--------------------
//enables the toolID while disables the other ones
//this works on any number of buttons and controls
//as long as they keep the defined class naming
function toolVisualization(toolID, buttonReference) {
    //hide the active form
    //and clear the entered user values
    $('.moviForm').each(function () {
        if (($(this).css("display") == "inline-block") || ($(this).css("display") == "block")) {
            $(this).find("input").val("");
            $(this).slideToggle();
        }
    });
    //enable the incative button
    $(".toolElement").each(function () {
        if ($(this).attr("disabled") == "disabled") {
            $(this).removeAttr("disabled");
        }
    });
    //enable the caller
    $(toolID).slideToggle();
    //disable the caller buttons
    $(buttonReference).attr("disabled", "disabled");
}
//render the given end time at the current active form
function setActiveEndTime(_endTime) {
    $('.moviForm').each(function () {
        if (($(this).css("display") == "inline-block") || ($(this).css("display") == "block")) {
            $(this).find(".endTime").val(_endTime);
        }
    });
}

//-------------------END OF SOME UTILITY FUNCTIONS-------------

//------------------youtube API functions------------------
//the API load scripts are called from the main controller class

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
var ytVideoID;

//this time is defined in milliseconds
var renderUpdateTime = 33;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: $('#videoContainer').height(),
        width: $('#videoContainer').width(),
        videoId: ytVideoID,
        playerVars: { wmode: "opaque"},
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
    // Also check that at least one function exists since when IE unloads the
    // page, it will destroy the SWF before clearing the interval.

    //TODO: look on the YT doc if there is a way to get a faster o finer time resolution.
    //Possible state values are unstarted (-1), ended (0), playing (1), paused (2), buffering (3), video cued (5).
    if (player && player.getDuration && player.getPlayerState() == 1) {
        //start to draw if there is at least one moviTrackedUserControl

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

        //tracking engine v1
        //if (trackDataReady != false) {
        //    for (var i = 0; i < trackingAds.length; i++) {
        //        trackingAds[i].render(player.getCurrentTime());
        //    }
        //}
    }
}


//------------------END of youtube API functions------------------
//var trackingAds = [];
//var trackDataReady = false;

function moviCanvasController(_scaler, _sessionToken) {
    //TODO: lazy apporach calling directly the DOM elements
    //to be cleaner use references instead 
    

    var diabled = true;
    var areaInstance;

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
            $('#svgRoot').click(function (event) {
                areaInstance = new areaSelector(event, $('#svgRoot'), $('#svgRoot').offset().left,
                    $('#svgRoot').offset().top, _scaler, _sessionToken);
            });
            diabled = false;
            //disable the select track button to avoid multiple area selection
            $('.enableTrackEditorBtn').attr("disabled", "disabled");
            //enable the cancel button
            $('.cancelSelection').removeAttr("disabled")
        }
        else {
            //this a small height for testing
            $('#svgRoot').css("height", 35);
            diabled = true;
            //the click event was already detached
            //TODO: more testin of the click event workflow
            areaInstance = null;
            //enable the button
            $('.enableTrackEditorBtn').removeAttr("disabled");
        }
    }
    function cancelSelectTool() {
        if (areaInstance!=null) {
            areaInstance.cancel();
            //this a small height for testing
            $('#svgRoot').css("height", 35);
            diabled = true;
            //the click event was already detached
            //TODO: more testin of the click event workflow
            areaInstance = null;
            //enable the button
            $('.enableTrackEditorBtn').removeAttr("disabled");
            
        }
    }

    return {
        toggle: toggleCanvasEditor,
        cancelSelectTool: cancelSelectTool,
    }
}

function areaSelector(eventAS, parentSVG, offsetX, offsetY, _scaler, _sessionToken) {
    var Xtl = eventAS.pageX - offsetX;
    var Ytl = eventAS.pageY - offsetY;
    var width;
    var height;
    var initialTime;
    var selecting = true;
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
        $('.sendToProcessBtn').removeAttr("disabled");
        //enable the tracking processor function 
        //Since this is a dinamic attachement we need to remove when we are done with it
        //to prevent multiple adittions
        $('.sendToProcessBtn').click(function () { sendToTracker() });
        //allow the cancel button to clear the dom element.
        $('.cancelSelection').click(function () { cancelSelection() });
        //set the flag that the selection has ended
        selecting = false;
    });

    //internal cancel handling, when we click the cancel button following the workflow
    var cancelSelection = function () {
        //disble the button to avoid multiple calls and remove the event to avoid call nesting on the event
        $('.sendToProcessBtn').off("click");
        $('.sendToProcessBtn').attr("disabled", "disabled");
        $('.cancelSelection').off("click");
        $('.cancelSelection').attr("disabled", "disabled");
        //remove the previos click event on the parentSVG  so we have consistent workflow of event handling
        parentSVG.off("click");
        //remove the select rectangle tool
        parentSVG.get(0).removeChild(domNode);
        //and reset the tool
        mainController.cancelHandler();
    }

    //when we cancel and interrupt the workflow
    function externalCancel() {
        if(selecting){
            //stop accepting the mouse move event
            parentSVG.off("mousemove");
            //remove the previos click event on the parentSVG  so we have consistent workflow of event handling
            parentSVG.off("click");
            //remove the select rectangle tool
            parentSVG.get(0).removeChild(domNode);
            $('.cancelSelection').attr("disabled", "disabled");
        }
        else {
            $('.sendToProcessBtn').off("click");
            $('.sendToProcessBtn').attr("disabled", "disabled");
            $('.cancelSelection').off("click");
            $('.cancelSelection').attr("disabled", "disabled");
            //remove the previos click event on the parentSVG  so we have consistent workflow of event handling
            parentSVG.off("click");
            //remove the select rectangle tool
            parentSVG.get(0).removeChild(domNode);
        }
    }

    var sendToTracker = function () {
        //disble the button to avoid multiple calls and remove the event to avoid call nesting on the event
        $('.sendToProcessBtn').off("click");
        $('.sendToProcessBtn').attr("disabled", "disabled");
        $('.cancelSelection').off("click");
        $('.cancelSelection').attr("disabled", "disabled");
        //remove the previos click event on the parentSVG  so we have consistent workflow of event handling
        parentSVG.off("click");
        var scaled = _scaler.scaleToSend(Xtl, Ytl, width, height)

        //remove the select rectangle tool
        parentSVG.get(0).removeChild(domNode);

        //show waiting animation
        $('.waitingBanner').css("display", "block");


        $.ajax({
            url: "http://moviserver.cloudapp.net/service1.svc/web/processTrackingData",
            type: "POST",
            cache: false,
            //CARE: the parameter name MUST match the parameter definition on wcf
            //TODO: we are using a harcoded edit session for testing
            //the service expects time in millisecons
            data: JSON.stringify({
                Xtl: scaled.Xtl,
                Ytl: scaled.Ytl,
                width: scaled.width,
                height: scaled.height,
                time: initialTime * 1000,
                sessionToken: _sessionToken,
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

                // write the end time to the text box
                setActiveEndTime(data.d.timeLine[data.d.timeLine.length - 1]);
                //$('#endTime').val(data.d.timeLine[data.d.timeLine.length-1])
                //temporary visual indication that the service succeded
                alert('success');

            },
            error: function (response) {
                alert('Failed: ' + response.statusText);
                mainController.errorHandler();
            },
            complete: function () {
                //hide waiting animation
                $('.waitingBanner').css("display", "none");
            },
        });
    }
    return {
        cancel: externalCancel,
    }
}


//this function is intended to be used on the editor as 27/05/2015
function moviTrackedUserControl() {
    var title;
    var content;
    var startTime;
    var endTime;
    var userControl;
    var parentSvgDOM;
    var trackData;
    var hasTrack = false;
    var rectangle;
    var renderEndTime;

    function render(time, offset) {
        if (!hasTrack)
        {
            return;
        }
        var innerIndex = binaryIndexOf.call(trackData.timeLine, time);
        //no render truncating
        //if ((time < trackData.timeLine[0] || time > trackData.timeLine[trackData.timeLine.length - 1])) {
        //    //the asked time is outside the timeLine definition, hide the rectangle
        //    rectangle.collapse();
        //}
        //enable render truncating
        if ((time < trackData.timeLine[0] || time > renderEndTime)) {
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
        renderEndTime = _trackData.timeLine[_trackData.timeLine.length - 1];
        if (rectangle == null) {
            rectangle = new trackingRectangle(parentSvgDOM);
        }
        hasTrack = true;
    }


    function setData(_title, _content, _startTime, _endTime) {
        //save the info into the structure
        title = _title;
        content = _content;
        startTime = _startTime;
        endTime = _endTime;
    }
    function getFormattedData() {
        var tempHighlight;
        if (hasTrack)
        {
            tempHighlight = {
                title: title,
                content: content,
                startTime: startTime,
                endTime: endTime,
                trackData: trackData,
            };
        }
        else
        {
            tempHighlight = {
                title: title,
                content: content,
                startTime: startTime,
                endTime: endTime,
                trackData: null,
            };
        }
        return tempHighlight
    }

    function setRenderTime(time) {
        if (!hasTrack) {
            return time;
        }
        if (time < trackData.timeLine[trackData.timeLine.length - 1]) {
            renderEndTime = time;
            return renderEndTime;
        }
        renderEndTime = trackData.timeLine[trackData.timeLine.length - 1]
        return renderEndTime;
    }
    function getRenderEndTime() {
        return renderEndTime;
    }
    //clear the track data and removes the rectangle from the DOM
    function clear() {
        if (hasTrack) {
            rectangle.removeFromDOM();
        }
    }

    return {
        render: render,
        setData: setData,
        setTrack: setTrack,
        getFormattedData: getFormattedData,
        setRenderTime: setRenderTime,
        getRenderEndTime: getRenderEndTime,
        clear: clear,
    }

}

function moviEditorController(userControlContainerId,ytVideo, sourceWidth, sourceHeight) {
    var trackingAreaAndInfo = [];
    //this keeps track of how many track areas we have received.
    var trackDataReady = 0;
    var previewRender = false;
    var activeTool = false;
    //mode will tell me how the control reacts to some function calls
    var mode;
    var tool;

    // 2. This code loads the youtube IFrame Player API code asynchronously.
    // its called here to guarantee that it loads after the caller HTML file calls
    //the main controlles contructor that contais the video ID
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    //and set the videoID global variable to be used on the api ready functions
    ytVideoID = ytVideo;
    
    //scale control variables
    var myScaler = scaler($('#videoContainer').width(), $('#videoContainer').height(), sourceWidth, sourceHeight);

    //read the session token from the URL
    //if not present default to some testing token ID
    var urlParameters = queryString(window.location.search.substr(1).split('&'));
    var sessionToken
    if (urlParameters["session"] != null) {
        sessionToken = urlParameters["session"];
    }
    else {
        sessionToken = '74EE24D6-EB74-42F2-90AE-F69BB6478D50';
        //alert('Failed to load the session, using default');
    }

    //make a reference to the front end render controller
    userControl = new moviUserControls(userControlContainerId);
    canvasControl = new moviCanvasController(myScaler, sessionToken);


    //used as a proxy in every mode creation
    var helperConstructor;

    //mode initiators
    function selectToolMode(_tool, _mode) {
        //by desingn, if there is an active tool and the user selects another one
        //the actual tools is canceled and activate the selected one.
        if (activeTool) {
            cancelTool();
        }

        mode = _mode;
        tool = _tool;

        switch (tool) {
            case "highlight":
                helperConstructor = new moviTrackedUserControl();
                //push it to the array so the user can preview the render
                //its a reference, so we can later modify this info using helperConstructor
                trackingAreaAndInfo.push(helperConstructor);
                break;
        }
        
        activeTool = true;
    }

    //the main controller must coordinate all aspects of data strcucture creation
    function enableTrackSelectTool() {
        switch (tool) {
            case "highlight":
                //TODO: some error and type checking on the paremeter info
                //TODO: toggle is prone to bugs
                //be explicit and call enable editor.
                canvasControl.toggle();
                break;
        }
    }

    //add the track info to the data structure
    function addTrack(_parentSvgDOM, _receivedTrack) {
        switch (tool) {
            case "highlight":
                //TODO: some error and type checking on the paremeter info
                //scale the received info
                //this function modifes the info we send
                myScaler.scaleReceived(_receivedTrack.Xtl, _receivedTrack.Ytl, _receivedTrack.Xbr, _receivedTrack.Ybr)
                helperConstructor.setTrack(_parentSvgDOM, _receivedTrack);
                //count the track area to enable preview render to the user
                previewRender = true;
                canvasControl.toggle();
                break;
        }
    }

    //cancel the current tool
    function cancelTool() {
        //remove the last element so we dont keep garbage.
        if (helperConstructor != null) {
            helperConstructor.clear();
            trackingAreaAndInfo.pop();
            helperConstructor = null;
        }
        activeTool = false;
        previewRender = false;
        //cap the negative counting to zero
        //this will be usefull to enable user to delete a created entry
        //if ((trackDataReady = trackDataReady - 1) <= 0) {
        //    trackDataReady = 0;
        //}
        //cancel the selection if there is an active one
        canvasControl.cancelSelectTool();
        tool = "";
        mode = "";
    }

    //handling the service errors
    function errorHandler() {
        switch (tool) {
            case "highlight":
                //for now just toogle the controls.
                //this allows the user to resend the request.
                canvasControl.toggle();
                break;
        }
    }

    function cancelHandler() {
        switch (tool) {
            case "highlight":
                //for now just toogle the controls.
                //this allow the user to star from 0 the select area workflow
                canvasControl.toggle();
                break;
        }
    }

    //sets the end time of the stored track data, this end time 
    //is then used to truncate the data when publishing
    function setEndTime(time) {
        return helperConstructor.setRenderTime(time);
    }
    //generic creation, specific is controlled by the mode
    //parameter is a generic Object, specifics is controlled by the mode
    //TODO: how to extend this functionality to the other user controls like bookmarks
    function addUserControlToDOM(parameter) {
        //var tempConstructor = new moviTrackedUserControl();
        switch (tool) {
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
        tool = "";
        trackDataReady = trackDataReady + 1;
        previewRender = false;
    }

    function render(time, offset) {
        if (trackDataReady > 0 || previewRender) {
            for (var i = 0; i < trackingAreaAndInfo.length; i++) {
                //tracking engine v2
                trackingAreaAndInfo[i].render(time, offset);
            }
        }
    }

    function isActiveTool() {
        return activeTool;
    }

    function storeData() {
        var helperHighligth = [];
        var highlightTemp;
        var highlightConstructor;
        var scaledtrackDataTemp;
        var innerIndex;
        for (var i = 0; i < trackingAreaAndInfo.length; i++) {
            highlightConstructor = { trackData: {} };
            highlightTemp = trackingAreaAndInfo[i].getFormattedData();
            if (highlightTemp.trackData != null) {
                //apply the scale transformation before sending the info
                //doing the slice rountrip to prevent modifying the display info
                innerIndex = binaryIndexOf.call(highlightTemp.trackData.timeLine, trackingAreaAndInfo[i].getRenderEndTime());
                scaledtrackDataTemp = myScaler.scaleToStore(highlightTemp.trackData.Xtl.slice(0, innerIndex), highlightTemp.trackData.Ytl.slice(0, innerIndex),
                                                         highlightTemp.trackData.Xbr.slice(0, innerIndex), highlightTemp.trackData.Ybr.slice(0, innerIndex));
                highlightConstructor.trackData.Xtl = scaledtrackDataTemp.Xtl;
                highlightConstructor.trackData.Ytl = scaledtrackDataTemp.Ytl;
                highlightConstructor.trackData.Xbr = scaledtrackDataTemp.Xbr;
                highlightConstructor.trackData.Ybr = scaledtrackDataTemp.Ybr;
                highlightConstructor.trackData.timeLine = highlightTemp.trackData.timeLine.slice(0, innerIndex);
            }
            else
            {
                highlightConstructor.trackData = null;
            }
            highlightConstructor.title = highlightTemp.title;
            highlightConstructor.content = highlightTemp.content;
            highlightConstructor.startTime = highlightTemp.startTime;
            highlightConstructor.endTime = highlightTemp.endTime;
            helperHighligth.push(highlightConstructor)
        }

        //once the data is formated send it to the service to store
        $.ajax({
            url: "http://moviserver.cloudapp.net/service1.svc/web/storeHighlight",
            type: "POST",
            cache: false,
            //CARE: the parameter name MUST match the parameter definition on wcf
            data: JSON.stringify({
                highlight: helperHighligth,
                sessionToken: sessionToken,
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            //note: complete responds with data.responseJSON
            // success responds with data directly
            success: function (data) {
                //TODO: the service respond with the trackarea tokens, 
                //we can use them to allow data edit.
                alert('Store success');

            },
            error: function (response) {
                alert('Failed: ' + response.statusText);
            }
        });
    }
    return {
        selectToolMode: selectToolMode,
        enableTrackTool: enableTrackSelectTool,
        addTrack: addTrack,
        addUserControlToDOM: addUserControlToDOM,
        render: render,
        isActiveTool: isActiveTool,
        storeData: storeData,
        errorHandler: errorHandler,
        cancelHandler: cancelHandler,
        setEndTime: setEndTime,
    }
}