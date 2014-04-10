/**
 * app.js
 *
 * This file contains some conventional defaults for working with Socket.io + Sails.
 * It is designed to get you up and running fast, but is by no means anything special.
 *
 * Feel free to change none, some, or ALL of this file to fit your needs!
 */

(function (io) {

    // as soon as this file is loaded, connect automatically,
    var socket = io.connect();

    var subscriptions = [];
    console.log('attempting to override socket.get');
    var get = socket.get;
    var customGetFunction= function(url,data,cb){
        console.log('custom get method', url);
        var found = false;
        subscriptions.forEach(function (subscription) {
            if (url === subscription) {
                found = true;
            }
        });
        if (!found) {
            subscriptions.push(url);
        }
        console.log('subscriptions:', subscriptions);
        get.apply(socket, [url, data, cb]);
    };

    // tf - Saw this in browser console when running over MiFi,
    //  socketInitialized is used to workaround.
    /*
     attempting to override socket.get app.js:16
     Connecting to Sails.js... app.js:90
     custom get method /socketUpdate/ app.js:20
     subscriptions:
     Array[1]
     app.js:30
     updating subscriptions after restart.
     Array[1]
     app.js:43
     Socket is now connected and globally accessible as `socket`.
     e.g. to send a GET request to Sails, try
     `socket.get("/", function (response) { console.log(response); })`
     */
    var socketsInitialized= false;
    (function () {
        socket.get = function (url, data, cb) {
            if(!socketsInitialized){
                // queue up the request for a few millis in the future.
                window.setTimeout( function(){customGetFunction(url,data,cb);}, 25);
            }else{
                customGetFunction(url,data,cb);
            }
        };
    })();

    if (typeof console !== 'undefined') {
        log('Connecting to Sails.js...');
    }

    var receivedMessages= [];
    socket.on('connect', function socketConnected() {

        // Listen for Comet messages from Sails
        socket.on('message', function messageReceived(message) {

            ///////////////////////////////////////////////////////////
            // Replace the following with your own custom logic
            // to run when a new message arrives from the Sails.js
            // server.
            ///////////////////////////////////////////////////////////
            log('New comet message received :: ', message);
            ///////////////////////////////////////////////////////////

            var found= false;
            var messageIdentity= message.model+ ':'+ message.id;
            receivedMessages.forEach(function(receivedMessage){
                if(messageIdentity===receivedMessage){
                    found=true;
                }
            });
            if( !found){
                receivedMessages.push(messageIdentity);
                if(window[message.model]){
                    window[message.model](message.data);
                }
            }
        });


        ///////////////////////////////////////////////////////////
        // Here's where you'll want to add any custom logic for
        // when the browser establishes its socket connection to
        // the Sails.js server.
        ///////////////////////////////////////////////////////////
        log(
            'Socket is now connected and globally accessible as `socket`.\n' +
                'e.g. to send a GET request to Sails, try \n' +
                '`socket.get("/", function (response) ' +
                '{ console.log(response); })`'
        );
        ///////////////////////////////////////////////////////////


    });

    socket.on( 'reconnect', function socketReconnected(){

        if (subscriptions && subscriptions.length > 0) {

            console.log('updating subscriptions after restart.', subscriptions);

            subscriptions.forEach(function (url) {

                get.apply(socket, [url]);
            });
        }

    });


    // Expose connected `socket` instance globally so that it's easy
    // to experiment with from the browser console while prototyping.
    window.socket = socket;

    // set initialized to true, let get requests flow through.
    socketsInitialized= true;


    // Simple log function to keep the example simple
    function log() {
        if (typeof console !== 'undefined') {
            console.log.apply(console, arguments);
        }
    }


})(

        // In case you're wrapping socket.io to prevent pollution of the global namespace,
        // you can replace `window.io` with your own `io` here:
        window.io

    );
