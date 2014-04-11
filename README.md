#Sails.js + Socket.io (v0.9) + Backbone.js

Simple proof of concept application showing how Sails.js,
Socket.io and Backbone.js can all work together for efficient
push communications.

##Sails.js

Mostly default configurations were used, with minor tweaks to
`config/cors.js`, `config/session.js` and `config/sockets.js`:

###config/cors.js

Allow CORS requests from all domains.  This can be locked down a bit
more if you know the list of domains to allow up front.

```
	allRoutes: true,
```

###config/session.js

Use Redis for session storage.  This together with socket sessions in
Redis fixes about half the issues
with socket sessions getting forgotten on reconnect.  The other half
is fixed with client side Backbone.js code.

```
  secret: '59f4e7a8d4b958f9f9ae462f35f0d12f',


  // In production, uncomment the following lines to set up a shared redis session store
  // that can be shared across multiple Sails.js servers
  adapter: 'redis'
```

###config/sockets.js

Use Redis for socket session storage.  This together with web sessions in
Redis fixes about half the issues
with socket sessions getting forgotten on reconnect.  The other half
is fixed with client side Backbone.js code.

```
  adapter: 'redis',
```

##Socket.io (v0.9)

Server side it's all defaults.  On the client side we load the socket.io
JS library from the Sails server, like so:

```
<script src="http://localhost:1337/socket.io/socket.io.js" type="text/javascript"></script>
```

Then we define a quick helper function to map the Backbone sync function
to socket.io emit calls:

```
    function socketSync(method,model,options){

//        console.log("index.js, socketSync; method, model, options :: ", method, model, options);

        function dereferenceUrl(model){
            var url= model.url;
            if(model.url && typeof model.url === "function") {
                try{
                    url = model.url();
                }catch(err){
                    console.log("Caught an error dereferencing url; url, err :: ", url, err);
                    url= void 0;
                }
            }
            return url;
        }

        function emitSocket(action,model,options){
            var url= dereferenceUrl(model);
            if(url){
                var json = io.JSON.stringify({
                    url: url,
                    data: model.attributes
                });
                socket.emit(action,json,function(data){
                    if(options.success){
                        data= $.parseJSON(data);
                        options.success(data);
                    }
                });
            }
        }

        // entry point for method
        switch (method) {
            case 'create':
                // Save a new model to the server.
                emitSocket('post',model,options);
                break;
            case 'read':
                // Record the subscription for reconnect events.
                subscriptions.push(model);
                // Get a collection or model from the server.
                emitSocket('get',model,options);
                break;
            case 'update':
                // Save an existing model to the server.
                emitSocket('put',model,options);
                break;
            case 'delete':
                // Delete a model on the server.
                emitSocket('delete',model,options);
                break;
        }
    }
```

Then we define a `Backbone.sync` method to initialize the socket, and handle
incoming messages and reconnect events:

```
    Backbone.sync = function(method, model, options){

//        console.log("index.js, Backbone.sync; method, model :: ", method, model);

        if( !socketInitialized){
            var serverUrl= "http://localhost:1337";
            $.get(serverUrl, function(data){
                if( socket== undefined){
                    socket= io.connect(serverUrl);
                    socket.on('connect', function socketConnected() {

                        // Listen for Comet messages from Sails
                        socket.on('message', function messageReceived(message) {

                            ///////////////////////////////////////////////////////////
                            // Replace the following with your own custom logic
                            // to run when a new message arrives from the Sails.js
                            // server.
                            ///////////////////////////////////////////////////////////
                            console.log('New comet message received :: ', message);
                            ///////////////////////////////////////////////////////////

                            window[message.model].refreshData();
                        });

                        // Resubscribe on reconnect.
                        socket.on("reconnect", function socketReconnected(){
                            window.subscribedViews.forEach(function(subscribedView){
                                subscribedView.refreshData();
                            })
                        });


                        ///////////////////////////////////////////////////////////
                        // Here's where you'll want to add any custom logic for
                        // when the browser establishes its socket connection to
                        // the Sails.js server.
                        ///////////////////////////////////////////////////////////
                        console.log(
                            'Socket is now connected and globally accessible as `socket`.\n' +
                                'e.g. to send a GET request to Sails, try \n' +
                                '`socket.get("/", function (response) ' +
                                '{ console.log(response); })`'
                        );
                        ///////////////////////////////////////////////////////////


                    });
                    socketInitialized= true;
                }
                socketSync(method,model,options);
            })
        }else{
            socketSync(method,model,options);
        }
    };
```

##Backbone.js

The final pieces of the puzzle are defining a `refreshData` method on
all views listening for changes from other socket clients:

```
        refreshData: function(){
            this.collection.fetch();
        },
```

And registering these views to global / shared location, where the Socket.io
code above can get to it:

```
    if(!window.subscribedViews){
        window.subscribedViews= [];
    }
    window.subscribedViews.push(listView);
    window["socketupdate"]= listView;
```

#Conclusion

For some reason none of the existing art for this stack did not exactly met our needs.
We got things mostly working using existing examples, only to have severe
trouble with intermittent connectivity issues over the socket channel.
Basically everything would work on refresh, but leave the browser open for a
while, jump across a few wireless access points, put the laptop to sleep a couple
times, move on and off mifi, etc, and all socket subscriptions are lost.

Much noodling, debugging and browser refreshing later, the solution above was
developed.  Hope this helps :)