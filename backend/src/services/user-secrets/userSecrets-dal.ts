import { Knex } from "knex";
import { validate as uuidValidate } from "uuid";

import { TDbClient } from "@app/db";
import { TableName } from "@app/db/schemas";
import { DatabaseError } from "@app/lib/errors";
import { ormify, selectAllTableCols } from "@app/lib/knex";
import { OrderByDirection } from "@app/lib/types";

import { UserSecretsOrderBy } from "./userSecrets-types";

export type TSecretDALFactory = ReturnType<typeof userSecretsDALFactory>;

export const userSecretsDALFactory = (db: TDbClient) => {
  const secretOrm = ormify(db, TableName.UserSecrets);

  const countSecrets = async (userId?: string, tx?: Knex) => {
    try {
      const query = (tx || db.replicaNode())(TableName.UserSecrets)
        .where((bd) => {
          void bd.whereNull("userId").orWhere({ userId: userId || null });
        })
        .countDistinct("id");
      const secrets = await query;

      return Number(secrets[0]?.count ?? 0);
    } catch (error) {
      throw new DatabaseError({ error, name: "get user secret count" });
    }
  };

  const findSecrets = async (
    userId?: string,
    filters?: {
      limit?: number;
      offset?: number;
      orderBy?: UserSecretsOrderBy;
      orderDirection?: OrderByDirection;
    },
    tx?: Knex
  ) => {
    try {
      // check if not uui then userId id is null (corner case because service token's ID is not UUI in effort to keep backwards compatibility from mongo)
      if (userId && !uuidValidate(userId)) {
        // eslint-disable-next-line no-param-reassign
        userId = undefined;
      }

      const query = (tx || db.replicaNode())(TableName.UserSecrets)
        .where((bd) => {
          void bd.whereNull(`${TableName.UserSecrets}.userId`).orWhere({ userId: userId || null });
        })
        .select(
          selectAllTableCols(TableName.UserSecrets),
          db.raw(`DENSE_RANK() OVER (ORDER BY "itemName" ${filters?.orderDirection ?? OrderByDirection.ASC}) as rank`)
        )
        .orderBy(
          filters?.orderBy === UserSecretsOrderBy.ItemName ? "itemName" : "id",
          filters?.orderDirection ?? OrderByDirection.ASC
        );

      let secs: Awaited<typeof query>;

      if (filters?.limit) {
        const rankOffset = (filters?.offset ?? 0) + 1; // ranks start at 1
        secs = await (tx || db)
          .with("w", query)
          .select("*")
          .from<Awaited<typeof query>[number]>("w")
          .where("w.rank", ">=", rankOffset)
          .andWhere("w.rank", "<", rankOffset + filters.limit);
      } else {
        secs = await query;
      }

      return secs;
    } catch (error) {
      throw new DatabaseError({ error, name: "get all user secrets" });
    }
  };

  return {
    ...secretOrm,
    countSecrets,
    findSecrets
  };
};
