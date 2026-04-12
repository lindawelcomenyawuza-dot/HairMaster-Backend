// graphql/queries/posts.js
import { GraphQLList } from "graphql";
import Post from "../../models/Post.js";
import { PostType } from "../types/PostType.js";

export const PostQueries = {
  posts: {
    type: new GraphQLList(PostType),
    async resolve() {
      return await Post.find().sort({ createdAt: -1 });
    },
  },
};