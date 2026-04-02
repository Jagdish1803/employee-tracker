const { z } = require('zod');

const leadCaptureSchema = z.object({
  checkId: z.string().uuid('Invalid check ID'),
  email: z.string().email('Invalid email address').optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-().]{7,20}$/, 'Invalid phone number')
    .optional(),
  name: z.string().max(100).optional(),
  company: z.string().max(200).optional(),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone is required',
});

const updateLeadSchema = z.object({
  leadStatus: z.enum(['cold', 'warm', 'hot', 'contacted', 'won', 'lost']).optional(),
  assignedTo: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  nextFollowUpAt: z.string().datetime().optional(),
  conversionValue: z.number().positive().optional(),
});

const bookConsultationSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  preferredTime: z.string().min(1, 'Preferred time is required'),
  message: z.string().max(1000).optional(),
});

const trackEventSchema = z.object({
  event: z.string().min(1).max(100),
  checkId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  sessionId: z.string().max(100).optional(),
  data: z.record(z.unknown()).optional(),
});

module.exports = {
  leadCaptureSchema,
  updateLeadSchema,
  bookConsultationSchema,
  trackEventSchema,
};
