# Peltzer

Randall Peltzer was the dude that found Mogwai, who was then father to many gremlins. Goddit?

## How to run the app in development

### 1. Start the database

```bash
npm run db:start
```

This starts a TinkerPop Gremlin Server in Docker on port 8182.

### 2. Start the app

```bash
npm run tauri dev
```

### 3. Create a connection

In the app, create a new connection with these parameters:

| Parameter | Value |
|-----------|-------|
| Host | `localhost` |
| Port | `8182` |
| SSL | Off |
| Authentication | None |

### 4. Try a query

Once connected, try a simple query:

```groovy
g.V().limit(5)
```

The TinkerPop server starts with an empty graph, so you can add some test data:

```groovy
g.addV('person').property('name', 'Alice')
g.addV('person').property('name', 'Bob')
g.V().hasLabel('person').values('name')
```

## Debugging the Rust backend

Tauri apps have two parts: the frontend (WebView) and the Rust backend. When you debug just the Rust binary without the frontend running, you get an empty window.

To debug the Rust backend with your IDE:

### 1. Start the frontend dev server

```bash
npm run dev
```

This starts Vite on `http://localhost:1420`.

### 2. Configure your IDE

In your IDE's run/debug configuration, set the environment variable:

```
TAURI_DEV_SERVER_URL=http://localhost:1420
```

### 3. Debug the Rust binary

Now run/debug the Rust binary (`src-tauri/src/main.rs`). The app will load the frontend from the dev server, and you can set breakpoints in the Rust code.

For quick debugging without an IDE, add `println!` or `dbg!` macros to your Rust code - output appears in the terminal running `npm run tauri dev`.

## Build OSX app

```
npm run tauri build -- --bundles app
```