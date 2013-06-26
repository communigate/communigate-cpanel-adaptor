The stock PBX environment includes a passive queue implementation.
That is rarely used and is more an example for Queue mechanism in CG/PL.
Scripts in this folder try to implement an active queue - when a call waiting in the queue is connected to a free agent immediately.
Well, not immediately - since we do not have a method to subscribe to a dialog state - we can only to query it, periodically.

The scripts are using the ReadCallInfo call, not documented but used in some stock scripts.

Usage: set up a group with the agents and route some extension to te application. Group "agents@domain": (eng1@mydomain, eng2@otherdomain),
forwarder: 101 -> activequeue{agents@domain}#postmaster@localhost
or the router record: 
S: <101@*> = activequeue{agents@domain}#postmaster@localhost

Additional parameters: queue name (useful, when there are different queues started by the same account), poll period (default 15 seconds)


101 -> activequeue{agents@domain,support}#postmaster@localhost
102 -> activequeue{salesgroup@domain,sales,10}#postmaster@localhost
