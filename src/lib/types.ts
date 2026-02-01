export interface StandardConnectionConfig {
  type: "standard";
  name: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  use_ssl: boolean;
  secure_storage?: boolean;
}

export interface CosmosConnectionConfig {
  type: "cosmos";
  name: string;
  endpoint: string;
  database: string;
  container: string;
  key: string;
  secure_storage?: boolean;
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