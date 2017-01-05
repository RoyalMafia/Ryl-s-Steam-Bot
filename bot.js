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

function idToName( event, id ) {
	event.getPersonas([id], function(personas) {
		var persona = personas[id];
		var name = persona ? persona.player_name : ("[" + id + "]");

		return name;
	});
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

steambot = new cleverbot( "XcalmM9U7LeGrJBs", "xmnthCP1N9yW7jdlVPD3leZgxc8DhmyK" );
steambot.create(function (err, session) {
	console.log( "SteamBot started." )
});

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
});

// Friend Chat
client.on('friendMessage', function(steamID, message) {
    console.log("Message from " + steamID.getSteamID64() + ": " + message);
    if( findCmd( message ) ) {
    	cmdList[getCmd( message )][2]( steamID );
    }else{
    	steambot.ask( message , function (err, response) {
    		console.log( "Responded: "+response )
		  	client.chatMessage( steamID, response )
		});
    }
});

// Room Functions
client.on('chatMessage', function( room, chatter, message ) {
	console.log( room );
	if( room == botChatID ) {
		if( chatter == botChatAdminID ) {
			console.log( "Admin chatted." )
		};
	};
});

client.on('chatUserJoined', function( chatID, userID ) {
	client.chatMessage( chatID, idToName( client, userID)+" joined the chat room." );
});

client.on('chatUserLeft', function( chatID, userID ) {

});