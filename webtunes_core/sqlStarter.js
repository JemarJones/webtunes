var mysql = require('mysql');

var dbConnectionString = process.env.JAWSDB_MARIA_URL

var connection;
handleDisconnect();

function handleDisconnect() {
    connection = mysql.createConnection(dbConnectionString); // Recreate the connection, since the old one cannot be reused.
    connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
        console.log('error when connecting to db:', err);
        setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    } else {
        console.log("Successfully started SQL connection");
        module.exports.connection = connection;
    }                                    // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal) { // Connection to the MySQL server is usually
            console.log("Looks like we've lost our connection. Restarting SQL".red);
            console.log(handleDisconnect);
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}



exports.escape = function(str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    });
}
