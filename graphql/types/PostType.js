// graphql/types/PostType.js
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
} from "graphql";

export const PostType = new GraphQLObjectType({
  name: "Post",
  fields: () => ({
    id: { type: GraphQLString },
    userId: { type: GraphQLString },
    userName: { type: GraphQLString },
    userAvatar: { type: GraphQLString },
    accountType: { type: GraphQLString },

    image: { type: GraphQLString },
    styleName: { type: GraphQLString },
    barberName: { type: GraphQLString },
    barberShop: { type: GraphQLString },
    location: { type: GraphQLString },

    price: { type: GraphQLInt },
    currency: { type: GraphQLString },

    rating: { type: GraphQLInt },
    likes: { type: GraphQLInt },
    isLiked: { type: GraphQLBoolean },
    isSaved: { type: GraphQLBoolean },

    description: { type: GraphQLString },
    gender: { type: GraphQLString },

    hashtags: { type: new GraphQLList(GraphQLString) },
  }),
});