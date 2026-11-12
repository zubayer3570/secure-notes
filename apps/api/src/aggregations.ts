import { Types, type PipelineStage } from 'mongoose';
import { skipFor, toPage, type PageQuery } from './lib/pagination.js';
import { Post } from './models/post.js';
import { User } from './models/user.js';

type UserRef = { _id: Types.ObjectId; name: string };
type InterestGroup = { interest: string; count: number; users: UserRef[] };
type Counted = { count: number }[];

const countOf = (counted: Counted) => counted[0]?.count ?? 0;

export function interestGroupsPipeline(query: PageQuery, usersLimit: number): PipelineStage[] {
  return [
    { $match: { interests: { $gte: '' } } },
    { $project: { name: 1, interests: 1 } },
    { $unwind: '$interests' },
    {
      $group: {
        _id: '$interests',
        count: { $sum: 1 },
        users: { $topN: { n: usersLimit, sortBy: { name: 1, _id: 1 }, output: { _id: '$_id', name: '$name' } } },
      },
    },
    {
      $facet: {
        items: [
          { $sort: { _id: 1 } },
          { $skip: skipFor(query) },
          { $limit: query.limit },
          { $project: { _id: 0, interest: '$_id', count: 1, users: 1 } },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ];
}

export async function usersGroupedByInterest(query: PageQuery, usersLimit: number) {
  const [result] = await User.aggregate<{ items: InterestGroup[]; total: Counted }>(
    interestGroupsPipeline(query, usersLimit),
  );
  return toPage(result.items, countOf(result.total), query);
}

type UserWithPosts = UserRef & {
  posts: { _id: Types.ObjectId; title: string; body: string; createdAt: Date; updatedAt: Date }[];
  postCount: Counted;
};

export function userPostsPipeline(userId: Types.ObjectId, query: PageQuery): PipelineStage[] {
  const join = { from: Post.collection.name, localField: '_id', foreignField: 'author' };
  return [
    { $match: { _id: userId } },
    { $project: { name: 1 } },
    {
      $lookup: {
        ...join,
        as: 'posts',
        pipeline: [
          { $sort: { _id: -1 } },
          { $skip: skipFor(query) },
          { $limit: query.limit },
          { $project: { author: 0 } },
        ],
      },
    },
    { $lookup: { ...join, as: 'postCount', pipeline: [{ $count: 'count' }] } },
  ];
}

export async function postsOfUser(userId: Types.ObjectId, query: PageQuery) {
  const [user] = await User.aggregate<UserWithPosts>(userPostsPipeline(userId, query));
  if (!user) return null;
  return { author: { _id: user._id, name: user.name }, ...toPage(user.posts, countOf(user.postCount), query) };
}
