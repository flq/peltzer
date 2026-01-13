## 13.01.26, different DB connection forms

For future requirements and as user I would like to be given a choice when adding a connection.
- This needs extending the format the connection is stored. It'll need a type which can be "Standard", "Cosmos" for now.
  Consider using a discriminated union, but we need to think how the transmit the values to the rust backend.
  (the type will help when you choose "Edit" on an existing connection)
- Refactor the connection form to delegate to Field collections specific to the kind of connection me as a user wants to create.
- Each of those Forms would raise an event (remember the new style of svelte events, there is prior art) that offers the completed config
  for the connection. Test / Save is still responsibility of the ConnectionForm.
  The ConnectionForm is empty on creating a new connection and first provides two buttons "Standard", "Cosmos". Note that on each case we can
  tailor the fields shown exactly to our needs, ie Standard is like now, while Cosmos requires you to enter endpoint, Db, Container and
  Secret (SSL is a must, and the port is also not changeable, we can encode that internally)
- I would like the translation of provided config values to the actual connection to happen in the rust backend. Question: How to give
  discriminated values to the rust backend?
- If something is unclear with regard to code placement, ask me