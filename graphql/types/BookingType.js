// graphql/type/BookingType.js
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLFloat,
  GraphQLBoolean,
} from "graphql";

export const BookingType = new GraphQLObjectType({
  name: "Booking",
  fields: () => ({
    id: { type: GraphQLID },
    userId: { type: GraphQLString },
    postId: { type: GraphQLString },

    styleName: { type: GraphQLString },
    barberName: { type: GraphQLString },
    location: { type: GraphQLString },

    price: { type: GraphQLFloat },
    currency: { type: GraphQLString },

    depositAmount: { type: GraphQLFloat },
    depositPaid: { type: GraphQLBoolean },

    date: { type: GraphQLString },
    time: { type: GraphQLString },

    status: { type: GraphQLString },

    paymentMethod: { type: GraphQLString },
    paymentStatus: { type: GraphQLString },
  }),
});