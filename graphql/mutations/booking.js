// graphql/mutations/booking.js
import { GraphQLString, GraphQLFloat, GraphQLBoolean } from "graphql";
import Booking from "../../models/Booking.js";
import { verifyToken } from "../../utils/token.js";
import { BookingType } from "../types/BookingType.js";

export const BookingMutations = {
  createBooking: {
    type: BookingType,

    args: {
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

      paymentMethod: { type: GraphQLString },
      paymentStatus: { type: GraphQLString },
    },

    async resolve(_, args, { req }) {
      const auth = req.headers.authorization;
      if (!auth) throw new Error("Not authenticated");

      const token = auth.split(" ")[1];
      const decoded = verifyToken(token);

      const booking = await Booking.create({
        clientId: decoded.id,
        businessId: args.businessId,
        ...args,
      });

      return booking;
    },
  },
};