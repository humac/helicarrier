export type V3Config = {
  dbPath: string;
  enableSqlite: boolean;
  enableJsonImport: boolean;
  contractStrict: boolean;
};

export function getV3Config(): V3Config {
  const dbPath = process.env.HELICARRIER_DB_PATH?.trim() || `${process.cwd()}/data/helicarrier.sqlite`;
  return {
    dbPath,
    enableSqlite: process.env.HELICARRIER_ENABLE_SQLITE === "true",
    enableJsonImport: process.env.HELICARRIER_ENABLE_JSON_IMPORT === "true",
    contractStrict: process.env.HELICARRIER_CONTRACT_STRICT !== "false",
  };
}
