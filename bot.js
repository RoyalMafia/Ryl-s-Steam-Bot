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
var readline       = require('readline');
var rl             = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

/*

	Arrays

*/

var cmdList     = {};
var chatcmdList = {};
var chatUsrs    = [];

/* 

	Functions

*/

function findVal( list, val, pos ) {for( i in list ) {if( list[i][pos] == val ) {return true;};};};
function getVal( list, val, pos ) {for( i in list ) {if( list[i][pos] == val ) {return i;};};};

/*

	Commands

*/


cmdList.Cmds = [ "!cmds", "Displays all available commands.", function( steamID ) {
	var StrArr = ["Comands:\n"];

	for( i in cmdList ) {
		StrArr.push( cmdList[i][0]+": "+cmdList[i][1] );
	};

	client.chatMessage( steamID, StrArr.join("\n") );
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

	Chat room commands

*/

chatcmdList.cmds = ["!cmds", "Displays available commands.", function( steamID ) {
	var StrArr = ["Chat Room Comands:\n"];

	for( i in chatcmdList ) {
		StrArr.push( chatcmdList[i][0]+": "+chatcmdList[i][1] );
	};

	client.chatMessage( steamID, StrArr.join("\n") );
}];

chatcmdList.kickFromChat = ["!kick", "Kicks the specified user from the chat, usage: !kick {Username}", function( steamID, target ) {
	if( steamID.toString() != botChatAdminID.toString() ) {
		console.log( steamID == botChatAdminID );
		client.chatMessage( steamID, "You don't have access to that command!" );
		return
	};

	var targetid = null;
	var index    = null;
	
	for( i in chatUsrs ) {
		if( chatUsrs[i][0].includes( target )  ) {
			targetid = chatUsrs[i][1];
			index = i;
		};
	};

	if( targetid != null ) {
		console.log( "Kicked "+target+" from the chat room." )
		client.kickFromChat( botChatID, targetid );
		chatUsrs.splice( index, 1 );
	}else{
		console.log( "Target not found." );
		client.chatMessage( steamID, "Target not found." )
	};
}];

/* 
	
	Cleverbot.io

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

// Initiate Login
client.logOn({
    accountName: process.argv[2],
    password: process.argv[3]
});

// What to do once we've logged in
client.on('loggedOn', () => {
    client.setPersona(SteamUser.Steam.EPersonaState.Online, "Ryl's Bot");
    console.log("Logged into Steam account.");
    rl.question("Use cleverbot? (Y/N) ", function( yn ) {
    	if( yn.toLocaleLowerCase() == "y" ) {
		    rl.question("Cleverbot Username: ", function(usr) {
			  	rl.question("Cleverbot API Key: ", function(key) {
			  		createCleverBot( usr, key );
					rl.close();
				});

			});
		}else{
			rl.close()
		};
	});
});

// Friend Chat
client.on('friendMessage', function(steamID, message) {
	client.getPersonas([steamID], function(personas) {
		var persona = personas[steamID];
		var name = persona ? persona.player_name : ("[" + steamID + "]");

		console.log("Message from " + name + ": " + message);
	});

	if( message[0] == "!" ) {
	    if( findVal( cmdList, message, 0 ) ) {
	    	cmdList[getVal( cmdList, message, 0 )][2]( steamID );
	    }else{
	    	client.chatMessage( steamID, "Invalid command entered, use !cmds to get chat commands." );
	    };
	}else{
		cleverBotResp( steamID, message );
	};

});

// Room Functions
client.on('chatMessage', function( room, chatter, message ) {
	client.getPersonas([chatter], function(personas) {
		var persona = personas[chatter];
		var name = persona ? persona.player_name : ("[" + chatter + "]");

		console.log("Chat room message from " + name + ": " + message);
	});

	var strExploded = message.split( " " );

	if( strExploded[0][0] == "!" ) {
		if( findVal( chatcmdList, strExploded[0], 0 ) ) {
			chatcmdList[getVal( chatcmdList, strExploded[0], 0 )][2]( chatter, strExploded[1] );
		}else{
			client.chatMessage( chatter, "Invalid command entered, use !cmds to get chat commands."  );
		};
	}else{
		cleverBotResp( room, message );
	};
});

// User join chat room
client.on('chatUserJoined', function( chatID, userID ) {
	client.getPersonas([userID], function(personas) {
		var persona = personas[userID];
		var name = persona ? persona.player_name : ("[" + userID + "]");

		client.chatMessage( chatID, "Welcome "+name+"!" );

		chatUsrs.push( [name, userID] );
	});
});

// User leave chat room
client.on('chatUserLeft', function( chatID, userID ) {
	
});

// Auto Accept Friend Request
client.on('friendRelationship', function( steamID, relationship ) {
    if ( relationship == SteamUser.Steam.EFriendRelationship.RequestRecipient ) {
        client.addFriend(steamID);
		console.log("Accepted friend request from " + steamID.getSteam3RenderedID());
    };
});

// Chat Left
client.on('chatLeft', function( chatID ) {
	if( chatID == botChatID ) {
		botChatID      = null;
		botChatAdminID = null;

		console.log( "Chat no longer exists, resetting variables." );
	};
});

// Disconnect
client.on('disconnected', function( eresult, msg ) {
	console.log( "Disconnected from Steam resetting variables." )
	
	botChatID = null;
	botChatAdminID = null;
	chatUsrs = null;
});