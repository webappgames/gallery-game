var config = {

    port: 1357,
    fps: 10,

    //time to live [s]
    ttl: 5

};

var fs = require("fs");
var mkpath = require('mkpath');


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



/*
function createGuid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}*/

var _id = 0;
function generateId(){
    return _id++;
}



//============================================================================Messages
wsServer.on('request', function(request) {

    var connection = request.accept(null, request.origin);


    var session = generateId();
    console.log('Player '+session+' connected.');


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




                var all_players = galleries[users[session].gallery];
                var all_players_not_me = {};
                var player;

                for(player in all_players){
                    if(player!=session) {
                        all_players_not_me[player] = all_players[player];
                    }
                }

                connection.sendUTF(JSON.stringify(all_players_not_me));


            }



            if(user.gallery){


                if(user.gallery.indexOf('..')!==-1){

                    connection.sendUTF(JSON.stringify({
                        error: 'Gallery domain not valid.'
                    }));
                    return;
                }


                galleries[user.gallery] = galleries[user.gallery] || {};
                galleries[user.gallery][session] = galleries[user.gallery][session] || {};


                var news_sub = {};
                var news = {}
                news[session] = news_sub;


                ['name','message','position','rotation'].forEach(function (key) {
                    if(key in message){

                        news_sub[key] = message[key];
                        galleries[user.gallery][session][key] = message[key];

                    }
                });



                if('message' in message){

                    /*var dir = __dirname+'/messages/'+user.gallery;
                    var file = dir+'/';*/

                    var escaped_name = galleries[user.gallery][session].name
                        .split('\\').join('\\\\')
                        .split('\n').join('\\n')
                        .split('[').join('\\[')
                        .split(']').join('\\]');


                    var escaped_message = message.message
                        .split('\\').join('\\\\')
                        .split('\n').join('\\n')
                        .split('[').join('\\[')
                        .split(']').join('\\]');


                    var row = ''
                        +'['+((new Date()).toString())+']'
                        +'['+escaped_name+']'
                        +escaped_message
                        +'\n';

                    mkpath(__dirname+'/messages', function (err) {

                        if(err){
                            console.log(err);
                        }else {
                            fs.appendFile(__dirname+'/messages/' + user.gallery + '.log', row, function (err) {
                                if(err) {
                                    console.log(err);
                                }else{
                                    //console.log(message.message);
                                }
                            });
                        }
                    });



                }



                news_sub.timestamp = new Date()/1000;
                galleries[user.gallery][session].timestamp = news_sub.timestamp;




                /*var all_users = users;
                var all_users_not_me = {};
                var user;*/



                //-----------------------------------Notify other users
                var all_users_not_me = {};
                var userkey;

                for(userkey in users){
                    if(users[userkey].gallery==user.gallery && userkey!=session) {
                        all_users_not_me[userkey] = users[userkey];
                    }
                }

                //console.log(all_users_not_me);


                for(userkey in all_users_not_me){
                    all_users_not_me[userkey].connection.sendUTF(JSON.stringify(news));
                }

                //-----------------------------------







            }else{
                connection.sendUTF(JSON.stringify({
                    warn: 'You should define gallery before you update your state.'
                }));
            }

        }
    });



    connection.on('close', function(connection) {

        console.log('Player '+session+' disconected.');

        if(user.gallery) {
            delete galleries[user.gallery][session];
        }

        var _gallery = user.gallery;
        delete users[session];


        //-----------------------------------Notify other users
        var news = {};
        news[session] = null;

        var all_remaining_users = {};
        var userkey;

        for(userkey in users){
            if(users[userkey].gallery==_gallery) {
                all_remaining_users[userkey] = users[userkey];
            }
        }


        for(userkey in all_remaining_users){
            all_remaining_users[userkey].connection.sendUTF(JSON.stringify(news));
        }

        //-----------------------------------



    });

});
//============================================================================



//============================================================================Loop
/*setInterval(function () {

    var all_players,all_players_not_me,player;

    for(var session in users){
        if(users[session].gallery){



            all_players = galleries[users[session].gallery];
            all_players_not_me = {};

            for(player in all_players){
                if(player!=session) {
                    all_players_not_me[player] = all_players[player];
                }
            }


            //todo filter
            users[session].connection.sendUTF(JSON.stringify(all_players_not_me));

        }else{

            users[session].connection.sendUTF(JSON.stringify({
                warn: 'You should define gallery before you can get state of other users.'
            }));
        }

    }


 },1000/config.fps);*/
//============================================================================



//============================================================================Garbage collector
/*setInterval(function () {

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


},1000*config.ttl);*/
//============================================================================




console.log('WS server running on '+config.port);