#!/bin/env node

//Include express.js
var express = require('express');

//Set up routes
var routes = express();

//Router for the custom page
var router = require('./webtunes_core/router');
var visualizations = require('./webtunes_core/visualizations');
var multer = require('multer');
var colors = require('colors');


/**
 *  Define the sample application.
 */
 var WebTunes = function() {
    console.log(" __          __  _  _______                    ".cyan.bold);
    console.log(" \\ \\        / / | ||__   __|                   ".cyan.bold);
    console.log("  \\ \\  /\\  / /__| |__ | |_   _ _ __   ___  ___ ".cyan.bold);
    console.log("   \\ \\/  \\/ / _ \\ '_ \\| | | | | '_ \\ / _ \\/ __|".cyan.bold);
    console.log("    \\  /\\  /  __/ |_) | | |_| | | | |  __/\\__ \\".cyan.bold);
    console.log("     \\/  \\/ \\___|_.__/|_|\\__,_|_| |_|\\___||___/".cyan.bold);
    console.log("Created by: ");
    console.log("\tNikolai Savas".bold+" - "+"http://savas.ca/".cyan+" - McMaster University");
    console.log("\tJemar Jones".bold+" - "+"http://jkjones.me/".cyan+" - McMaster University");
    console.log("\tSamraj Nalwa".bold+" - "+"http://nalwa.ca/".cyan+" - McMaster University");
    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
     self.setupVariables = function() {
        //  Set the environment variables we need.
        self.port = process.env.PORT || 8080;
    };

    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
     self.terminator = function(sig){
        if (typeof sig === "string") {
         console.log('%s: Received %s - terminating sample app ...',
             Date(Date.now()), sig);
         process.exit(1);
     }
     console.log('%s: Node server stopped.', Date(Date.now()) );
 };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
     self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
        'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
     self.createRoutes = function() {
        self.routes = { };
        self.posts = {};

        // self.routes['/asciimo'] = function(req, res) {
        //     var link = "http://i.imgur.com/kmbjB.png";
        //     res.send("<html><body><img src='" + link + "'></body></html>");
        // };

        // self.routes['/'] = function(req, res) {
        //     res.setHeader('Content-Type', 'text/html');
        //     res.send(self.cache_get('index.html') );
        // };
        self.routes['/instructions'] = router.instructionsPage;
        self.routes['/u/:user'] = router.userPage;
        self.routes['/musicSearchAndSort/:user/:key/:sortby'] = router.musicSearchAndSort;
        self.routes['/musicSearchAndSort/:user/:sortby'] = router.musicSearchAndSort;//For the special case of an empty search key
        self.routes['/'] = router.homePage;
        self.routes['/checkuser/:user'] = router.checkuser;
        self.posts['/upload_xml'] = router.uploadXML;
        self.posts['/ping_user'] = router.pingUser;
        self.posts['/getCloudData'] = visualizations.getCloudData;
        self.posts['/getBubbleData'] = visualizations.getBubbleData;
        self.posts['/getTagData'] = visualizations.getTagData;
        self.posts['/getTrackData'] = visualizations.getTrackData;
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
     self.initializeServer = function() {
        self.createRoutes();
        self.app = express();
        self.app.set('view engine', 'jade');//Used to render our pages
        self.app.use(express.static('static'));
        self.app.use(express.bodyParser());
        self.app.use(multer({
          dest: './uploads/',
          rename: function (fieldname, filename) {
            return filename.replace(/\W+/g, '-').toLowerCase() + Date.now()
          }
        }));

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }

        for (var p in self.posts){
            self.app.post(p,self.posts[p]);
        }
    };


    /**
     *  Initializes the sample application.
     */
     self.initialize = function() {
        self.setupVariables();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
     self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, function() {
            console.log('%s: WebTunes started on port: %d ...',
                Date(Date.now() ), self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
 var zapp = new WebTunes();
 zapp.initialize();
 zapp.start();

