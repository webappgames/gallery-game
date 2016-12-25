var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets server
    // we don't have to implement anything.

    response.end(JSON.stringify(galleries,null,4));
});
server.listen(1338, function() { });

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});


var galleries = {};


// WebSocket server
wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);



    var gallery;// = 'xxx'.Math.random();
    var session = 'xxx'+Math.random();




    /*setInterval(function () {
        connection.sendUTF('KUK');
    },1000);*/






    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            // process WebSocket message

            try{

                var message = JSON.parse(message.utf8Data);

            }catch(error){

                connection.sendUTF('Wrong message!');

            }





            if(message.type=='initial'){

                if(typeof message.gallery!=='string'){
                    connection.sendUTF('Initial request should contain gallery.');
                    return;
                }


                gallery = message.gallery;
                //session = 'xxx'+Math.random();//todo guid

                galleries[gallery] = galleries[gallery] || {};
                galleries[gallery][session] = galleries[gallery][session] || {};

                connection.sendUTF('You are in gallery '+gallery+' with session '+session);

            }else
            if(message.type=='position'){

                galleries[gallery][session].position = message.position;

            }



            //console.log(message);
            //connection.sendUTF('You said: '+message.utf8Data);



        }
    });

    connection.on('close', function(connection) {
        // close user connection
    });
});


console.log('all done');