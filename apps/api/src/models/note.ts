import { model, Schema, type InferSchemaType } from 'mongoose';

const noteSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, default: '', maxlength: 20000 },
  },
  { timestamps: true, versionKey: false },
);

noteSchema.index({ owner: 1, _id: -1 });

export type NoteDoc = InferSchemaType<typeof noteSchema>;
export const Note = model('Note', noteSchema);
