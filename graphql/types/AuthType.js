// graphql/types/AuthType.js
import { GraphQLObjectType, GraphQLString } from "graphql";
import { UserType } from "./UserType.js";

export const AuthType = new GraphQLObjectType({
  name: "Auth",
  fields: () => ({
    token: { type: GraphQLString },
    user: { type: UserType },
  }),
});