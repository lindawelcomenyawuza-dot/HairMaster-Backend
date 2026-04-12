// graphql/types/UserType.js
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
} from "graphql";

export const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    accountType: { type: GraphQLString },
    avatar: { type: GraphQLString },
    bio: { type: GraphQLString },

    followers: { type: GraphQLInt },
    following: { type: GraphQLInt },

    location: { type: GraphQLString },
    country: { type: GraphQLString },
    currency: { type: GraphQLString },

    businessName: { type: GraphQLString },

    posts: { type: GraphQLInt },
    totalSpent: { type: GraphQLInt },
    discountTokens: { type: GraphQLInt },

    token: { type: GraphQLString }, // for auth
  }),
});