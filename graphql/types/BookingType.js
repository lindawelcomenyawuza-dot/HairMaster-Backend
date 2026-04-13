// graphql/type/BookingType.js
// graphql/types/BookingType.js
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLFloat,
  GraphQLBoolean,
} from "graphql";

export const BookingType = new GraphQLObjectType({
  name: "Booking",
  fields: () => ({
    id: { type: GraphQLString },

    clientId: { type: GraphQLString },
    businessId: { type: GraphQLString },
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