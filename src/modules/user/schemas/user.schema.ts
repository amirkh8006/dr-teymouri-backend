import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Role } from '../../role/schemas/role.schema';
import { EducationLevel, HousingStatus, JobStatus, MaritalStatus, MealType } from '../user-profile.constants';

@Schema({ _id: false, versionKey: false })
export class FoodPreferenceItem {
  @Prop({ required: true, trim: true })
  foodType?: string;

  @Prop({ default: false })
  consumes?: boolean;
}

export const FoodPreferenceItemSchema = SchemaFactory.createForClass(FoodPreferenceItem);

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, versionKey: false })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  phoneNumber?: string;

  @Prop({ trim: true })
  mobilePhone?: string;

  @Prop({ default: true })
  isActive?: boolean;

  @Prop({ default: false })
  isCompleted?: boolean;

  @Prop()
  password?: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  birthDate?: string;

  @Prop({ type: String, enum: Object.values(MaritalStatus) })
  maritalStatus?: MaritalStatus;

  @Prop({ type: String, enum: Object.values(EducationLevel) })
  educationLevel?: EducationLevel;

  @Prop()
  occupation?: string;

  @Prop()
  visitDate?: string;

  @Prop()
  referralSource?: string;

  @Prop()
  nationalId?: string;

  @Prop()
  manualFileNumber?: string;

  @Prop()
  referrer?: string;

  @Prop()
  groceryBuyer?: string;

  @Prop()
  cookName?: string;

  @Prop({ type: String, enum: Object.values(JobStatus) })
  jobStatus?: JobStatus;

  @Prop({ type: String, enum: Object.values(HousingStatus) })
  housingStatus?: HousingStatus;

  @Prop({ type: [String], enum: Object.values(MealType), default: [] })
  mealsConsumedAtHome?: MealType[];

  @Prop({ type: [String], enum: Object.values(MealType), default: [] })
  removedMeals?: MealType[];

  @Prop()
  address?: string;

  @Prop()
  landlinePhone?: string;

  @Prop({ type: [FoodPreferenceItemSchema], default: [] })
  foodPreferences?: FoodPreferenceItem[];

  @Prop({ type: Types.ObjectId, ref: Role.name })
  role?: Role | Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
