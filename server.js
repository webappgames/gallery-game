var config = {

    port: 1338,
    fps: 0.5,

    //time to live [s]
    ttl: 5

};



var WebSocketServer = require('websocket').server;
var http = require('http');

var httpServer = http.createServer(function(request, response) {
    response.end(JSON.stringify(galleries,null,4));
});


httpServer.listen(config.port, function() { });



wsServer = new WebSocketServer({
    httpServer: httpServer
});




var users = {};
var galleries = {};




function createGuid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}



//============================================================================Messages
wsServer.on('request', function(request) {

    var connection = request.accept(null, request.origin);


    var session = createGuid();
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
                user.gallery = message.gallery;
            }



            if(user.gallery){


                galleries[user.gallery] = galleries[user.gallery] || {};
                galleries[user.gallery][session] = galleries[user.gallery][session] || {};

                ['name','message','position','rotation'].forEach(function (key) {
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


    for(var session in users){
        if(users[session].gallery){

            //todo filter
            users[session].connection.sendUTF(JSON.stringify(galleries[users[session].gallery]));

        }else{

            users[session].connection.sendUTF(JSON.stringify({
                warn: 'You should define gallery before you can get state of other users.'
            }));
        }

    }


 },1000/config.fps);
//============================================================================



//============================================================================Garbage collector
setInterval(function () {

    //console.log('Garbage collector running...');
    var timestamp = new Date()/1000;
    var gallery, session;
    for(gallery in galleries){
        for(session in galleries[gallery]){


            if(timestamp-galleries[gallery][session].timestamp>config.ttl){

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




console.log('WS server running on '+config.port);