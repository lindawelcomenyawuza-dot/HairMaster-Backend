// graphql/schema.js
import { GraphQLSchema, GraphQLObjectType } from "graphql";
import { RootQuery } from "./queries/index.js";
import { AuthMutations } from "./mutations/auth.js";

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    ...AuthMutations,
  },
});

export default new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});