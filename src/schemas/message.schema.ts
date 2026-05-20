import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ default: 1 })
  msgtype: number; // 1: contact || 2: report(ads)

  @Prop({ default: 1 })
  status: number; // 1: unread || 2: read

  @Prop({ type: MongooseSchema.Types.ObjectId })
  objID: MongooseSchema.Types.ObjectId; // _id of object (post_id)

  @Prop({ default: 0 })
  type: number; // issue type for message

  @Prop({ default: '' })
  title: string;

  @Prop({ default: '' })
  content: string;

  @Prop({ type: [String], default: [] })
  image: string[];

  @Prop({ default: '' })
  link: string;

  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop({
    type: {
      name: { type: String, default: 'Chợ nhanh 24h' },
      email: String,
      title: String,
      content: String,
    },
    default: {},
  })
  reply: {
    name: string;
    email: string;
    title: string;
    content: string;
  };
}

export const MessageSchema = SchemaFactory.createForClass(Message);
