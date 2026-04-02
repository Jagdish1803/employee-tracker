const { z } = require('zod');

const rankCheckSchema = z.object({
  keyword: z
    .string()
    .min(1, 'Keyword is required')
    .max(200, 'Keyword must be 200 characters or less')
    .trim(),
  domain: z
    .string()
    .min(1, 'Domain is required')
    .max(253, 'Domain must be 253 characters or less')
    .trim()
    .transform((val) => val.replace(/^https?:\/\//, '').replace(/\/$/, '')),
  location: z
    .string()
    .max(100)
    .optional()
    .default('us'),
  device: z
    .enum(['desktop', 'mobile'])
    .optional()
    .default('desktop'),
});

module.exports = { rankCheckSchema };
