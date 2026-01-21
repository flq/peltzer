# Backlog

## To Do
- [ ] History / Tab. While using a Tab Ctrl+Arrow up goes back to the last query ran.
- [ ] React to selection and execute only the selected part.
- [ ] Save & Load queries to files - Two buttons (Open/Save) to persist queries as plain text .gremlin files. Store in the app data folder alongside connections.json (~Library/Application Support/com.peltzer.app/ on macOS). Default filename based on current date/time (e.g. query-2026-01-20-143052.gremlin).
- [ ] In query & results pane, clicking into a value in quotes selects the whole value, ready for copying
- [ ] Secure credential storage using OS keychain (Step 1) - Use the keyring crate directly in Rust backend to store passwords/keys in macOS Keychain and Windows Credential Manager. Current state: connections.json stores credentials in plaintext at ~/Library/Application Support/com.peltzer.app/. Plan: store only non-sensitive metadata in JSON, look up secrets from keychain using connection name as key (service: "com.peltzer.app", account: "{connection-name}"). See: https://crates.io/crates/keyring
- [ ] Biometric authentication on app launch (Step 2) - Require Touch ID / Windows Hello when opening the app before credentials can be accessed. Needs research into platform-specific keychain access control flags (macOS: kSecAccessControlBiometryCurrentSet) or dedicated biometric APIs. Alternative: tauri-plugin-biometry (https://crates.io/crates/tauri-plugin-biometry) - third-party plugin that combines encrypted storage + biometric gating for macOS/Windows/iOS/Android. Recently updated. Could replace both steps if we're comfortable with the dependency.

## Done

- [x] Multi-Tabbed Query & Results. Allows to have multiple tabs with different queries and results
- [x] Apply changes to window title
- [x] Connections to Cosmos DB as first-class citizen
- [x] CosmosDB Gremlin Backend Connection: Forked gremlin-client to add path() builder method and handle plain JSON types in GraphSON v2 deserializer

