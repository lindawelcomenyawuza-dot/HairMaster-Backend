import { buildSchema } from 'graphql';
import { typeDefs as userTypeDefs } from './typeDefs/user.type.js';
import { typeDefs as postTypeDefs } from './typeDefs/post.type.js';
import { typeDefs as businessTypeDefs } from './typeDefs/business.type.js';
import { typeDefs as bookingTypeDefs } from './typeDefs/booking.type.js';
import { typeDefs as chatTypeDefs } from './typeDefs/chat.type.js';
import { typeDefs as productTypeDefs } from './typeDefs/product.type.js';
import { queries as userQueries } from './queries/user.queries.js';
import { queries as postQueries } from './queries/post.queries.js';
import { queries as businessQueries } from './queries/business.queries.js';
import { queries as bookingQueries } from './queries/booking.queries.js';
import { queries as chatQueries } from './queries/chat.queries.js';
import { queries as productQueries } from './queries/product.queries.js';
import { mutations as userMutations } from './mutations/user.mutations.js';
import { mutations as postMutations } from './mutations/post.mutations.js';
import { mutations as businessMutations } from './mutations/business.mutations.js';
import { mutations as bookingMutations } from './mutations/booking.mutations.js';
import { mutations as chatMutations } from './mutations/chat.mutations.js';
import { mutations as productMutations } from './mutations/product.mutations.js';
import { resolvers as userResolvers } from './resolvers/user.resolver.js';
import { resolvers as postResolvers } from './resolvers/post.resolver.js';
import { resolvers as businessResolvers } from './resolvers/business.resolver.js';
import { resolvers as bookingResolvers } from './resolvers/booking.resolver.js';
import { resolvers as chatResolvers } from './resolvers/chat.resolver.js';
import { resolvers as productResolvers } from './resolvers/product.resolver.js';

const typeDefs = `
  ${userTypeDefs}
  ${postTypeDefs}
  ${businessTypeDefs}
  ${bookingTypeDefs}
  ${chatTypeDefs}
  ${productTypeDefs}

  type Query {
    ${userQueries}
    ${postQueries}
    ${businessQueries}
    ${bookingQueries}
    ${chatQueries}
    ${productQueries}
  }

  type Mutation {
    ${userMutations}
    ${postMutations}
    ${businessMutations}
    ${bookingMutations}
    ${chatMutations}
    ${productMutations}
  }
`;

export const root = {
  ...userResolvers,
  ...postResolvers,
  ...businessResolvers,
  ...bookingResolvers,
  ...chatResolvers,
  ...productResolvers,
};

for (const [name, resolver] of Object.entries(root)) {
  if (typeof resolver !== 'function') continue;
  if (['register', 'login', 'me', 'posts', 'post', 'userPosts', 'searchSalons', 'getSalonStaff', 'businessProducts', 'tokenTiers'].includes(name)) continue;
  root[name] = async (args, context) => {
    const auth = context?.req?.headers?.authorization || '';
    if (auth.startsWith('Bearer ')) {
      const { getUser } = await import('../middleware/auth.js');
      const User = (await import('../models/User.js')).default;
      const authUser = getUser(context.req);
      if (authUser) {
        const user = await User.findById(authUser.id).select('isVerified');
        if (user && !user.isVerified) throw new Error('Email verification required');
      }
    }
    return resolver(args, context);
  };
}

const schema = buildSchema(typeDefs);

export { typeDefs };
export default schema;
