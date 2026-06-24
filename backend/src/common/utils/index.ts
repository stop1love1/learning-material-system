import { BadRequestException } from '@nestjs/common';
import mongoose from 'mongoose';
import { Pagination } from '../types';

/** Chuỗi → ObjectId (ném BadRequest nếu không hợp lệ). Tái dùng từ reference. */
export const convertStringToObjectId = (value: string) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new BadRequestException('Invalid ObjectId');
  }
  return new mongoose.Types.ObjectId(value);
};

/** Chuẩn hóa keyword/page/pageSize với mặc định an toàn. */
export const getPagination = (keyword?: string, page?: number, pageSize?: number) => {
  keyword = keyword || '';
  page = page ? Number(page) : 1;
  pageSize = pageSize ? Number(pageSize) : 10;
  page = page < 1 ? 1 : page;
  pageSize = pageSize < 1 ? 10 : pageSize;
  // Cap at 500 so unbounded ?pageSize= can't exhaust memory on @Public lists.
  // 500 keeps headroom over the 200 the frontend loaders legitimately request.
  pageSize = Math.min(pageSize, 500);
  return { keyword, page, pageSize };
};

/** Dựng envelope phân trang. */
export const buildPagination = <T>(records: T[], total: number, page: number, pageSize: number): Pagination<T> => {
  const pages = Math.ceil(total / pageSize);
  return {
    records,
    total,
    pages,
    pageSize,
    current: page,
    hasNextPage: page < pages,
    hasPreviousPage: page > 1,
  };
};

/** Escape regex để dùng keyword trong $regex. */
export const parseKeyword = (input: unknown): string | undefined => {
  const s = (input ?? '').toString().trim();
  if (!s) return undefined;
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const parseNumber = (input: unknown): number | null => {
  if (typeof input === 'number') return input;
  if (typeof input !== 'string') return null;
  const parsed = parseFloat(input.replace(/,/g, '').trim());
  return isNaN(parsed) ? null : parsed;
};

export const parseBoolean = (input: unknown, defaultValue = false): boolean => {
  if (typeof input === 'boolean') return input;
  if (typeof input !== 'string') return defaultValue;
  return input.toLowerCase() === 'true';
};

export const parseDate = (input: unknown): Date | null => {
  if (input instanceof Date) return input;
  if (typeof input !== 'string') return null;
  const parsed = new Date(input.trim());
  return isNaN(parsed.getTime()) ? null : parsed;
};
