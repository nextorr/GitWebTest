/// <reference path="../jquery21/jquery-2.1.0-vsdoc.js" />

//TODO: call this function when the document is ready
//moviEditorInitialization();


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
            mainController.enableTrackTool();
        });
        $('.toolContainer').find('.toolForm').find('.moviStartTime').change(function (event) {
            statTimeChange(event);
        });
        $('.toolContainer').find('.toolForm').find('.moviEndTime').change(function (event) {
                endTimeChange(event);
        });
        $('.toolContainer').find('.toolForm').find('.getTimeButton').click(function (event) {
            $(event.target).prev().val(getPlayerTime);
            $(event.target).prev().change();
        });
        $('.toolContainer').find('.toolForm').validate({
            submitHandler: function (form) {
                //avoid the default form submit behaviour
                //let addObjectToDomClick manage all the bahaviour
                alert("the button was clicked");
                //form.submit();
            }
        });
        $('#publishButton').click(function () { mainController.storeData(); });
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
            case "clickableAreaEditor":
                mainController.addMoviObject(new MoviClickableArea(moviForm));
                break;
            case "bookmarkEditor":
                mainController.addMoviObject(new MoviBookmark(moviForm));
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

        //this condition is needed to avoid breaking the time logic validation.
        $('.toolContainer').find('.toolForm').find('.moviStartTime').val("0");
        
        $('.toolContainer').find('.toolForm').find('.moviEndTime').val(getPlayerDuration() || "1");

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
    function statTimeChange(e) {
        //e.target -> start time input
        //parent().parent() gets me to the .toolForm
        var data = $(e.target).parent().parent().find('.moviEndTime');
        //empty value handling
        if ($(e.target).val() == "")
        {
            $(e.target).val("0");
        }
        if (parseFloat($(data).val()) > parseFloat($(e.target).val()))
        {
            $(e.target).val(mainController.setStartTime($(e.target).val()));
        }
        else
        {
            $(e.target).val(parseFloat($(data).val()) - 0.1);
        }
    }
    //-------------------------------------------------------------------------------
    function endTimeChange(e) {
        //e.target -> end time imput
        //parent().parent() gets me to the .toolForm
        var data = $(e.target).parent().parent().find('.moviStartTime');
        if ((parseFloat($(e.target).val()) > parseFloat($(data).val())) && $(e.target).val() != "")
        {
            $(e.target).val(mainController.setEndTime($(e.target).val()));
        }
        else
        {
            $(e.target).val(parseFloat($(data).val()) + 0.1);
        }
    }
    //-------------------------------------------------------------------------------

    //---------------------Public functions------------------------------------------
    return {
        showToolContainerUpdate: function (targetForm, _moviObject) {
            //put the main controler in update mode
            mainController.updateMoviObject(_moviObject);
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
                mainController.updateUserControlDOM();
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
                //remove the binded click event on the caller to prevent nesting
                //TODO: this event can be removed in the click handler itself?
                $(event.target).off("click");
            });
            
            
           
        },

    };
    //---------------------end of public functions-----------------------------------

}();

//***********************END SINGLETON: MOVI TOOLS CONTROLLER*******************************************
//******************************************************************************************************

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
    //TODO: this must be done on the front end controller, send a event or something
    $('.moviEndTime').val(getPlayerDuration());
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
    //TODO: this set up must be done on the front end controller, send a event or something
    $('.moviStartTime').val(initialTime);
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

                //tracking engineV2
                //TODO: make sure this object exists on the model
                mainController.addTrack(parentSVG.get(0), receivedTrack);
                
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


//******************************************************************************************************
//***************************MOVI TRACKING OBJECT*******************************************************

// moviTracking Constructor
//_trackData: the tracking definition using the stablished format that comes from the service calls
var MoviTracking = function (_trackData, _parentSvgDOM) {
    this.trackData = _trackData;
    this.renderEndTime = _trackData.timeLine[_trackData.timeLine.length - 1];
    //trackingRectangle is a closure
    this.rectangle = trackingRectangle(_parentSvgDOM);
    
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
MoviTracking.prototype.getStartTime = function () {
    return this.trackData.timeLine[0];
}
//-------------------------------------------------------------------------------------------------------
MoviTracking.prototype.getEndTime = function () {
    return this.renderEndTime;
};
//-------------------------------------------------------------------------------------------------------
//removes the rectangle from the DOM
MoviTracking.prototype.clearDOM = function () {
    this.rectangle.removeFromDOM();
};
//-------------------------------------------------------------------------------------------------------

MoviTracking.prototype.scaledCopy = function (_scaler) {
    //TODO: error checking on _scalerFunction
    var innerIndex = binaryIndexOf.call(this.trackData.timeLine, this.renderEndTime);
    var scaledTrackData = _scaler.scaleToStore(this.trackData.Xtl.slice(0, innerIndex), this.trackData.Ytl.slice(0, innerIndex),
        this.trackData.Xbr.slice(0, innerIndex), this.trackData.Ybr.slice(0, innerIndex));
    scaledTrackData.timeLine = this.trackData.timeLine.slice(0, innerIndex);

    //TODO: check that scalerData has the desired format, otherwise return null or error.
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
MoviHighlight.prototype.setHighlightValueFromService = function (_moviObject, _parentSvgDOM) {
    this.title = _moviObject.title || "Service Undefined";
    this.content = _moviObject.content || "Service Undefined";
    this.startTime = _moviObject.startTime || 0;
    this.endTime = _moviObject.endTime || 1;
    if (_moviObject.trackData != null && _moviObject.trackData != undefined)
    {
        this.trackingRenderer = new MoviTracking(_moviObject.trackData, _parentSvgDOM);
    }
}
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.writeInfoFromService = function (_moviObject, _parentSvgDOM, _rootElementId) {
    this.setHighlightValueFromService(_moviObject, _parentSvgDOM);
    return this.moviDomImplementation(_rootElementId);
}
    //-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.setHighlightValuesFromUser = function () {
    //save the info into the service format structure
    //TODO: this default assigment is not working because if moviform is undefined we get
    //an accessing undefined methods exception
    //TODO: test how we can fix this
    this.title = $(this.moviForm).find('.toolForm').find('.moviTitle').val() || "tool undefined";
    this.content = $(this.moviForm).find('.toolForm').find('.moviContent').val() || "tool undefined"
    //TODO: if there is a track area make sure this times are coordinated
    this.startTime = $(this.moviForm).find('.toolForm').find('.moviStartTime').val() || 0;
    this.endTime = $(this.moviForm).find('.toolForm').find('.moviEndTime').val() || 1;
}
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.moviDomImplementation = function(_rootElementId){
    //generate an ID so we can refer back to the item
    var itemID = randomIdGenerator();
    this.domID = itemID;
    //then render the info in the HTML DOM.
    $('#' + _rootElementId).prepend('<h2 id=' + itemID + '>' + this.title + '</h2>' +
        '<div>' +
        '<p>' + this.content + '</p>' +
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
}
//-------------------------------------------------------------------------------------------------------

MoviHighlight.prototype.writeInfoToDOM = function (_rootElementId) {
    //the the object properties from the form user input
    this.setHighlightValuesFromUser();
    return this.moviDomImplementation(_rootElementId);
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.populateHighlightUpdater = function () {
    //fill the data in the form
    $(this.moviForm).find('.toolForm').find('.moviTitle').val(this.title);
    $(this.moviForm).find('.toolForm').find('.moviContent').val(this.content);
    $(this.moviForm).find('.toolForm').find('.moviStartTime').val(this.startTime);
    $(this.moviForm).find('.toolForm').find('.moviEndTime').val(this.endTime);
}
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.populateUpdater= function(){
    moviToolsControler.showToolContainerUpdate(this.moviForm, this);
    this.populateHighlightUpdater();
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.updateHighlightObject = function () {
    //modify the DOM representation of the object
    this.title = $(this.moviForm).find('.toolForm').find('.moviTitle').val() || "Update Failed";
    this.content = $(this.moviForm).find('.toolForm').find('.moviContent').val() || "Update Failed"
    //TODO: if there is a track area make sure this times are coordinated
    this.startTime = $(this.moviForm).find('.toolForm').find('.moviStartTime').val() || 0;
    this.endTime = $(this.moviForm).find('.toolForm').find('.moviEndTime').val() || 1;
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.updateDomObject= function(){
    this.updateHighlightObject();
    //and update the DOM representation
    $('#' + this.domID).text(this.title);
    $('#' + this.domID).next().find('p').first().text(this.content);
    //TODO: the start time event is binded to this.startTime, so in theory we dont need to update the event
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.setTrack = function (_trackData, _parentSvgDOM) {
    this.trackingRenderer = new MoviTracking(_trackData, _parentSvgDOM);
    //TODO: this belong here?
    $(this.moviForm).find('.toolForm').find('.moviEndTime').val(this.trackingRenderer.getEndTime())
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
MoviHighlight.prototype.setStartTime = function (_time) {
    if(this.trackingRenderer != null)
    {
        this.startTime = this.trackingRenderer.getStartTime();
        return this.startTime;
    }
    this.startTime = _time;
    return _time;
}
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.clearHighlight = function () {
    //set this values for debugging purposes
    this.title = "Cleared";
    this.content = "Cleared";
    this.startTime = 0;
    //TODO: global namespace use, correct this by using encapsulation
    this.endTime = getPlayerDuration();

    if (this.trackingRenderer != null) {
        this.trackingRenderer.clearDOM();
        this.trackingRenderer = null;
    }
    
};
//-------------------------------------------------------------------------------------------------------
//clear the track data and removes the rectangle from the DOM
MoviHighlight.prototype.clear = function () {
    this.clearHighlight();
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.deleteHighlightDom = function(){
    //set this values for debugging purposes
    this.title = "Deleted";
    this.content = "Deleted";
    this.startTime = 0;
    this.endTime = 1;
    if (this.trackingRenderer != null) {
        this.trackingRenderer.clearDOM();
        this.trackingRenderer = null;
    }
    
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.deleteDom = function () {
    this.deleteHighlightDom();
    //delete the elements from the dom
    $('#' + this.domID).next().remove();
    $('#' + this.domID).remove();
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.render = function (_time, _offset) {
    if (this.trackingRenderer != null) {
        this.trackingRenderer.renderTime(_time, _offset);
    }
};
//-------------------------------------------------------------------------------------------------------
MoviHighlight.prototype.storeFormat = function (scalerObject) {
    var formatToSend = new Object();
    formatToSend.__type = "moviHighlight:#moviDataLibrary";
    if (this.trackingRenderer != null)
    {
        formatToSend.trackData = this.trackingRenderer.scaledCopy(scalerObject);
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


//******************************************************************************************************
//***************************OBJECT: MOVI CLICKABLEAREA*************************************************
//ATENTION: we are testing here the inheritance features of javascript.
var MoviClickableArea = function (_moviForm){
    //inherit the highlight properties
    MoviHighlight.call(this, _moviForm);

    //ClickableArea Specifics
    this.link = "not set";
    this.visibleAtStart = false;
}

//TODO: this is not backward compatible
//see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
//for browser compatibility and workarrounds on older engines
MoviClickableArea.prototype = Object.create(MoviHighlight.prototype);
//set this to avoid strage cases down the road
MoviClickableArea.prototype.constructor = MoviClickableArea;

//specific class methods
//-------------------------------------------------------------------------------------------------------
MoviClickableArea.prototype.setCaValuesFromUser = function () {
    this.setHighlightValuesFromUser();
    //setting the clickable area properties
    this.link = $(this.moviForm).find('.toolForm').find('.moviLink').val() || "tool undefined";
    this.visibleAtStart = $(this.moviForm).find('.toolForm').find('.moviVisibleAtStart').is(":checked") || "tool undefined";
};
//-------------------------------------------------------------------------------------------------------
MoviClickableArea.prototype.setCaValuesFromService = function (_moviObject, _parentSvgDOM) {
    this.setHighlightValueFromService(_moviObject, _parentSvgDOM);
    //setting the clickable area properties
    this.link = _moviObject.linkUrl || "Service Undefined";
    this.visibleAtStart = _moviObject.visibleAtStart || false;
};
//-------------------------------------------------------------------------------------------------------

//Start overrinding methods:
//-------------------------------------------------------------------------------------------------------
MoviClickableArea.prototype.writeInfoFromService = function (_moviObject, _parentSvgDOM, _rootElementId) {
    this.setCaValuesFromService(_moviObject, _parentSvgDOM);
    return this.moviDomImplementation(_rootElementId);
}
//-------------------------------------------------------------------------------------------------------
MoviClickableArea.prototype.moviDomImplementation = function (_rootElementId) {
    //generate an ID so we can refer back to the item
    var itemID = randomIdGenerator();
    this.domID = itemID;
    //then render the info in the HTML DOM.
    $('#' + _rootElementId).prepend('<h2 id=' + itemID + '>' + this.title + '</h2>' +
        '<div>' +
        '<p>' + this.content + '<br> >Ver en video < </p>' +
        '<a href="' + this.link + '" target="_blank">Ver más</a>' +
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
    //pause the video when the link is clicked
    $('#' + itemID).next().find('a').first().click(this, function (event) {
        //TODO: check if this works because seekVideo id defined on the global namespace
        //we bind the start time of the current object
        pauseVideo();
    });
    //return the ID and an element instance of the DIV to add more elements as needed
    //think of it like an assembly line, this object only cares to render title and content.
    return params = {
        itemID: itemID,
        divContainer: $('#' + itemID).next().get(0),
    }
}
//-------------------------------------------------------------------------------------------------------
//_rootElementId: the DOM ID of the movi areas container
MoviClickableArea.prototype.writeInfoToDOM = function (_rootElementId) {
    //the the object properties from the form user input
    this.setCaValuesFromUser();
    return this.moviDomImplementation(_rootElementId);
};
//-------------------------------------------------------------------------------------------------------
MoviClickableArea.prototype.populateCaUpdater = function () {
    this.populateHighlightUpdater();
    //fill the clickable area specific properties
    $(this.moviForm).find('.toolForm').find('.moviLink').val(this.link);
    $(this.moviForm).find('.toolForm').find('.moviVisibleAtStart').prop('checked', this.visibleAtStart);
};
//-------------------------------------------------------------------------------------------------------
MoviClickableArea.prototype.populateUpdater = function () {
    moviToolsControler.showToolContainerUpdate(this.moviForm, this);
    this.populateCaUpdater();
};
//-------------------------------------------------------------------------------------------------------
MoviClickableArea.prototype.updateCaObject = function () {
    this.updateHighlightObject();
    //update the clickable area specifics
    this.link = $(this.moviForm).find('.toolForm').find('.moviLink').val() || "Update Failed";
    this.visibleAtStart = $(this.moviForm).find('.toolForm').find('.moviVisibleAtStart').is(":checked") || false;
};
//-------------------------------------------------------------------------------------------------------
MoviClickableArea.prototype.updateDomObject = function () {
    this.updateCaObject();
    //then update the dom representation
    $('#' + this.domID).text(this.title);
    $('#' + this.domID).next().find('p').first().html(this.content + '\<br\> >Ver en video <');
    $('#' + this.domID).next().find('a').first().attr("href", this.link);
};
//-------------------------------------------------------------------------------------------------------
MoviClickableArea.prototype.clearClickableArea = function () {
    this.clearHighlight();
    //clear the clickable area specific values
    this.link = "cleared";
    this.visibleAtStart = false;
};
//-------------------------------------------------------------------------------------------------------
MoviClickableArea.prototype.clear = function () {
    this.clearClickableArea();
};
//-------------------------------------------------------------------------------------------------------
MoviClickableArea.prototype.deleteCaDom = function () {
    this.deleteHighlightDom();
    //delete the specific values, debugging purposes
    this.link = "deleted";
    this.visibleAtStart = false;
};
//-------------------------------------------------------------------------------------------------------
MoviClickableArea.prototype.deleteDom = function () {
    this.deleteCaDom();
    //delete the elements from the DOM.
    $('#' + this.domID).next().remove();
    $('#' + this.domID).remove();
};
//-------------------------------------------------------------------------------------------------------
MoviClickableArea.prototype.storeFormat = function(scalerObject){
    var formatToSend = new Object();
    formatToSend.__type = "moviClickableArea:#moviDataLibrary";
    if (this.trackingRenderer != null)
    {
        formatToSend.trackData = this.trackingRenderer.scaledCopy(scalerObject);
    }
    else
    {
        formatToSend.trackData = null;
    }
    formatToSend.title = this.title;
    formatToSend.content = this.content;
    formatToSend.linkUrl = this.link;
    formatToSend.visibleAtStart = this.visibleAtStart;
    formatToSend.startTime = this.startTime;
    formatToSend.endTime = this.endTime;
    return formatToSend;
};
//-------------------------------------------------------------------------------------------------------
//***********************END OF OBJECT: MOVI CLICKABLE AREA*********************************************
//******************************************************************************************************

//******************************************************************************************************
//***************************OBJECT: MOVI BOOKMARK *****************************************************
var MoviBookmark = function (_moviForm) {
    //this does not inherit anythig as this does not declarea a tracking area.
    this.moviForm = _moviForm;
    this.title = "not set";
    this.content = "not set";
    this.startTime = 0;
}
//-------------------------------------------------------------------------------------------------------
MoviBookmark.prototype.setBookmarkValueFromService = function (_moviObject, _parentSvgDOM) {
    this.title = _moviObject.title || "Service Undefined";
    this.content = _moviObject.content || "Service Undefined";
    this.startTime = _moviObject.startTime || 0;
};
//-------------------------------------------------------------------------------------------------------
MoviBookmark.prototype.writeInfoFromService = function (_moviObject, _parentSvgDOM, _rootElementId) {
    this.setBookmarkValueFromService(_moviObject, _parentSvgDOM);
    return this.moviDomImplementation(_rootElementId);
};
//-------------------------------------------------------------------------------------------------------
MoviBookmark.prototype.setBookmarkValuesFromUser = function () {
    this.title = $(this.moviForm).find('.toolForm').find('.moviTitle').val() || "tool undefined";
    this.content = $(this.moviForm).find('.toolForm').find('.moviContent').val() || "tool undefined";
    this.startTime = $(this.moviForm).find('.toolForm').find('.moviStartTime').val() || 0;
};
//-------------------------------------------------------------------------------------------------------
MoviBookmark.prototype.moviDomImplementation = function (_rootElementId) {
    //generate an ID so we can refer back to the item
    var itemID = randomIdGenerator();
    this.domID = itemID;
    //then render the info in the HTML DOM.
    $('#' + _rootElementId).prepend('<h2 id=' + itemID + '>' + this.title + '</h2>' +
        '<div>' +
        '<p>' + this.content + '</p>' +
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
MoviBookmark.prototype.writeInfoToDOM = function (_rootElementId) {
    this.setBookmarkValuesFromUser();
    return this.moviDomImplementation(_rootElementId);
};
//-------------------------------------------------------------------------------------------------------
MoviBookmark.prototype.populateBookmarkUpdater = function () {
    $(this.moviForm).find('.toolForm').find('.moviTitle').val(this.title);
    $(this.moviForm).find('.toolForm').find('.moviContent').val(this.content);
    $(this.moviForm).find('.toolForm').find('.moviStartTime').val(this.startTime);
};
//-------------------------------------------------------------------------------------------------------
MoviBookmark.prototype.populateUpdater = function () {
    moviToolsControler.showToolContainerUpdate(this.moviForm, this);
    this.populateBookmarkUpdater();
};
//-------------------------------------------------------------------------------------------------------
MoviBookmark.prototype.updateBookmarkObject = function () {
    this.title = $(this.moviForm).find('.toolForm').find('.moviTitle').val() || "Update Failed";
    this.content = $(this.moviForm).find('.toolForm').find('.moviContent').val() || "Update Failed";
    this.startTime = $(this.moviForm).find('.toolForm').find('.moviStartTime').val() || 0;
};
//-------------------------------------------------------------------------------------------------------
MoviBookmark.prototype.updateDomObject = function () {
    this.updateBookmarkObject();
    $('#' + this.domID).text(this.title);
    $('#' + this.domID).next().find('p').first().text(this.content);
};
//-------------------------------------------------------------------------------------------------------
MoviBookmark.prototype.clearBookmark = function () {
    this.title = "cleared";
    this.content = "cleared";
    this.startTime = 0;
};
//-------------------------------------------------------------------------------------------------------
MoviBookmark.prototype.clear = function () {
    this.clearBookmark();
}
//-------------------------------------------------------------------------------------------------------
MoviBookmark.prototype.deleteBookmarkDom = function () {
    //these are debug values
    this.title = "deleted";
    this.content = "deleted";
    this.startTime = 0;
};
//-------------------------------------------------------------------------------------------------------
MoviBookmark.prototype.deleteDom = function () {
    this.deleteBookmarkDom();
    //delete the elements from the DOM.
    $('#' + this.domID).next().remove();
    $('#' + this.domID).remove();
}
//-------------------------------------------------------------------------------------------------------
//define render to do nothing as the engine will call it
//leave setRenderTime and setTrack undeclared as they shoud not be called
MoviBookmark.prototype.render = function (_time, _offset) {
    return;
}
//-------------------------------------------------------------------------------------------------------
MoviBookmark.prototype.setStartTime = function (_time) {
    this.startTime = _time;
    return _time;
}
//-------------------------------------------------------------------------------------------------------
//keep the scaler object as it belongs in the signature and will be sent
MoviBookmark.prototype.storeFormat = function (scalerObject) {
    var formatToSend = new Object();
    formatToSend.__type = "moviBookmark:#moviDataLibrary";
    formatToSend.title = this.title;
    formatToSend.content = this.content;
    formatToSend.startTime = this.startTime;
    return formatToSend;
};

//***********************END OF OBJECT: MOVI BOOKMARK **************************************************
//******************************************************************************************************

function moviEditorController(userControlContainerId, ytVideo, sourceWidth, sourceHeight){
    var trackingAreaAndInfo = [];
    var domToInfoDictionary = new Object();
    //this keeps track of how many track areas we have received.
    var trackDataReady = 0;
    var previewRender = false;
    
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
    var sessionToken;
    var projectQueryToken = null;
    if (urlParameters["session"] != null) {
        sessionToken = urlParameters["session"];
    }
    else {
        sessionToken = 'B2BF0691-83AA-4CBD-8FD5-DFF5F1CE88E9';
        //alert('Failed to load the session, using default');
    }
    //checking if the token parameter, use this to load existing data
    //and editing it.
    if (urlParameters["token"] != null) {
        projectQueryToken = urlParameters["token"];
        getProjectInfo();
    }
    
    //make a reference to the front end render controller
    canvasControl = moviCanvasController(myScaler, sessionToken);


    //used as a proxy in every mode creation
    var helperConstructor = null;
    var currentObject = null;
    var updateObject = null;
    //----------------------------------------------------------------------------------------
    //controller v2: a generic engine, it only receives objects and coordinates them
    //does not care what type
    function addMoviObject(_moviObject) {
        //by design, if there is an active tool and the user selects another one
        //the actual tools is canceled and activate the selected one.
        if (currentObject != null) {
            cancelCurrent();
        }
        if (updateObject != null) {
            cancelUpdate();
        }
        currentObject = _moviObject;
    }
    //----------------------------------------------------------------------------------------
    //TODO: design the update architecture
    function updateMoviObject(_moviObject) {
        if (currentObject != null) {
            cancelCurrent();
        }
        if (updateObject != null) {
            cancelUpdate();
        }
        updateObject = _moviObject;
    }
    //idea:use update object to point to current object.
    //----------------------------------------------------------------------------------------
    function cancelCurrent() {
        if (currentObject != null) {
            currentObject.clear();
            currentObject = null;
        }
        previewRender = false;
        canvasControl.cancelSelectTool();
    }
    function cancelUpdate() {
        //jus dereference the object, dont clear it because its valid an in the render array
        updateObject = null;
        canvasControl.cancelSelectTool();
    }
    //end of controller v2
    //----------------------------------------------------------------------------------------
    //the main controller must coordinate adding track data to the movi objects
    function enableTrackTool() {
        //INFO: the track data is independent from the text and other info. 
        //so no need to check for modes or tools.
        //TODO: toggle is prone to bugs
        //be explicit and call enable editor.
        canvasControl.toggle();
    }

    //add the track info to the data structure
    function addTrack(_parentSvgDOM, _receivedTrack) {
        //TODO: some error and type checking on the paremeter info
        //scale the received info, this function modifes the info we send
        myScaler.scaleReceived(_receivedTrack.Xtl, _receivedTrack.Ytl, _receivedTrack.Xbr, _receivedTrack.Ybr);
        if (currentObject != null)
        {
            currentObject.setTrack(_receivedTrack, _parentSvgDOM)
            previewRender = true;
            canvasControl.toggle();
            return;
        }
        if(updateObject != null)
        {
            updateObject.setTrack(_receivedTrack, _parentSvgDOM)
            canvasControl.toggle();
            return;
        }
        //TODO: if we reach here log an invalid operation
    }

    //handling the service errors
    function errorHandler() {
        //canvasControl.toggle by itself takes care of state handling
        canvasControl.toggle();
    }

    function cancelHandler() {
        //canvasControl.toggle by itself
        //this allow the user to star from 0 the select area workflow
        canvasControl.toggle();
    }

    //sets the end time of the stored track data, this end time 
    //is then used to truncate the data when publishing
    function setEndTime(time) {
        if (currentObject != null)
        {
            return currentObject.setRenderTime(time);
        }
        if (updateObject != null)
        {
            return updateObject.setRenderTime(time);
        }
    }
    
    //verifies that there is not a valid track area
    //if so does not allow the user to change the time
    function setStartTime(time) {
        if (currentObject != null)
        {
            return currentObject.setStartTime(time);
        }
        if (updateObject != null)
        {
            return updateObject.setStartTime(time);
        }
    }
    
    function addUserControlToDOM() {
        //----------------v2 definition------------------
        //TODO: remember to set the various flags, like prerender, activetool etc.
        var domReference = currentObject.writeInfoToDOM(userControlContainerId);
        trackingAreaAndInfo.push(currentObject);
        //----------------end of v2 definitinon----------
        //ready to accept new command
        currentObject = null;
        trackDataReady = trackDataReady + 1;
        previewRender = false;

        //this is aquick and dirty proof of concept for the delete functionality
        //but the place is here because the delete function only affects the main renderer
        $(domReference.divContainer).append('<button class="moviDeleteElement" type="button" >Delete</button>');
        var currentIndex = trackingAreaAndInfo.length-1;
        $(domReference.divContainer).find('.moviDeleteElement').click(currentIndex, function () {
            trackingAreaAndInfo[event.data].deleteDom();
            trackingAreaAndInfo.splice(event.data, 1);
        });
    }

    function updateUserControlDOM() {
        updateObject.updateDomObject();
        updateObject = null;
    }

    function render(time, offset) {
        if (previewRender)
        {
            currentObject.render(time, offset);
        }
        if (trackDataReady > 0 ) {
            for (var i = 0; i < trackingAreaAndInfo.length; i++) {
                //tracking engine v2
                trackingAreaAndInfo[i].render(time, offset);
            }
        }
    }

    function getTrackArea()
    {
        return trackingAreaAndInfo;
    }

    function storeData() {
        //--------------------v2--------------------------------------
        //the idea here is that every object mus at least contain title and content
        //so we desing and inheritance structure to send all the objects in one array
        //instead of designing one service contract for every  format
        var sendBuffer = [];
        for (var i = 0; i < trackingAreaAndInfo.length; i++) {
            sendBuffer[i] = trackingAreaAndInfo[i].storeFormat(myScaler);
        }
        //--------------------end of v2-------------------------------
        //once the data is formated send it to the service to store
        var infoToSend =
        {
            dataStream: sendBuffer
        };
        $.ajax({
            url: "http://moviserver.cloudapp.net/service3.svc/web/moviStoreData",
            type: "POST",
            cache: false,
            //CARE: the parameter name MUST match the parameter definition on wcf
            data: JSON.stringify({
                parameters: infoToSend,
                sessionToken: sessionToken,
                projectToken: projectQueryToken,
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
    //-------------------project loader-----------------------------------------------------
    function getProjectInfo ()
    {
        $.ajax({
            url: "http://moviserver.cloudapp.net/service3.svc/web/moviGetData",
            type: "POST",
            cache: false,
            //CARE: the parameter name MUST match the parameter definition on wcf
            data: JSON.stringify({
                //this is an existin project, this id must come from the session.
                projectToken: projectQueryToken,
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
                var transformObject;
                var currentDomReference;
                var currentIndex = 0;
                for (var i = 0; i < data.d.dataStream.length; i++) {
                    currentObject = data.d.dataStream[i];
                    //first scale the track data if any
                    if (currentObject.trackData != null && currentObject.trackData != undefined) {
                        myScaler.scaleReceived(currentObject.trackData.Xtl, currentObject.trackData.Ytl,
                                            currentObject.trackData.Xbr, currentObject.trackData.Ybr)
                    }
                    //the create he corresponding object:
                    //the __type is a WCF convention, if we move to another system we might need to change that
                    //here referin to the DOM IDs is a bit unortodox, investigate if there is another way
                    switch (currentObject.__type) {
                        case "moviHighlight:#moviDataLibrary":
                            transformObject = new MoviHighlight($('#highlightEditor').next().get(0));
                            currentDomReference = transformObject.writeInfoFromService(currentObject, $('#svgRoot').get(0),
                                userControlContainerId);
                            trackingAreaAndInfo.push(transformObject);
                            break;
                        case "moviClickableArea:#moviDataLibrary":
                            transformObject = new MoviClickableArea($('#clickableAreaEditor').next().get(0));
                            currentDomReference = transformObject.writeInfoFromService(currentObject, $('#svgRoot').get(0),
                                userControlContainerId);
                            trackingAreaAndInfo.push(transformObject);
                            break;
                        case "moviBookmark:#moviDataLibrary":
                            transformObject = new MoviBookmark($('#bookmarkEditor').next().get(0));
                            currentDomReference = transformObject.writeInfoFromService(currentObject, $('#svgRoot').get(0),
                                userControlContainerId);
                            trackingAreaAndInfo.push(transformObject);
                            break;
                    }

                    $(currentDomReference.divContainer).append('<button class="moviDeleteElement" type="button" >Delete</button>');
                    currentIndex = trackingAreaAndInfo.length - 1;
                    $(currentDomReference.divContainer).find('.moviDeleteElement').click(currentIndex, function (event) {
                        trackingAreaAndInfo[event.data].deleteDom();
                        trackingAreaAndInfo.splice(event.data, 1);
                    });
                }
                trackDataReady = trackDataReady + 1;
                //--------------------end of-V2 data structure------------------------
                alert('get movi Object success');

            },
            error: function (response) {
                alert('Failed: ' + response.statusText);
                //SAFE CHECK: if something fails do not allow the system to submit an delete - update 
                //query
                projectQueryToken = null;
            }
        });
    }
    return {
        //-------v2----------------
        addMoviObject: addMoviObject,
        setStartTime: setStartTime,
        updateMoviObject: updateMoviObject,
        updateUserControlDOM : updateUserControlDOM,
        //-------end of v2---------

        //---------debug methods---
        getTrackArea: getTrackArea,
        //--------end of debug-----
        enableTrackTool: enableTrackTool,
        addTrack: addTrack,
        addUserControlToDOM: addUserControlToDOM,
        render: render,
        storeData: storeData,
        errorHandler: errorHandler,
        cancelHandler: cancelHandler,
        setEndTime: setEndTime,
    }
}