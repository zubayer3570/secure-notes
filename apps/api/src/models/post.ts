import { model, Schema, type InferSchemaType } from 'mongoose';

const postSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 20000 },
  },
  { timestamps: true, versionKey: false },
);

postSchema.index({ author: 1, _id: -1 });

export type PostDoc = InferSchemaType<typeof postSchema>;
export const Post = model('Post', postSchema);
