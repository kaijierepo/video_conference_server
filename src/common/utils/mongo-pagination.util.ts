import { Model } from 'mongoose';
import { PaginationParams } from '../interfaces/pagination.interface';

export class MongoPagination {
  static async paginate(
    model: Model<any>,
    query: any,
    { page = 1, limit = 10 }: PaginationParams,
    options: any = {},
  ) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      model.find(query, null, { ...options, skip, limit }),
      model.countDocuments(query),
    ]);

    return {
      list: data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
