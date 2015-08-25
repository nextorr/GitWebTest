/// <reference path="../jquery21/jquery-2.1.0-vsdoc.js" />
function binaryIndexOf(searchElement) {
    'use strict';

    var minIndex = 0;
    var maxIndex = this.length - 1;
    var currentIndex;
    var currentElement;

    while (minIndex <= maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentElement = this[currentIndex];

        if (currentElement < searchElement) {
            minIndex = currentIndex + 1;
        }
        else if (currentElement > searchElement) {
            maxIndex = currentIndex - 1;
        }
        else {
            return currentIndex;
        }
    }
    //a close value to the one im searching
    return -currentIndex;
}

function queryString(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i) {
        var p = a[i].split('=');
        if (p.length != 2) continue;
        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
}


//this generates a random ID
//TODO: use a "static class" that outpus letters in order if 
//we encounter problems debugging this
function randomIdGenerator() {
    var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return uniqid = randLetter + Date.now();
    
}
//apply the scaling transformations
//the player is expected to keep the aspect ratio adding black bars 
//when the player aspect ratio does not match the video Aspect ratio.
//shownDimensions: the actual rendered to the user dimensions
//TODO: add a flag in the service to process streched video when needed

function scaler(playerWidth, playerHeight, sourceWidth, sourceHeight)
{
    var Yratio = 1;
    var Xratio = 1;
    var Yoff = 0;
    var Xoff = 0;
    var sourceAR = sourceWidth / sourceHeight;
    var playerAR = playerWidth / playerHeight;
    if ((playerAR) < sourceAR)
    {
        //horizontal black bars, playerWidth == shownWidth
        var shownHeight = (1/sourceAR) * playerWidth;
        Yoff = (playerHeight - shownHeight) / 2;
        Xratio = sourceWidth /playerWidth;
        Yratio = sourceHeight / shownHeight;
    }
    else if ((playerAR) > sourceAR)
    {
        //vertical black bars, playerHeight == shownHeight
        shownWidth = sourceAR * playerHeight;
        Xoff = (playerWidth - shownWidth) / 2;
        Xratio = sourceWidth / shownWidth ;
        Yratio = sourceHeight / playerHeight ;
    }
    else if ((playerAR) == sourceAR)
    {
        //last because of aritmetic errors this is the least possible
        //this does not mean that the player has the same size as the source
        Xratio = sourceHeight / playerHeight;
        Yratio = sourceWidth / playerWidth;
    }

    function scaleToSend(Xtl, Ytl, width, height) {
        Xtl = Xratio * (Xtl - Xoff);
        Ytl = Yratio * (Ytl - Yoff);
        width = width * Xratio;
        height = height * Yratio;

        return {
            Xtl: Xtl,
            Ytl: Ytl,
            width: width,
            height: height,
        };
    }
    //caution: this are the array functions
    //caution: this function modifyes the original data, so a return value is not needed
    function scaleReceived(Xtl, Ytl, Xbr, Ybr) {
        for (i = 0; i < Xtl.length; i++) {
            //they must be the same length
            Xtl[i] = (Xtl[i] / Xratio) + Xoff;
            Ytl[i] = (Ytl[i] / Yratio) + Yoff;
            Xbr[i] = (Xbr[i] / Xratio) + Xoff;
            Ybr[i] = (Ybr[i] / Yratio) + Yoff;
        }
        return {
            Xtl: Xtl,
            Ytl: Ytl,
            Xbr: Xbr,
            Ybr: Ybr,
        };
    }
    //caution: this are the array functions
    //caution: this function modifies the original data, so a return value is not needed
    //caution: the service expects integers, thats why we are using floor.
    function scaleToStore(Xtl, Ytl, Xbr, Ybr) {
        for (i = 0; i < Xtl.length; i++) {
            Xtl[i] = Math.floor((Xtl[i] - Xoff) * Xratio);
            Ytl[i] = Math.floor((Ytl[i] - Yoff) * Yratio);
            Xbr[i] = Math.floor((Xbr[i] - Xoff) * Xratio);
            Ybr[i] = Math.floor((Ybr[i] - Yoff) * Yratio);
        }
        return {
            Xtl: Xtl,
            Ytl: Ytl,
            Xbr: Xbr,
            Ybr: Ybr,
        };
    }
    return {
        scaleToSend: scaleToSend,
        scaleReceived: scaleReceived,
        scaleToStore: scaleToStore,
    }
}



function trackingRectangle(parentSVG, URL, _title, _text, _image, _startTime) {
    var domNode = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    parentSVG.appendChild(domNode);

    // Set initial position 
    domNode.setAttribute("x", 10);
    domNode.setAttribute("y", 10);
    domNode.setAttribute("width", 50);
    domNode.setAttribute("height", 50);
    domNode.setAttribute("opacity", 0.3);
    domNode.setAttribute("stroke", "white");
    domNode.setAttribute("stroke-width", "2");
    domNode.setAttribute("visibility", "visible");
    domNode.onmousedown = function (event) {
        //uncomment this to allow links on the trackArea
        //window.open(URL, "_blank");
        $.event.trigger({
            type: "trackAreaClicked",
            message: {
                title: _title,
                text: _text,
                image: _image,
                link: URL,
                startTime: _startTime
            }
        });
    };

    function draw(Xtl, Xbr, Ytl, Ybr) {
        domNode.setAttribute("x", Xtl);
        domNode.setAttribute("y", Ytl);
        domNode.setAttribute("width", Xbr - Xtl);
        domNode.setAttribute("height", Ybr - Ytl);
    }

    function switchVisibility() {
        if (domNode.getAttribute("visibility") == "visible") {
            domNode.setAttribute("visibility", "collapse");
        }
        else {
            domNode.setAttribute("visibility", "visible")
        }
    }

    function collapse() {
        //if its alseady collapsed do nothing
        if (domNode.getAttribute("visibility") == "visible") {
            domNode.setAttribute("visibility", "hidden");
        }
    }

    function visible(params) {
        if (domNode.getAttribute("visibility") == "hidden") {
            domNode.setAttribute("visibility", "visible");
            //send the event of this change
            $.event.trigger({
                type: "areaVisible",
                message: params
            });
        }
    }
    function removeFromDOM() {
        parentSVG.removeChild(domNode);
    }

    return {
        draw: draw,
        switchVisibility: switchVisibility,
        collapse: collapse,
        visible: visible,
        removeFromDOM: removeFromDOM,
    }
}

function moviUserControls(_rootElementID) {
    var rootElementId = _rootElementID;
    //this enables the accordion functionality on existing divs
    $('#' + rootElementId).find('h2').click(function () {
        $(this).next().slideToggle();
    }).next().hide();

    ////add a new accordion item to the DOM
    //function setMoviAd(title, content, image) {
    //    var imageSrc = "data:image/jpg;base64," + btoa(bin2String(trackingAds.image));
    //    $('#accordion-js').prepend('<h2>' + title + '</h2><div><img src="' + imageSrc + '" /><p>' + content + '</p></div>');
    //    $('#accordion-js').find('h2').first().click(function () { $(this).next().slideToggle() }).next().hide();
    //}

    //add a new accordion highligth item to the DOM
    function addHightlight(title, content, startTime, endTime) {
        var itemId = randomIdGenerator();
        $('#' + rootElementId).prepend('<h2 id='+itemId+'>' + title + '</h2><div><p onclick="seekVideo('+ startTime +')">' + content + '</p></div>');
        $('#'+ rootElementId).find('h2').first().click(function () { $(this).next().slideToggle() }).next().hide();
        //trigger an event when an item is added
        triggerAddedEvent(itemId, title, content, startTime, endTime)
    }

    //edit an accordion highlight with the given id
    function editHighlight(highLightId,callerId, title, content, startTime, endTime) {
        $('#' + highLightId).text(title);
        $('#' + highLightId).next().children('p').text(content);
        $('#' + highLightId).next().children('p').click(function () { seekVideo(startTime); });
        triggerEditedEvent(highLightId, callerId, title, content, startTime, endTime);
    }
   
    
    function triggerAddedEvent(_elementId, _title, _content,_startTime, _endTime) {
        $.event.trigger({
            type: "moviUserControlAdded",
            message: {
                elementId: _elementId,
                title: _title,
                content: _content,
                startTime: _startTime,
                endTime: _endTime
            }
        });
    }

    function triggerEditedEvent(_elementId, _callerId, _title, _content, _startTime, _endTime) {
        $.event.trigger({
            type: "moviUserControlEdited",
            message: {
                elementId: _elementId,
                callerId : _callerId,
                title: _title,
                content: _content,
                startTime: _startTime,
                endTime: _endTime
            }
        });
    }

    return {
        addHightlight: addHightlight,
        editHighlight: editHighlight
    }
}

//this is intended to be used on the player as 27/05/2015
function Visualization(_moviAd, _index, parentSVG, _tweetList) {
    this.moviAd = _moviAd;
    this.index = _index;
    this.tweetList = _tweetList;
    this.rectangle = new trackingRectangle(parentSVG, this.moviAd.link, this.moviAd.title, this.moviAd.text, this.moviAd.image, this.moviAd.trackData.timeLine[0]);
    this.render = function (time, offset) {
        var innerIndex = binaryIndexOf.call(this.moviAd.trackData.timeLine, time);
        if ((time < this.moviAd.trackData.timeLine[0] || time > this.moviAd.trackData.timeLine[this.moviAd.trackData.timeLine.length - 1])) {
            //the asked time is outside the timeLine definition, hide the rectangle
            this.rectangle.collapse();
        }
        else if (offset == null) {
            //draw the position without any offset
            if (innerIndex < 0) {
                this.rectangle.draw(this.moviAd.trackData.Xtl[-innerIndex], this.moviAd.trackData.Xbr[-innerIndex], this.moviAd.trackData.Ytl[-innerIndex], this.moviAd.trackData.Ybr[-innerIndex]);
            } else {
                this.rectangle.draw(this.moviAd.trackData.Xtl[innerIndex], this.moviAd.trackData.Xbr[innerIndex], this.moviAd.trackData.Ytl[innerIndex], this.moviAd.trackData.Ybr[innerIndex]);
            }
            this.rectangle.visible(this.tweetList);
        }
        else {
            //draw the position applying the offset
            //TODO: this only works on the standard wide screen ratio
            if (innerIndex < 0) {
                this.rectangle.draw(this.moviAd.trackData.Xtl[-innerIndex] * offset, this.moviAd.trackData.Xbr[-innerIndex] * offset, this.moviAd.trackData.Ytl[-innerIndex] * offset, this.moviAd.trackData.Ybr[-innerIndex] * offset);
            } else {
                this.rectangle.draw(this.moviAd.trackData.Xtl[innerIndex] * offset, this.moviAd.trackData.Xbr[innerIndex] * offset, this.moviAd.trackData.Ytl[innerIndex] * offset, this.moviAd.trackData.Ybr[innerIndex] * offset);
            }
            this.rectangle.visible(this.tweetList);
        }
    }
}



function moviCommunicationManager(parentSVG) {
    var sessionID;
    var counter = 0;
    var _responseWCF;
    var _sessionReady;
    var trackingAds = [];


    function getLogInSession(queryToken) {
        $.ajax({
            url: "http://6b46bb1db04e4cdf87f28f214ee65081.cloudapp.net/moviData.svc/web/getLogInViewerSessionYT",
            type: "POST",
            cache: false,
            //CARE: the parameter name MUST match the parameter definition on wcf
            data: JSON.stringify({ tokenID: queryToken }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            processData: true,
            //note: complete responds with data.responseJSON
            // success responds with data directly
            success: function (data) {
                _responseWCF = data.d;
                sessionID = _responseWCF.sessionID;
                _sessionReady = true;
                //triger the basic info ready evet (this includes the video URL)
                $.event.trigger({
                    type: "sessionReady",
                    //use this when the video url is expected from the service
                    //message: _responseWCF.url
                    message: {
                        videoURL: queryToken,
                        trackAreaTokens: _responseWCF.trackAreas,
                        twitterList: _responseWCF.twitterIds
                    }
                });
                //start loading the tracking information
                getTrackAndAds();
            },
            error: function (response) {
                alert('Failed: ' + response.statusText);
                _sessionReady = false;
            }
        });
    }

    function getTrackAndAds() {
        if (_sessionReady == false) {
            return false;
        }
        for (var i = 0; i < _responseWCF.trackAreas.length; i++) {
            //dev note: here we must check for duplicate entries
            if (i == 0 || (_responseWCF.trackAreas[i] != _responseWCF.trackAreas[i - 1])) {
                $.ajax({
                    url: "http://moviserver.cloudapp.net/service1.svc/web/getTrackAndAds",
                    type: "POST",
                    cache: false,
                    //CARE: the parameter name MUST match the parameter definition on wcf
                    data: JSON.stringify({ token: _responseWCF.trackAreas[i] }),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    processData: true,
                    //note: complete responds with data.responseJSON
                    // success responds with data directly
                    success: function (data) {
                        //this supports the twitter api
                        //TODO: we need a clean way to support this in the code
                    //meanwhile just sent and empty list
                        //trackingAds.push(new Visualization(data.d, counter, parentSVG, getTweets(data.d.token)));
                        trackingAds.push(new Visualization(data.d, counter, parentSVG, [1, 2]));
                        counter++;
                        //trackingAds.push(data.d);

                        if (counter == _responseWCF.trackAreas.length) {
                            //we downloaded all the trackAreas
                            //TODO: what happends if there is an error from the service?
                            $.event.trigger({
                                type: "trackAreaReady",
                                message: trackingAds
                            });
                        }

                    },
                    error: function (response) {
                        alert('Failed: ' + response.statusText);
                    }
                });
            }
            else if ((_responseWCF.trackAreas[i] == _responseWCF.trackAreas[i - 1])) {
                counter++;
            }
        }
        return trackingAds;
    }

    function getVideoUrl() {
        if (_sessionReady == true) {
            return _responseWCF.url;
        } else {
            return false;
        }
    }

    function getTweets(trackAreaID) {
        //this is the brute force approach
        var list = [];
        for (var i = 0; i < _responseWCF.trackAreas.length; i++) {
            if (_responseWCF.trackAreas[i] == trackAreaID) {
                list.push(_responseWCF.twitterIds[i]);
            }
        }
        return list;
    }


    return {
        getLogInSession: getLogInSession,
        getTrackAndAds: getTrackAndAds,
        getVideoUrl: getVideoUrl
    }

}

function clickHandler(text, event) {
    //parent.postMessage({ moviType: "onclick", Xpos: event.pageX, Ypos: event.pageY, time: player.getCurrentTime() }, developerApiHost);

    alert("I am an alert box!" + " from " + text + " Xpos " + event.pageX.toString());

    player.play();
}
