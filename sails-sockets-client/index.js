// Self-executing wrapper
(function($){

    var socketInitialized= false;
    var socket= void 0;
    var subscriptions= [];

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

    Backbone.sync = function(method, model, options){

//        console.log("index.js, Backbone.sync; method, model :: ", method, model);

        if( !socketInitialized){
            var serverUrl= "http://localhost:1337";
            $.ajaxSetup({xhrFields: {
                withCredentials: true
            }});
            $.get(serverUrl, function(data, status, xhr){
                if( socket== undefined){
                    var connectUrl= serverUrl;
                    if(xhr.getResponseHeader("Set-Cookie")){
                        var sailsCookie= xhr.getResponseHeader("Set-Cookie");
                        sailsCookie= sailsCookie.substring(0,sailsCookie.indexOf(";"));
                        connectUrl= connectUrl+ "?cookie="+ sailsCookie.replace( "=", "%3D");
                    }
                    socket= io.connect(connectUrl);
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
                if( socket){
                    socketSync(method,model,options);
                }
            })
        }else{
            socketSync(method,model,options);
        }
    };

    // One socket message item
    var SocketMessage= Backbone.Model.extend({
        defaults: {
            contents: 'default contents'
        },
        // must give url here too, since we call backbone sync methods before adding to collection.
        url: '/socketUpdate/'
//        ,
//        sync: socketSync
    });

    // List of socket messages.
    var SocketMessageList= Backbone.Collection.extend({
        model: SocketMessage,
        url: '/socketUpdate/' // this one is for socket communications.
//        url: 'http://localhost:1337/socketUpdate/' // this one is for default backbone communications.
    });

    var SocketMessageView= Backbone.View.extend({
        tagName: 'div',

        events: {
            "click span.remove": "remove"
        },

        initialize: function(){
            _.bindAll( this, "render", "unRender", "remove");
            this.model.bind('remove', this.unRender);
        },

        render: function(){
            $(this.el).html(this.model.get("id")+ " - "+ this.model.get("contents")+
                " [<span class='remove' style='cursor:pointer; color:red;'>remove</span>]");
            return this;// Return this for use in appendSocketMessage below.
        },

        unRender: function(){
            $(this.el).remove();
        },

        remove: function(){
            this.model.destroy();
        }
    });

    var ListView = Backbone.View.extend({
        el: $("body"),

        events: {
            "click button#addSocketMessage": "addSocketMessage"
        },

        initialize: function(){
            _.bindAll(this, "refreshData", "render", "addSocketMessage", "appendSocketMessage", "addToCollection");
            this.collection= new SocketMessageList();
            this.collection.bind("add",this.appendSocketMessage);
            this.render();
            this.refreshData();
        },

        refreshData: function(){
            this.collection.fetch();
        },

        render: function(){
            $(this.el).append("<input type='text' id='socketMessage' placeholder='Type some text.'/>");
            $(this.el).append("<button id='addSocketMessage'>Add Socket Message</button>");
            $(this.el).append("<div id='main'></div>");
            _(this.collection.models).each(function(socketMessage){
                this.appendSocketMessage(socketMessage);
            }, this);
        },

        addToCollection: function addToCollection(model,response){
            this.collection.add(model);
        },

        addSocketMessage: function(){
            var socketMessage= new SocketMessage();
            socketMessage.set({
                contents: $("input#socketMessage").val()
            });
            socketMessage.save({},{
                success: this.addToCollection
            });
        },

        appendSocketMessage: function(socketMessage){
            var socketMessageView= new SocketMessageView({
                model:socketMessage
            });
            $("div#main", this.el).append(socketMessageView.render().el);
        }
    });

    var listView = new ListView();
    if(!window.subscribedViews){
        window.subscribedViews= [];
    }
    window.subscribedViews.push(listView);
    window["socketupdate"]= listView;
})(jQuery);
