module.exports = function(RED) {
    // console.warn(query.toString());
    // console.warn(query.toSQL().toNative());

    function DBInsert(config) {
        RED.nodes.createNode(this, config);

	this.database       = config.database;
	this.databaseConfig = RED.nodes.getNode(this.database);
	this.table          = config.table;
	this.status({});

        var node = this;

	node.databaseConfig.on('ping', function(ok) {
	    if (! ok) {
		node.status({ shape: 'ring',
			      fill : 'red',
			      text : 'disconnected' });
	    }
	});
	
	node.on('input', function(msg, send, done) {
	    let knex  = node.databaseConfig.knex;
	    let table = msg.table || node.table;
	    if (table == null) {
		node.warn("table not defined (node or msg.table)");
		node.status({ fill: 'red', shape: 'dot',
			      text: 'table not defined' });
		return;
	    }
	    let query = knex(table).insert(msg.payload);

	    if (msg.conflict) {
		const bad_conflict = { fill: 'red', shape: 'dot',
				       text: 'bad conflict definition' };

		let columns = msg.conflict.on;
		let merge   = msg.conflict.merge;
		let raise   = msg.conflict.raise;
		let ignore  = msg.conflict.ignore;

		//
		if (! ((columns === undefined)                      ||
		       (typeof(columns) == 'string')                ||
		       (Array.isArray(columns) &&
			columns.every((v) => typeof(v) == 'string')))) {
		    node.warn("bad conflict columns definition"
			      +" (must be of type: string or Array<string>)");
		    node.status(bad_conflict);
		    return;
		}
		query = query.onConflict(columns);

		//
		if (((merge  !== undefined) +
		     (raise  !== undefined) +
		     (ignore !== undefined)) != 1) {
		    node.warn("required *one* of raise, ignore, or merge");
		    node.status(bad_conflict);
		    return;
		}
		if (! ((merge  === undefined)                       ||
		       (merge  === true)                            ||
		       (Array.isArray(merge) &&
			column.every((v) => typeof(v) == 'string')))) {
		    node.warn ("bad conflict 'merge' definition"
			       + " (must be of type: true or Array<string>)");
		    node.status(bad_conflict);
		    return;
		}
		if (! ((raise  === undefined)                       ||
		       (raise  === true))) {
		    node.warn ("bad conflict 'raise' definition"
			       + "(must be of type: true)");
		    node.status(bad_conflict);
		    return;
		}
		if (! ((ignore === undefined)                       ||
		       (ignore === true))) {
		    node.warn ("bad conflict 'ignore' definition"
			       + "(must be of type: true)");
		    node.status(bad_conflict);
		    return;
		}
		if (merge ) { query = query.merge(merge); }
		if (ignore) { query = query.ignore();     }
	    }
	    

	    node.status({ fill: 'grey', shape: 'ring', text: 'inserting...' });
	    query.then((value) => {
		node.status({ fill: 'green', shape: 'dot', text: 'connected' });
		done();
	    }).catch((error) => {
		node.warn(error);
		node.status({ fill: 'red', shape: 'dot', text: 'failed' }); 
	    });;
        });
    }
    RED.nodes.registerType("db insert", DBInsert);
}
