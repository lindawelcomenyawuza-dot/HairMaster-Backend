// graphql/queries/index.js
import { GraphQLObjectType } from "graphql";
import { UserType } from "../types/UserType.js";
import { verifyToken } from "../../utils/token.js";
import User from "../../models/User.js";

export const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    hello: {
      type: UserType,
      resolve() {
        return null;
      },
    },

    me: {
      type: UserType,
      async resolve(_, __, { req }) {
        const auth = req.headers.authorization;
        if (!auth) throw new Error("No token");

        const token = auth.split(" ")[1];
        const decoded = verifyToken(token);

        return await User.findById(decoded.id);
      },
    },
  },
});