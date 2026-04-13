// graphql/queries/bookings.js
import { GraphQLList } from "graphql";
import Booking from "../../models/Booking.js";
import { BookingType } from "../types/BookingType.js";

export const BookingQueries = {
  bookings: {
    type: new GraphQLList(BookingType),

    async resolve(_, __, { req }) {
      if (!req.user) throw new Error("Unauthorized");

      return await Booking.find({ userId: req.user.id });
    },
  },
};