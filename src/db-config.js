module.exports = function(RED) {
    var knex = require('knex');

    function DBConfig(config) {
        RED.nodes.createNode(this, config);

	this.client = config.client;
        this.host   = config.host;
        this.port   = config.port;
	this.dbname = config.dbname;

	var node = this;

	node.on('close', function(done) {
	    clearInterval(node.check);
	    node.knex.detroy(done);
	});
	
	node.knex = knex({
	    client: node.client,
	    connection: {
		host     : node.host,
		port     : node.port,
		user     : node.credentials.user,
		password : node.credentials.password,
		database : node.dbname,
		charset  : 'utf8'
	    }
	});

	function ping() {
            node.knex.raw("SELECT version()").then((version) => {
		node.emit('ping', true)
	    }).catch((err) => {
		node.emit('ping', err);
		node.warn(err);
	    });
        }
	node.check = setInterval(ping, 293 * 1000);
    }
    RED.nodes.registerType("db-config", DBConfig, {
        credentials: {
            user:     { type: "text"     },
            password: { type: "password" }
        }
    });
}
