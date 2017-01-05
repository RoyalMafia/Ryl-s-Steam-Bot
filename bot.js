/* 

	Requires

*/

var SteamUser = require( 'steam-user' );
var cleverbot = require( 'cleverbot.io' );

/*

	Variables

*/

var client         = new SteamUser();
var botChatID      = null;
var botChatAdminID = null;
var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/*

	Arrays

*/

var cmdList = {};

/* 

	Functions

*/

function findCmd( cmd ) {
	for( i in cmdList ) {
		if( cmdList[i][0] == cmd ) {
			return true;
		};
	};
};

function getCmd( cmd ) {
	for( i in cmdList ) {
		if( cmdList[i][0] == cmd ) {
			return i;
		};
	};
};

/*

	Commands

*/


cmdList.Cmds = [ "!cmds", "Displays all available commands.", function( steamID ) {
	var StrArr = ["Comands:\n"];

	for( i in cmdList ) {
		StrArr.push( cmdList[i][0]+": "+cmdList[i][1]+"\n" );
	};

	client.chatMessage( steamID, StrArr.join("") );
}];
cmdList.chatRoom = [ "!chatroom", "Creates a chat room & invites / Invites (If a chat room already exists) to exist chat room.", function( steamID ) {
	if( botChatID == null ) {
		client.chatMessage( steamID, "Creating chat room, will invite upon success." )
		client.createChatRoom( null, steamID, function( result, chatID ) {
			console.log( "Attempting to create group chat." );
	    	if( result == 1 ) {
	    		console.log( "Created group chat!" );
	    		botChatID = chatID;
	    		console.log( "ChatID: "+botChatID );
	    		botChatAdminID = steamID;
	    		console.log( "ChatAdminID: "+botChatAdminID );
	    	}else{
	    		console.log( "Failed to create group chat!" );
	    		client.chatMessage( steamID, "Failed to create group chat! Try again later." );
	    	};
	    });
	}else{
		client.chatMessage( steamID, "There's already a chat room, type !invchat to get invited." );
	};
}];
cmdList.invChat = [ "!invchat", "Invites you to a chat room if one exists.", function( steamID ) {
	if( botChatID != null ) {
		client.chatMessage( steamID, "Inviting you to chat room." );
		client.inviteToChat( botChatID, steamID );
	}else{
		client.chatMessage( steamID, "There's no existing chat room, use !chatroom to create one." );
	}
}];

/* 
	
	Cleverbot.IO 

*/

function createCleverBot( usr, key ) {
	steambot = new cleverbot( usr, key );
	steambot.create(function (err, session) {
		console.log( "SteamBot started." )
	});
};

function cleverBotResp( steamID, message ) {
	if( typeof steambot != 'undefined' ) {
    	steambot.ask( message , function (err, response) {
    		if( response != 'Error, the reference "" does not exist' ) {
    			console.log( "Cleverbot Respsonse: "+response )
		  		client.chatMessage( steamID, response )
    		}else{
    			console.log( "Cleverbot had a fit." )
    			client.chatMessage( steamID, "Cleverbot just had a fit." )
    		};
		});
    };
};

/*

	SteamBot Functions

*/

client.logOn({
    accountName: process.argv[2],
    password: process.argv[3]
});

client.on('loggedOn', () => {
    client.setPersona(SteamUser.Steam.EPersonaState.Online, "Ryl's Bot");
    console.log("Logged into Steam account.");

    rl.question("Cleverbot Username: ", function(usr) {
	  	rl.question("Cleverbot API Key: ", function(key) {
	  		createCleverBot( usr, key );
			rl.close();
		});

	});
});

// Friend Chat
client.on('friendMessage', function(steamID, message) {
	client.getPersonas([steamID], function(personas) {
		var persona = personas[steamID];
		var name = persona ? persona.player_name : ("[" + steamID + "]");

		console.log("Message from " + name + ": " + message);
	});

    if( findCmd( message ) ) {
    	cmdList[getCmd( message )][2]( steamID );
    }else{
    	cleverBotResp( steamID, message );
    };

});

// Room Functions
client.on('chatMessage', function( room, chatter, message ) {
	cleverBotResp( room, message );
});

client.on('chatUserJoined', function( chatID, userID ) {
	client.getPersonas([userID], function(personas) {
		var persona = personas[userID];
		var name = persona ? persona.player_name : ("[" + userID + "]");

		client.chatMessage( chatID, "Welcome "+name+"!" );
	});
});
