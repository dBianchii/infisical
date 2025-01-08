import { Knex } from "knex";

import { TableName, UserSecretType } from "../schemas";
import { createOnUpdateTrigger, dropOnUpdateTrigger } from "../utils";

export async function up(knex: Knex): Promise<void> {
  const doesUserSecretTableExist = await knex.schema.hasTable(TableName.UserSecrets);
  if (!doesUserSecretTableExist) {
    await knex.schema.createTable(TableName.UserSecrets, (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.string("itemName").notNullable();
      t.string("type").notNullable().defaultTo(UserSecretType.Login);
      t.binary("encryptedJSONData").notNullable();
      t.uuid("userId");
      t.foreign("userId").references("id").inTable(TableName.Users).onDelete("CASCADE");
      // t.uuid("folderId").notNullable(); //TODO: Folders ?
      // t.foreign("folderId").references("id").inTable(TableName.SecretFolder).onDelete("CASCADE");
      t.timestamps(true, true, true);
      t.index(["userId"]);
    });
  }
  await createOnUpdateTrigger(knex, TableName.UserSecrets);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TableName.UserSecrets);
  await dropOnUpdateTrigger(knex, TableName.UserSecrets);
}
