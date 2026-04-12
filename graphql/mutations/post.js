// graphql/mutations/post.js
import { GraphQLString, GraphQLInt } from "graphql";
import Post from "../../models/Post.js";
import { PostType } from "../types/PostType.js";

export const PostMutations = {
  createPost: {
    type: PostType,
    args: {
      userId: { type: GraphQLString },
      userName: { type: GraphQLString },
      userAvatar: { type: GraphQLString },

      image: { type: GraphQLString },
      styleName: { type: GraphQLString },
      barberName: { type: GraphQLString },
      location: { type: GraphQLString },

      price: { type: GraphQLInt },
      description: { type: GraphQLString },
      gender: { type: GraphQLString },
    },

    async resolve(_, args) {
      const post = await Post.create({
        ...args,
        likes: 0,
        rating: 0,
      });

      return post;
    },
  },
  toggleLike: {
  type: PostType,
  args: {
    postId: { type: GraphQLString },
  },

  async resolve(_, { postId }) {
    const post = await Post.findById(postId);

    if (!post) throw new Error("Post not found");

    post.likes = (post.likes || 0) + 1;

    await post.save();

    return post;
  },
},
};