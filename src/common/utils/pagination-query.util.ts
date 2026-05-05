import { BadRequestException } from '@nestjs/common';

export const MAX_PAGINATION_LIMIT = 100;

export const parseSkipQuery = (skip?: string, defaultSkip: number = 0): number => {
  if (skip === undefined) {
    return defaultSkip;
  }

  const parsedSkip = Number.parseInt(skip, 10);
  if (Number.isNaN(parsedSkip) || parsedSkip < 0) {
    throw new BadRequestException('پارامتر skip باید یک عدد صحیح بزرگتر یا مساوی صفر باشد');
  }

  return parsedSkip;
};

export const parseLimitQuery = (limit?: string, defaultLimit: number = 20): number => {
  if (limit === undefined) {
    return defaultLimit;
  }

  const parsedLimit = Number.parseInt(limit, 10);
  if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > MAX_PAGINATION_LIMIT) {
    throw new BadRequestException(`پارامتر limit باید بین 1 تا ${MAX_PAGINATION_LIMIT} باشد`);
  }

  return parsedLimit;
};