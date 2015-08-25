﻿/// <reference path="../jquery21/jquery-2.1.0-vsdoc.js" />

//TODO: call this function when the document is ready
moviEditorInitialization();


var mainController = new moviEditorController(rootID, youtubeVideoURL, videoSourceWidth, videoSourceHeight);


//******************************************************************************************************
//***************************SINGLETON: MOVI TOOLS CONTROLLER*******************************************
//this contols all the GUI interactions.
//and coordinates the GUI with the user and the other parts of the program
//IMPORTANT: this does not manipulate data.
//the system state is manipulated indirectly by event handlers
var moviToolsControler = function () {
    //get a reference to the registered tools
    //by our design, the tools are painted on the HTML an then this controls them
    //this supports the following standar tool definition: 
    //button[.toolButton] -> div[.toolContainer] (form [toolForm] (data elements)); 

    document.getElementById("moviEditor").id = "player";

    //------------------------------------------------------------------------------
    (function () {
        $('.toolButton').click(function (event) { showToolContainerClick(event) });
        $('.toolContainer').slideToggle(0);
        $('.toolContainer').find('.toolForm').find('.addToDomButton').click(function (event) {
            addObjectToDomClick(event);
        });
        
        $('.toolContainer').find('.toolForm').find('.enableTrackEditorBtn').click(function () {
            enableTrackEditor();
        });
        $('.toolContainer').find('.toolForm').validate({
            submitHandler: function (form) {
                //avoid the default form submit behaviour
                //let addObjectToDomClick manage all the bahaviour
                alert("the button was clicked");
                //form.submit();
            }
        });
        $('#publishButton').click(function () { publishData() });
    }());
    //-------------------------------------------------------------------------------
    //here we implement the specifics so the engine can use generics
    //also the idea of this function os to perform housekeeping.
    //all the data manipulation is defined on the object
    function showToolContainerClick(e) {
        var moviForm = $(e.target).next().get(0);
        //select the ID from the tool button
        switch ($(e.target).attr('id')) {
            case "highlightEditor":
                mainController.addMoviObject(new MoviHighlight(moviForm));
                break;
            default:
                //this default behaviour is intended to be used as a debugger helper
                //we send the base object
                //additionally will alert us that we have not defined the specifics of this behaviour
                //so we create a base object and add it to the engine
                mainController.addMoviObject(new MoviHighlight(moviForm))
                break;
        }
        //perform the UI control actions
        //hide the active form
        //and clear the entered user values
        $('.toolContainer').each(function () {
            if (($(this).css("display") == "inline-block") || ($(this).css("display") == "block")) {
                $(this).find('.toolForm').find("textarea").val("");
                $(this).find('.toolForm').find("input").val("");
                $(this).slideToggle();
            }
        });
        //enable the incative button
        $(".toolButton").each(function () {
            if ($(this).attr("disabled") == "disabled") {
                $(this).removeAttr("disabled");
            }
        });
        //enable the caller tool form
        $(e.target).next().slideToggle();
        //And disable the caller button
        $(e.target).attr("disabled", "disabled");
    }
    //-------------------------------------------------------------------------------
    function addObjectToDomClick(e) {
        if (!$(e.target).parent().valid())
        {
            return;
        }
        mainController.addUserControlToDOM();
        //TODO: implemente the add user control DOM in the new engine

        //perform the UI control actions
        //clear the boxes
        $(e.target).parent().find("textarea").val("");
        $(e.target).parent().find("input").val("");
        //hide the caller form
        $(e.target).parent().parent().slideToggle();
        //enable the caller button
        $(e.target).parent().parent().prev().removeAttr("disabled");
    }
    //-------------------------------------------------------------------------------

    //---------------------Public functions------------------------------------------
    return {
        showToolContainerUpdate: function (targetForm, _moviObject) {
            //perform the UI control actions
            if (($(targetForm).css("display") != "inline-block") &&
                ($(targetForm).css("display") != "block"))
            {
                //target form is not visible, so disable the others and enable it 
                $('.toolContainer').each(function () {
                    if (($(this).css("display") == "inline-block") || ($(this).css("display") == "block")) {
                        $(this).find('.toolForm').find("textarea").val("");
                        $(this).find('.toolForm').find("input").val("");
                        $(this).slideToggle();
                    }
                });
                //enable the incative button
                $(".toolButton").each(function () {
                    if ($(this).attr("disabled") == "disabled") {
                        $(this).removeAttr("disabled");
                    }
                });
                //enable the caller tool form
                $(targetForm).slideToggle();
                //And disable the caller button
                $(targetForm).prev().attr("disabled", "disabled");
            }
            //the target form is visible now, clear its values and enable update button
            $(targetForm).find('.toolForm').find("textarea").val("");
            $(targetForm).find('.toolForm').find("input").val("");
            $(targetForm).find('.toolForm').find('.updateDomButton').removeAttr("disabled");

            //and disable save button
            $(targetForm).find('.toolForm').find('.addToDomButton').attr("disabled", "disabled");

            //bind the click event to the object representation.
            $(targetForm).find('.toolForm').find('.updateDomButton').click(function (event) {
                _moviObject.updateDomObject(event);
                //perform the UI control actions
                //clear the boxes
                $(targetForm).find('.toolForm').find("textarea").val("");
                $(targetForm).find('.toolForm').find("input").val("");
                //disable update button and enable save
                $(targetForm).find('.toolForm').find('.updateDomButton').attr("disabled", "disabled");
                $(targetForm).find('.toolForm').find('.addToDomButton').removeAttr("disabled");
                //hide the caller form
                $(targetForm).slideToggle();
                //enable the caller Tool button
                $(targetForm).prev().removeAttr("disabled");
            });
            
            
           
        },

    };
    //---------------------end of public functions-----------------------------------

}();

//***********************END SINGLETON: MOVI TOOLS CONTROLLER*******************************************
//******************************************************************************************************




function moviEditorInitialization() {
    var pivot = document.getElementById("moviEditor");
    //replace the id to be used by the youtube player
    pivot.id = "player";
    
    //initializing all the components, routing events 
    //and variuos housekeeping
    $('#highlightForm').slideToggle(0);
    $('#highlightFormV2').slideToggle(0);
    $('#bookmarkForm').slideToggle(0);

    //private data initialization for the requiered elements
    $('#highlightEditor').attr("data-toggleCall", "false");

    //event initialization for all the HTML elements
    $('#highlightEditor').click(function (event) { showControl(event); });
    $('#bookmarkEditor').click(function (event) { showControl(event); });
    $('#highlightEditorV2').click(function (event) { showControl(event); });
    $('#saveHL').click(function () { saveHighlight(); });
    $('#editHL').click(function () { editHighlight(); });
    $('#publishButton').click(function () { publishData() });

    //common actions 
    //this actions are selected by class because 
    //they are common across the different input forms
    //this makes sure the end time is alway greater than the start time
    $('.enableTrackEditorBtn').click(function () { enableTrackEditor(); });
    

    //form validation functions
    $("#commentForm").validate({
        submitHandler: function (form) {
            //avoid the form to be submmited
            alert("the button was clicked");
            //form.submit();
        }
    });

    //TODO: marked for deletion
    //$('.addToDomButton').click(function () {
    //    //read if the form is valid
    //    alert("Valid:" + $("#commentForm").valid());
    //});

    //setting up the time control functions
    $('#endTime').change(function () {
        if (($('#endTime').val() > $('#startTime').val()) && $('#endTime').val()!="") {
            $('#endTime').val(mainController.setEndTime($('#endTime').val()));
        }
        else {
            $('#endTime').val(parseFloat($('#startTime').val()) + 0.1);
        }
    });
    $('#startTime').change(function () {
        //control empty values
        if ($('#startTime').val() == "")
        {
            $('#startTime').val("0");
        }
        if (($('#endTime').val() > $('#startTime').val())) {
            //Do not let the user change the start time if it comes from the trackArea
            //$('#endTime').val(mainController.setEndTime($('#endTime').val()));
        }
        else {
            $('#startTime').val(parseFloat($('#endTime').val()) - 0.1);
        }
    });
    //this enables the user to use the player current time as a time setter
    $('.getTimeButton').click(function (e) {
        //the button is always preceded by the input tag
        //$(e.target).prev().val(getPlayerTime());
        switch (e.target.id) {
            case "startTimeButton":
                if (getPlayerTime() < $('#endTime').val())
                {
                    $(e.target).prev().val(getPlayerTime());
                    $(e.target).prev().trigger("change");
                }
                else
                {
                    alert('el tiempo inicial debe ser menor al tiempo final');
                }
                break;

            case "endTimeButton":
                if (getPlayerTime() > $('#startTime').val()) {
                    $(e.target).prev().val(getPlayerTime());
                    $(e.target).prev().trigger("change");
                }
                else
                {
                    alert('el tiempo final debe ser mayor al tiempo inicial');
                }
                break;
        }
    });


    function saveHighlight() {
        if (!$("#commentForm").valid())
        {
            return;
        }
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

    //TODO: show control on update mode
    function showControl(e) {
        
        switch (e.target.id) {
            case "highlightEditor":
                toolVisualization("#highlightForm", e.target);
                //TODO: Send and object instance.
                mainController.selectToolMode("highlight", "new");
                break;

            case "highlightEditorV2":
                toolVisualization("#highlightFormV2", e.target);
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
            $(this).find("textarea").val("");
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

//******************************************************************************************************
//*********************START CLOSURE: UPDATE DELETE CONTROLLER******************************************
function updateDeleteController() {
    function enableUpdater(moviElementID) {
        //give user feedback by selecting de current element
        $('#' + moviElementID).addClass("updating");

    }

}
//*********************END CLOSURE: UPDATE DELETE CONTROLLER********************************************
//******************************************************************************************************


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
    //set up DOM initialization when the player is ready
    $('#endTime').val(getPlayerDuration());
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

function getPlayerTime() {
    return player.getCurrentTime();
}

function getPlayerDuration() {
    return player.getDuration();
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

//UPDATE 1: implementing a new tracking object

//******************************************************************************************************
//***************************MOVI TRACKING OBJECT*******************************************************

// moviTracking Constructor
//_trackData: the tracking definition using the stablished format that comes from the service calls
var MoviTracking = function (_trackData, _parentSvgDOM) {
    this.trackData = _trackData;
    this.renderEndTime = _trackData.timeLine[_trackData.timeLine.length - 1];
    //trackingRectangle is a closure
    this.rectangle = trackingRectangle(parentSvgDOM);
    
};

//-------------------------------------------------------------------------------------------------------
MoviTracking.prototype.renderTime = function (time, offset) {
    var innerIndex = binaryIndexOf.call(this.trackData.timeLine, time);
    if ((time < this.trackData.timeLine[0] || time > this.renderEndTime)) {
        //the asked time is outside the timeLine definition, hide the this.rectangle
        this.rectangle.collapse();
    }
    else if (offset == null) {
        //draw the position without any offset
        if (innerIndex < 0) {
            this.rectangle.draw(this.trackData.Xtl[-innerIndex], this.trackData.Xbr[-innerIndex], this.trackData.Ytl[-innerIndex], this.trackData.Ybr[-innerIndex]);
        } else {
            this.rectangle.draw(this.trackData.Xtl[innerIndex], this.trackData.Xbr[innerIndex], this.trackData.Ytl[innerIndex], this.trackData.Ybr[innerIndex]);
        }
        //the parameter is the data to be sent to the areaVisible event handler
        //TODO: a text is set until we implement the twitter functionality
        this.rectangle.visible("tweet list");
    }
    else {
        //draw the position applying the offset
        //TODO: this only works on the standard wide screen ratio
        if (innerIndex < 0) {
            this.rectangle.draw(this.trackData.Xtl[-innerIndex] * offset, this.trackData.Xbr[-innerIndex] * offset, this.trackData.Ytl[-innerIndex] * offset, this.trackData.Ybr[-innerIndex] * offset);
        } else {
            this.rectangle.draw(this.trackData.Xtl[innerIndex] * offset, this.trackData.Xbr[innerIndex] * offset, this.trackData.Ytl[innerIndex] * offset, this.trackData.Ybr[innerIndex] * offset);
        }
        //the parameter is the data to be sent to the areaVisible event handler
        //TODO: a text is set until we implement the twitter functionality
        this.rectangle.visible("tweet list");
    }
};
//-------------------------------------------------------------------------------------------------------
//set the end time to render the rectangle, the engine stops rendering at the specified time
//this does not delete anything from the trackData definition
//if the time es greater that the trackData definitions, returns the end Time of the trackData
MoviTracking.prototype.setRenderEndTime = function (time){
    if (time < this.trackData.timeLine[this.trackData.timeLine.length - 1]) {
        this.renderEndTime = time;
        return this.renderEndTime;
    }
    this.renderEndTime = this.trackData.timeLine[this.trackData.timeLine.length - 1]
    return this.renderEndTime;
};
//-------------------------------------------------------------------------------------------------------
//removes the rectangle from the DOM
MoviTracking.prototype.clearDOM = function () {
    this.rectangle.removeFromDOM();
};
//-------------------------------------------------------------------------------------------------------
MoviTracking.prototype.scaledCopy = function (_scalerFunction) {
    //TODO: error checking on _scalerFunction
    var innerIndex = binaryIndexOf.call(this.trackData.timeLine, this.renderEndTime);
    var scaledTrackData = _scalerFunction(this.trackData.Xtl.slice(0, innerIndex), this.trackData.Ytl.slice(0, innerIndex),
        this.trackData.Xbr.slice(0, innerIndex), this.trackData.Ybr.slice(0, innerIndex));
    scaledTrackData.timeLine = this.trackData.timeLine.slice(0, innerIndex);

    //TODO: check that scalerData has the desiref formar, otherwise return null or error.
    return scaledTrackData;
}

//***************************MOVI TRACKING OBJECT*******************************************************
//******************************************************************************************************

//******************************************************************************************************
//***************************OBJECT: MOVI HIGHLIGHT*****************************************************
var MoviHighlight = function (_moviForm) {
    //the object controls all aspects of the UI Data interaction starting here 
    this.moviForm = _moviForm;
    this.title = "not set";
    this.content = "not set";
    this.startTime = 0;
    this.endTime = 0;
    this.trackingRenderer = null;
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.writeInfoToDOM = function (_rootElementId){
    //save the info into the service format structure
    this.title = $(moviForm).find('.toolForm').find('.moviTitle').val() || "tool undefined";
    this.content = $(moviForm).find('.toolForm').find('.moviContent').val() || "tool undefined"
    //TODO: if there is a track area make sure this times are coordinated
    this.startTime = $(moviForm).find('.toolForm').find('.moviStartTime').val() || 0;
    this.endTime = $(moviForm).find('.toolForm').find('.moviEndTime').val() || 1;
    //generate an ID so we can refer back to the item
    var itemID = randomIdGenerator();
    this.domID = itemID;
    //then render the info in the HTML DOM.
    $('#' + _rootElementId).prepend('<h2 id=' + itemID + '>' + this.title + '</h2>' +
        '<div>' +
        '<p onclick="seekVideo(' + this.startTime + ')">' + this.content + '</p>' +
        '<button class="moviUpdateElement" type="button" >Edit Element</button>' +
        '</div>');
    //enable the accordion functionality
    $('#' + _rootElementId).find('h2').first().click(function () {
        $(this).next().slideToggle()
    }).next().hide();

    //bind the update functionality to the Edit Element button
    $('#' + itemID).next().find('.moviUpdateElement').click(this, function (event) {
        //calling the MoviHighlight.populateUpdater
        event.data.populateUpdater();
        //TODO: we need some coordination on the control area to give 
        //the user feedback from the Uptating process
    });
    //bind the seek video functionality to the click event on the P
    $('#' + itemID).next().find('p').first().click(this, function (event) {
        //TODO: check if this works because seekVideo id defined on the global namespace
        //we bind the start time of the current object
        seekVideo(event.data.startTime);
    });

    //return the ID and an element instance of the DIV to add more elements as needed
    //think of it like an assembly line, this object only cares to render title and content.
    return params = {
        itemID: itemID,
        divContainer: $('#' + itemID).next().get(0),
    }
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.populateUpdater= function(){
    moviToolsControler.showToolContainerUpdate(this.moviForm, this);
    //fill the data in the form
    $(moviForm).find('.toolForm').find('.moviTitle').val(this.title);
    $(moviForm).find('.toolForm').find('.moviContent').val(this.content);
    $(moviForm).find('.toolForm').find('.moviStartTime').val(this.startTime);
    $(moviForm).find('.toolForm').find('.moviEndTime').val(this.startTime);
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.updateDomObject= function(e){
    //modify the DOM representation of the object
    this.title = $(moviForm).find('.toolForm').find('.moviTitle').val() || "Update Failed";
    this.content = $(moviForm).find('.toolForm').find('.moviContent').val() || "Update Failed"
    //TODO: if there is a track area make sure this times are coordinated
    this.startTime = $(moviForm).find('.toolForm').find('.moviStartTime').val() || 0;
    this.endTime = $(moviForm).find('.toolForm').find('.moviEndTime').val() || 1;

    $('#' + this.domID).text(this.title);
    $('#' + this.domID).next().find('p').first().text(this.content);
    //TODO: the start time event is binded to this.startTime, so in theory we dont need to update the event

    //TODO: call the coordinators for a completed update process

    //remove the binded click event on the caller to prevent nesting
    $(e.target).off("click");
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.setTrack = function (_trackData, _parentSvgDOM) {
    this.trackingRenderer = new MoviTracking(_trackData, _parentSvgDOM);
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.setRenderTime = function (_time) {
    if(this.trackingRenderer != null)
    {
        this.endTime = _time;
        return this.trackingRenderer.setRenderEndTime(_time);
    }
    this.endTime = _time;
    return _time;
};
//-------------------------------------------------------------------------------------------------------
//clear the track data and removes the rectangle from the DOM
MoviHighlight.prototype.clear = function () {
    if (this.trackingRenderer != null) {
        this.trackingRenderer.clearDOM();
        this.trackingRenderer = null;
        this.startTime = 0;
        this.endTime = 0;
    }
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.render = function (_time, _offset) {
    if (this.trackingRenderer != null) {
        this.trackingRenderer.renderTime(_time, _offset);
    }
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.storeFormat = function (scalerFunction) {
    var formatToSend;
    if (this.trackingRenderer != null)
    {
        formatToSend.trackData = this.trackingRenderer.scaledCopy(scalerFunction);
    }
    else
    {
        formatToSend.trackData = null;
    }
    formatToSend.title = this.title;
    formatToSend.content = this.content;
    formatToSend.startTime = this.startTime;
    formatToSend.endTime = this.endTime;
    return formatToSend;
};
//-------------------------------------------------------------------------------------------------------
//MIGRATION TODO:
//implement the send to service function


//***************************OBJECT: MOVI HIHGLIGHT*****************************************************
//******************************************************************************************************

function moviEditorController(userControlContainerId,ytVideo, sourceWidth, sourceHeight) {
    var trackingAreaAndInfo = [];
    var domToInfoDictionary = new Object();
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
    
    //scale control variable
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
    var helperConstructor = null;
    var currentObject = null;
    //----------------------------------------------------------------------------------------
    //controller v2: a generic engine, it only receives objects and coordinates them
    //does not care what type
    function addMoviObject(_moviObject) {
        //by desingn, if there is an active tool and the user selects another one
        //the actual tools is canceled and activate the selected one.
        if (activeTool) {
            cancelCurrent();
        }
        currentObject = _moviObject;
        trackingAreaAndInfo.push(_moviObject);
        activeTool = true;
    }
    //----------------------------------------------------------------------------------------
    function cancelCurrent() {
        if (currentObject != null) {
            currentObject.clear();
            trackingAreaAndInfo.pop();
            currentObject = null;
        }
        activeTool = false;
        previewRender = false;
        canvasControl.cancelSelectTool();
    }
    //----------------------------------------------------------------------------------------


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
                //the code is clearer when we declare the variables here in the initialization.
                helperConstructor = new MoviHighlight();
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
                helperConstructor.setTrack(_receivedTrack, _parentSvgDOM);
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
    
    
    function addUserControlToDOM(parameter) {
        //----------------v2 definition------------------
        //TODO: remember to set the various flags, like prerender, activetool etc.
        //----------------end of v2 definitinon----------

        //dafult values, in case the caller mess up the definitions, 
        //this is done to spot issues at the code level
        //the validation is done at the form level
        var title = parameter.title || "not provided";
        var content = parameter.content || "not provided";
        var startTime = parameter.startTime || 0;
        var endTime = parameter.endTime || 1;
        
        //call the defined DOM renderer in the current helperConstructor
        var response = helperConstructor.writeInfoToDOM(title, content, startTime, endTime);

        //then add editor specific elements to the created DOM element, like in an assembly line
        //add a button and attach a click handler
        $(response.divContainer).append('<button class="moviEditElement" type="button" >Edit Element</button>');
        $(response.divContainer).find('.moviEditElement').click(function (event) { editElementClick(itemID); });

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
        //-------v2----------------
        addMoviObject: addMoviObject,
        //-------end of v2---------
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