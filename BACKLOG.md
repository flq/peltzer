# Backlog

## To Do
- [ ] React to selection and execute only the selected part.
- [ ] In query & results pane, clicking into a valxue in quotes selects the whole value, ready for copying

## Done

- [x] Query history panel — slide-in aside (Ctrl+H), global, persisted, 50-entry dedup
- [x] Save & Load queries to files - Two buttons (Open/Save) to persist queries as plain text .gremlin files.
- [x] Secure credential storage with PIN - Credentials encrypted with AES-256-GCM in Rust backend, key derived via PBKDF2 from user PIN + hardcoded seed. User opts in per connection with "Secure storage" checkbox.
- [x] Multi-Tabbed Query & Results. Allows to have multiple tabs with different queries and results
- [x] Apply changes to window title
- [x] Connections to Cosmos DB as first-class citizen
- [x] CosmosDB Gremlin Backend Connection: Forked gremlin-client to add path() builder method and handle plain JSON types in GraphSON v2 deserializer

