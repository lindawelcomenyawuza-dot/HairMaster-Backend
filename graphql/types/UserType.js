// graphql/types/UserType.js
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
} from "graphql";

export const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    token: { type: GraphQLString },
  }),
});