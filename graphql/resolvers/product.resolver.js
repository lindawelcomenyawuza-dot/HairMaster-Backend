import User from '../../models/User.js';
import Product from '../../models/Product.js';
import { getUser, requireAuth } from '../../middleware/auth.js';
import { getPublicMediaUrl } from '../../utils/media.js';
import { formatProduct } from './shared.js';

export const resolvers = {
  businessProducts: async ({ businessId }) => {
    const products = await Product.find({ businessId }).sort({ createdAt: -1 });
    return products.map(formatProduct);
  },

  myProducts: async (_, { req }) => {
    const authUser = requireAuth(getUser(req));
    const products = await Product.find({ businessId: authUser.id }).sort({ createdAt: -1 });
    return products.map(formatProduct);
  },

  createProduct: async (args, { req }) => {
    const authUser = requireAuth(getUser(req));
    const user = await User.findById(authUser.id);
    if (!user || user.accountType !== 'business') {
      throw new Error('Only business accounts can create products');
    }
    const product = new Product({
      ...args,
      images: (args.images || []).map(getPublicMediaUrl),
      businessId: authUser.id,
      deliveryAvailable: args.deliveryAvailable ?? false,
    });
    await product.save();
    return formatProduct(product);
  },

  updateProduct: async ({ id, ...updates }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const product = await Product.findOne({ _id: id, businessId: authUser.id });
    if (!product) throw new Error('Product not found');
    if (updates.images) updates.images = updates.images.map(getPublicMediaUrl);
    Object.assign(product, updates);
    await product.save();
    return formatProduct(product);
  },

  deleteProduct: async ({ id }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const result = await Product.deleteOne({ _id: id, businessId: authUser.id });
    return result.deletedCount > 0;
  },
};
