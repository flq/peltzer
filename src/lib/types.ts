export interface StandardConnectionConfig {
  type: "standard";
  name: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  use_ssl: boolean;
}

export interface CosmosConnectionConfig {
  type: "cosmos";
  name: string;
  endpoint: string;
  database: string;
  container: string;
  key: string;
}

export type ConnectionConfig = StandardConnectionConfig | CosmosConnectionConfig;

export function getName(connection: ConnectionConfig): string {
  switch (connection.type) {
    case "standard":
      return `${connection.host}:${connection.port}`;
    case "cosmos":
      return `${connection.endpoint}/${connection.database}`;
  }
}