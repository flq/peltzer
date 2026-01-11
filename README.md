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

## Build OSX app

```
npm run tauri build -- --bundles app
```