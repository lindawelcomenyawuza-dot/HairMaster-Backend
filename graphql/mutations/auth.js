// graphql/mutations/auth.js
import { GraphQLString } from "graphql";

import User from "../../models/User.js";
import { UserType } from "../types/UserType.js";
import { AuthType } from "../types/AuthType.js";

import { hashPassword, comparePassword } from "../../utils/hash.js";
import { generateToken } from "../../utils/token.js";

export const AuthMutations = {
  register: {
    type: AuthType,

    args: {
      name: { type: GraphQLString },
      email: { type: GraphQLString },
      password: { type: GraphQLString },
    },

    async resolve(_, args) {
      const { name, email, password } = args;

      const existing = await User.findOne({ email });
      if (existing) throw new Error("User already exists");

      const hashed = await hashPassword(password);

      const user = await User.create({
        name,
        email,
        password: hashed,
      });

      const token = generateToken(user);

      return {
        token,
        user,
      };
    },
  },

  login: {
    type: AuthType,

    args: {
      email: { type: GraphQLString },
      password: { type: GraphQLString },
    },

    async resolve(_, { email, password }) {
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found");

      const valid = await comparePassword(password, user.password);
      if (!valid) throw new Error("Invalid password");

      const token = generateToken(user);

      return {
        token,
        user,
      };
    },
  },
};