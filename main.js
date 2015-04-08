#!/bin/env node

//Include express.js
var express = require('express');

//Do we need file system access? Maybe not
var fs      = require('fs');
var xmldoc = require('xmldoc');
//Set up routes
var routes = express();

//Router for the custom page
var router = require('./webtunes_core/router');
var xmlrouter = require('./webtunes_core/xmlparser');
var multer = require('multer');


/**
 *  Define the sample application.
 */
 var SampleApp = function() {

    console.log("test");
    console.log("testing again");
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
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8090;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
     self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
     self.cache_get = function(key) { return self.zcache[key]; };


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
        self.routes['/u/:user'] = router.userPage;
        self.routes['/data/:user'] = router.albumData;
        self.routes['/organize/:user/:key/:sortby'] = router.musicSearch;
        self.routes['/organize/:user/:sortby'] = router.musicSearch;//For the special case of an empty search key
        self.routes['/nalwa'] = xmlrouter.xml;
        self.routes['/'] = router.homePage;
        self.routes['/checkuser/:user'] = router.checkuser;
        self.posts['/upload_xml'] = router.uploadXML;
        self.posts['/ping_user'] = router.pingUser;
        self.posts['/getCloudData'] = router.getCloudData;
        self.posts['/getBubbleData'] = router.getBubbleData;
        self.posts['/getTagData'] = router.getTagData;
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
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
     self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
 var zapp = new SampleApp();
 zapp.initialize();
 zapp.start();

