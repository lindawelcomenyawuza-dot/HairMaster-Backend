// graphql/schema.js
import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { AuthMutations } from "./mutations/auth.js";
import { PostMutations } from "./mutations/post.js";
import { PostQueries } from "./queries/posts.js";
import { RootQuery } from "./queries/index.js";

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    ...AuthMutations,
    ...PostMutations,
  },
});

const Query = new GraphQLObjectType({
  name: "Query",
  fields: {
    ...RootQuery.fields,
    ...PostQueries,
  },
});

export default new GraphQLSchema({
  query: Query,
  mutation: Mutation,
});