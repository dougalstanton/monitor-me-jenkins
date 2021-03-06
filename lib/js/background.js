
(function(_, $, can, chrome, document, window){
"use strict";

    $(document).on('ajaxBeforeSend', function(e, xhr, options){
        // This gets fired for every Ajax request performed on the page.
        // The xhr object and $.ajax() options are available for editing.
        // Return false to cancel this request.
        var auth = null,
            useAuth = mmj.getLocalStore("UseAuth");

        if (useAuth === "true"){
            auth = window.btoa((mmj.getLocalStore("username") || '') + ':' + (mmj.getLocalStore("password") || ''));
            xhr.setRequestHeader('Authorization', 'Basic ' + auth);
        }
    });
    /* TODO; re-factor legacy code, add comments and clean-up */

    var DEFAULT_VALUES = window.DEFAULT_VALUES,
        DEBUG = window.DEBUG,
        STATUSES = window.STATUSES,
        console = window.console,
        mmj = {},
        manifest = chrome.runtime.getManifest();

    mmj = {
        observable:{
            list:new can.Observe.List()
        },
        jobs:[],
        util:{
            escape:function(val){
                if (val.charAt( val.length - 1 ) === '/'){
                    val = val.substring(0, val.length -1)
                }
                var vals = val.split('/'),
                    temp = [],
                    i = 0,
                    l = vals.length,
                    cleaned = '';

                for (;i<l;i++){
                    if (i === l-1){ // do the last one
                        temp.push( window.encodeURIComponent( window.decodeURIComponent( vals[i] ) ) )
                    } else {
                        temp.push( vals[i] );
                    }

                }
                cleaned = temp.join('/');
                if (cleaned.charAt( cleaned.length - 1 ) !== '/'){
                    cleaned += '/'
                }
                return cleaned;
            }
        },
        clearTimout:function(fn){
            if (fn){
                clearTimeout(fn);
            }
        },
        getOptions:function(){
            if (!mmj.getLocalStore('loaded')){
                mmj.resetLocalStore();
                mmj.setLocalStore("loaded",true);
            }
            var ops = {};
            for (var key in DEFAULT_VALUES){
                if (DEFAULT_VALUES.hasOwnProperty(key)){
                    ops[key] = mmj.getLocalStore(key);
                }
            }
            return ops;
        },
        getLocalStore:function(key, fn, def){
            var value = localStorage[key];
            key = key || "";
            if (value === undefined){
                value = DEFAULT_VALUES[key] || def || null;
            }
            if (typeof fn === 'function'){
                value = fn(value);
            }
            if (key.toLowerCase().indexOf("password") === 0){
                value = window.atob(value);
            }
            return value;
        },
        setLocalStore:function(key,value){
            if (key.toLowerCase().indexOf("password") === 0){
                value = window.btoa(value);
            }
            localStorage[key] = value;
            mmj.initSoon();
        },
        resetLocalStore:function(){
            localStorage.clear();
            for (var key in DEFAULT_VALUES){
                if (DEFAULT_VALUES.hasOwnProperty(key)){
                    localStorage[key] = DEFAULT_VALUES[key];
                }
            }
            mmj.init();
        },
        log:function(message){
            if (DEBUG){
                console.log(message);
            }
        },
        initSoon:function(){
            if (mmj.checksoon){
                clearTimeout(mmj.checksoon);
            }
            mmj.checksoon = setTimeout(mmj.init, 5000);
        },
        init:function(){
            mmj.observable.list.replace();
            mmj.updateBrowserActionStatus(-1);
            mmj.getAllViews();
            if (mmj.repeat){
                clearTimeout(mmj.repeat);
            }
            if (mmj.checksoon){
                clearTimeout(mmj.checksoon);
            }
            mmj.repeat = setTimeout(mmj.init,mmj.getLocalStore("RefreshTime") * 1000 * 60 );
            chrome.browserAction.setTitle({title:manifest.name +' '+ manifest.version})
        },
        desperateGetViewsList:function(views){
            views = views || JSON.parse( mmj.getLocalStore("JenkinsViews", 0 , []));
            if (views.length === 0){
                views.push({
                    url:mmj.getCleanUrl(),
                    cols:mmj.getLocalStore("ColumnCount")
                });
            }
            return _.filter(views, function(item){ return !!item.url });
        },
        getViewsList:function(views){
            views = views || JSON.parse( mmj.getLocalStore("JenkinsViews", 0 , []));
            var urls = [],
                i = 0, l = views.length;

            for (;i<l;i++){
                if (!!views[i].url){
                    urls.push( mmj.urlCleaner( views[i].url ) );
                }
            }
            if (l === 0){
                urls.push( mmj.getCleanUrl() );
            }
            return urls;
        },
        getAllViews:function(){
            var views = mmj.getViewsList(),
                i = 0,
                l = views.length,
                send = function(url){
                    mmj.sendRequest( url );
                }
            mmj.jobs = [];
            if (l === 0){
                mmj.sendRequest( mmj.getCleanUrl() );
            } else {
                views.forEach(send);
            }
        },
        getMainUrl:function(views){
            views = views || JSON.parse( mmj.getLocalStore("JenkinsViews", 0 , []) );
            if (views.length > 0){
                return mmj.urlCleaner( views[0].url );
            } else {
                return mmj.getCleanUrl( );
            }
        },
        urlCleaner:function(url){
            var urlArr = url.split("://"),
                temp = '';
            if (urlArr.length > 1){
                temp = urlArr[0]+"://"+ mmj.util.escape( urlArr[1].replace(/\/+/g,'/') );
            } else {
                temp =  'http://' + mmj.util.escape( urlArr[0].replace(/\/+/g,'/') );
            }
            return temp ;
        },
        getCleanUrl:function( ){
            var url = mmj.getLocalStore("JenkinsURL") +"/view/"+ mmj.getLocalStore("JenkinsView");

            return mmj.urlCleaner( url ) ;
        },
        updateBrowserActionStatus:function(status) {
            mmj.log("update status: "+ status);
            chrome.browserAction.setBadgeText({text:''});
            if (status === 0 || status > 0) {
                mmj.updateBrowserActionStatusPie();
            } else {
                chrome.browserAction.setIcon({path:'lib/i/icon19.png'});
                return chrome.browserAction.setBadgeText({text:'?'});
            }
            //mmj.updateBrowserActionStatusPie()
        },
        updateBrowserActionStatusPie:function(){
                function pie(ctx, w, h, datalist, colourlist, padding)
                {
                    var p = padding || 0,
                        radius = (h / 2) - p,
                        centerx = w / 2,
                        centery = h / 2,
                        last = 0,
                        offset = Math.PI / 2,
                        total = datalist.reduce(function(a, b) {
                            return a + b;
                        }),
                        len = datalist.length;
                    /* pie */
                    ctx.save();
                    for(var x=0; x < len; x++){
                        var item = datalist[x],
                            arcsector = Math.PI * (2 * item / total);
                        ctx.beginPath();
                        ctx.fillStyle = colourlist[x];
                        ctx.moveTo(centerx,centery);
                        ctx.arc(centerx, centery, radius, last - offset, last +
                            arcsector - offset, false);
                        ctx.lineTo(centerx, centery);
                        ctx.fill();
                        ctx.closePath();
                        last += arcsector;
                    }
                    ctx.restore();
                    ctx.beginPath();
                    ctx.arc(centerx, centery, radius, 0, Math.PI*2, true);
                    ctx.closePath();
                    ctx.strokeStyle = "rgba(80,80,80,0.7)";
                    ctx.lineWidth   = 1;
                    ctx.stroke();

                }
                function getCanvas(){
                    var canvas;
                    if (document.getElementsByTagName("canvas").length){
                        canvas = document.getElementsByTagName("canvas")[0];
                    } else {
                        canvas = document.createElement("canvas");
                        document.getElementsByTagName('body')[0].appendChild( canvas );
                    }
                    return canvas;
                }
                var canvas = getCanvas(),
                    green = (mmj.getLocalStore("SuccessMarker") === "true") ? '#3333ff' : '#00ff00',
                    datalist= [0,0,0],
                    colourlist = new Array('#ff0000', green, '#ffff00', '#aaaaaa'),
                    ctx = canvas.getContext('2d');
                datalist[0] = mmj.jobs.filter(function(job){ return job.color.indexOf('red') > -1;}).length;
                datalist[1] = mmj.jobs.filter(function(job){ return job.color.indexOf('blue') > -1;}).length;
                datalist[2] = mmj.jobs.filter(function(job){ return job.color.indexOf('yellow') > -1;}).length;
                datalist[3] = mmj.jobs.length - (datalist[0] + datalist[1] + datalist[2]);

                pie(ctx, 19, 19, datalist, colourlist, 2);
                var radgrad = ctx.createRadialGradient(5,5,2,5,5,5);
                radgrad.addColorStop(0, '#A7D30C');
                radgrad.addColorStop(0.9, '#019F62');
                radgrad.addColorStop(1, 'rgba(1,159,98,0)');

            var imageData = ctx.getImageData(0, 0, 19, 19);

            chrome.browserAction.setIcon({
                imageData: imageData
            });
        },
        sendRequest:function(view){
            view = view +'api/json';
            mmj.log("Requesting "+ view);
            var deferred = can.ajax({
                type: 'GET',
                url: view,
                dataType: 'json',
                timeout: DEFAULT_VALUES.timeout,
                success:handleResponse,
                error:handleResponseError
            });
            deferred.done(function(response){
                //- Deferred is done.
                mmj.handleResponse(response, view);
            });
            function handleResponse(response){
                deferred.resolve(response);
            }
            function handleResponseError(e){
                deferred.reject();
                mmj.log(e);
                mmj.log("Something bad happened, maybe couldn't connect to Jenkins?");
                // mmj.jobs = [];
                mmj.updateBrowserActionStatus( -1 );
            }

        },
        handleResponse:function(response, view){
            var topStatus,
                tempArray,
                deferreds = [];

            if (!response.jobs) {
                mmj.clearTimeout(mmj.checksoon);
                mmj.checksoon = setTimeout(function(){
                    mmj.init();
                },DEFAULT_VALUES.pollinterval * 1000);
                return;
            }
            if (response.jobs.length === 0){
                mmj.clearTimeout(mmj.checksoon);
                mmj.checksoon = setTimeout(function(){
                    mmj.init();
                },DEFAULT_VALUES.pollinterval * 1000);
                return;
            }


            if (mmj.getLocalStore("SortBy") !== 'status') {
                tempArray = _.sortBy(response.jobs,function(job){return job.name;});
            }else{
                tempArray = _.sortBy(response.jobs,function(job){return STATUSES[job.color];});
                tempArray.reverse();
            }
            if (mmj.getLocalStore("SortDirection") === 'true'){
                tempArray.reverse();
            }
            topStatus = STATUSES[ _.max(tempArray, function(job) { return STATUSES[job.color]; }).color ];
            mmj.updateBrowserActionStatus(topStatus);


            for (var i = 0, l = tempArray.length; i < l; i++){
                var j = i,
                    job = tempArray[j],
                    url = job.url+'/api/json';
                job.view = view;
                mmj.jobs.push(job);
                deferreds.push(ajaxJsonParent(url, job));
            }
            function ajaxJsonParent(url, job){
                return can.ajax({
                    url : url,
                    type: 'GET',
                    async : false,
                    dataType: 'json',
                    success: function(data) {ajaxJsonChild(data, job);},
                    error:onError
                });
                function ajaxJsonChild(data, job){
                    job.details = data  || {};
                    if (job.details.lastBuild){
                        deferreds.push(can.ajax({
                            url : job.details.lastBuild.url +'/api/json',
                            type: 'GET',
                            async : false,
                            dataType: 'json',
                            success: function(data){
                                job.details.lastBuild.details = data || {};
                                mmj.updateBrowserActionStatusPie();
                            },
                            error:onError
                        }));
                    }
                }
                function onError(e){
                    mmj.log(e);
                    mmj.log("Something bad happened trying to get job info");
                }
            }
            can.when
                .apply(can, deferreds)
                .then(function(){
                    mmj.observable.list.replace( mmj.jobs );
                });
        }
    };
    window.mmj = mmj;
    mmj.init();

})(window._, window.Zepto, window.can, window.chrome, window.document, window);