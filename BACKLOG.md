# Backlog

## To Do
- [ ] History / Tab. While using a Tab Ctrl+Arrow up goes back to the last query ran.
- [ ] React to selection and execute only the selected part.
- [ ] Save & Load queries to files - Two buttons (Open/Save) to persist queries as plain text .gremlin files. Store in the app data folder alongside connections.json (~Library/Application Support/com.peltzer.app/ on macOS). Default filename based on current date/time (e.g. query-2026-01-20-143052.gremlin).
- [ ] In query & results pane, clicking into a value in quotes selects the whole value, ready for copying

## Done

- [x] Secure credential storage with PIN - Credentials encrypted with AES-256-GCM in Rust backend, key derived via PBKDF2 from user PIN + hardcoded seed. User opts in per connection with "Secure storage" checkbox.
- [x] Multi-Tabbed Query & Results. Allows to have multiple tabs with different queries and results
- [x] Apply changes to window title
- [x] Connections to Cosmos DB as first-class citizen
- [x] CosmosDB Gremlin Backend Connection: Forked gremlin-client to add path() builder method and handle plain JSON types in GraphSON v2 deserializer

