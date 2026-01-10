export interface ConnectionConfig {
  name: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  use_ssl: boolean;
}
