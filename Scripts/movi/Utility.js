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


function trackingRectangle(parentSVG, URL) {
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
        window.open(URL, "_blank");
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

    return {
        draw: draw,
        switchVisibility: switchVisibility,
        collapse: collapse,
        visible: visible
    }
}



function Visualization(_moviAd, _index, parentSVG, _tweetList) {
    this.moviAd = _moviAd;
    this.index = _index;
    this.tweetList = _tweetList;
    this.rectangle = new trackingRectangle(parentSVG, this.moviAd.link);
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
            url: "http://b4eed5aea5214e2a96dc95f537de6d55.cloudapp.net/moviData.svc/web/getLogInViewerSession",
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
                    message: { videoURL: _responseWCF.url,
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
