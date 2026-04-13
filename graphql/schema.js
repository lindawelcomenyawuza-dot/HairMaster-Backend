// graphql/schema.js
import { GraphQLObjectType, GraphQLSchema } from "graphql";

import { AuthMutations } from "./mutations/auth.js";
import { PostMutations } from "./mutations/post.js";
import { BookingMutations } from "./mutations/booking.js";

import { PostQueries } from "./queries/posts.js";
import { BookingQueries } from "./queries/bookings.js";
import { RootQuery } from "./queries/index.js";

const Query = new GraphQLObjectType({
  name: "Query",
  fields: {
    ...RootQuery.fields,
    ...PostQueries,
    ...BookingQueries, 
  },
});

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    ...AuthMutations,
    ...PostMutations,
    ...BookingMutations,
  },
});

export default new GraphQLSchema({
  query: Query,
  mutation: Mutation,
});