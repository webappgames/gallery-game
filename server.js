var config = {

    port: 1338,
    fps: 10,

    //time to live [s]
    ttl: 5

};



var WebSocketServer = require('websocket').server;
var http = require('http');

var httpServer = http.createServer(function(request, response) {
    response.end(JSON.stringify(galleries,null,4));
});


httpServer.listen(port, function() { });



wsServer = new WebSocketServer({
    httpServer: httpServer
});




var users = {};
var galleries = {};





//============================================================================Messages
wsServer.on('request', function(request) {

    var connection = request.accept(null, request.origin);


    var session = 'xxx'+Math.random();//todo guid
    users[session] = {
        connection: connection,
        gallery: null
    };
    var user = users[session];




    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            // process WebSocket message

            try{

                var message = JSON.parse(message.utf8Data);

            }catch(error){

                connection.sendUTF(JSON.stringify({
                    error: 'Message must be valid JSON.'
                }));

            }


            if("gallery" in message){
                user.gallery = gallery;
            }



            if(user.gallery){


                galleries[user.gallery] = galleries[user.gallery] || {};
                galleries[user.gallery][session] = galleries[user.gallery][session] || {};

                ['position','message','name'].forEach(function (key) {
                    if(key in message){
                        galleries[user.gallery][session][key] = message[key];
                    }
                });

                galleries[user.gallery][session].timestamp = new Date()/1000;


            }else{
                connection.sendUTF(JSON.stringify({
                    warn: 'You should define gallery before you update your state.'
                }));
            }

        }
    });



    connection.on('close', function(connection) {

        if(user.gallery) {
            delete galleries[user.gallery][session];
        }

        delete users[session];

    });

});
//============================================================================



//============================================================================Loop
setInterval(function () {

    users.forEach(function (user) {

        if(user.gallery){

            //todo filter
            user.connection.sendUTF(JSON.stringify(galleries[user.gallery]));

        }else{

            user.connection.sendUTF(JSON.stringify({
                warn: 'You should define gallery before you can get state of other users.'
            }));
        }
    });

 },1000/fps);
//============================================================================



//============================================================================Garbage collector
setInterval(function () {

    var time = new Date()/1000;
    var gallery, session;
    for(gallery in galleries){
        for(session in galleries[gallery]){

            if(galleries[gallery][session].time<time-config.ttl){

                delete galleries[gallery][session];
                if(session in users){
                    users[session].connection.sendUTF(JSON.stringify({
                        warn: 'You was removed because of ttl'
                    }));

                }else{
                    console.warn('User '+session+' was removed because of ttl and unclosed connection.');
                }

            }


        }
    }


},1000*config.ttl);
//============================================================================




console.log('WS server running on '+port);