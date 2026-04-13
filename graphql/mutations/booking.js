// graphql/mutations/booking.js
import { GraphQLNonNull, GraphQLString, GraphQLFloat, GraphQLBoolean } from "graphql";
import Booking from "../../models/Booking.js";
import { BookingType } from "../types/BookingType.js";
import { verifyToken } from "../../utils/token.js";

export const BookingMutations = {
  createBooking: {
    type: BookingType,

    args: {
      postId: { type: new GraphQLNonNull(GraphQLString) },

      styleName: { type: GraphQLString },
      barberName: { type: GraphQLString },
      location: { type: GraphQLString },

      price: { type: GraphQLFloat },
      currency: { type: GraphQLString },

      depositAmount: { type: GraphQLFloat },
      depositPaid: { type: GraphQLBoolean },

      date: { type: GraphQLString }, // ISO string
      time: { type: GraphQLString },

      paymentMethod: { type: GraphQLString },
      paymentStatus: { type: GraphQLString },
    },

    async resolve(_, args, { req }) {
      const auth = req.headers.authorization;
      if (!auth) throw new Error("Not authenticated");

      const token = auth.split(" ")[1];
      const decoded = verifyToken(token);

      const booking = new Booking({
        userId: decoded.id,

        postId: args.postId,
        styleName: args.styleName,
        barberName: args.barberName,
        location: args.location,

        price: args.price,
        currency: args.currency || "USD",

        depositAmount: args.depositAmount,
        depositPaid: args.depositPaid || false,

        date: args.date,
        time: args.time,

        status: "upcoming",

        paymentMethod: args.paymentMethod,
        paymentStatus: args.paymentStatus || "pending",
      });

      return await booking.save();
    },
  },
};