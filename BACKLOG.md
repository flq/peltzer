# Backlog

## To Do

- [ ] Query history
- [ ] Apply changes to window title
- [ ] Connections to Cosmos DB as first-class citizen
- [ ] Ability to state what graphson version to use when deserializing results in the connection definition
- [ ] CosmosDB Gremlin Backend Connection: The gremlin-client crate hardcodes WebSocket path to /gremlin, but CosmosDB requires /. Options: (1) Fork gremlin-client and add path() builder method, (2) Use tokio-tungstenite directly for CosmosDB connections, (3) Contribute upstream PR. Until resolved, CosmosDB connections will show 'not yet supported' error.

## Done

