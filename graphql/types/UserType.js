// graphql/types/UserType.js
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
} from "graphql";

export const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: {
      type: GraphQLID,
      resolve: (parent) => parent._id.toString(), // 🔥 FIX
    },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    token: { type: GraphQLString },
  }),
});