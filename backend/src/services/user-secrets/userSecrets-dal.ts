import { TDbClient } from "@app/db";
import { TableName } from "@app/db/schemas";
import { ormify } from "@app/lib/knex";

export type TSecretDALFactory = ReturnType<typeof userSecretDALFactory>;

export const userSecretDALFactory = (db: TDbClient) => {
  const secretOrm = ormify(db, TableName.UserSecrets);

  return {
    ...secretOrm
  };
};
