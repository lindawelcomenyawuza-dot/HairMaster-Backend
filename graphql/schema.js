import { GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    hello: {
      type: GraphQLString,
      resolve() {
        return "Hello from HairMaster API!";
      }
    }
  }
});

export default new GraphQLSchema({
  query: RootQuery
});