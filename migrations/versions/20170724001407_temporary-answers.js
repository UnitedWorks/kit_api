

exports.up = function(knex, Promise) {
    knex.schema.alterTable('knowledge_facilitys', (table) => {
 	   table.integer('event_rule_id').references('event_rule.id');
 	})
 	.alterTable('event_rules', (table) => {

 	});
};

exports.down = function(knex, Promise) {
  
};
