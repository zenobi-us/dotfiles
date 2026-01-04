declare module "@evan/duckdb" {
  export function open(path: string): Database;

  interface Database {
    connect(): Connection;
    close(): void;
  }

  interface Connection {
    query<T = unknown>(sql: string): T[];
    stream(sql: string): unknown;
    close(): void;
    prepare(sql: string): unknown;
  }
}
