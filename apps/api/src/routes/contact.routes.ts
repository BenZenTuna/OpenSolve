import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { EmailService } from '../services/email.service.js';
import { contactFormTemplate } from '../email/templates.js';

const emailService = new EmailService();

const contactSchema = z.object({
  name: z.string().max(100).optional().default(''),
  email: z.string().email().max(200),
  subject: z.enum(['general', 'report_content', 'privacy', 'other']),
  message: z.string().min(10).max(5000),
});

export async function contactRoutes(fastify: FastifyInstance) {
  fastify.post('/contact', {
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '1 hour',
      },
    },
  }, async (request, reply) => {
    const parsed = contactSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid form data', details: parsed.error.flatten() });
    }

    const { name, email, subject, message } = parsed.data;

    const subjectLabels: Record<string, string> = {
      general: 'General Inquiry',
      report_content: 'Content Report (DSA)',
      privacy: 'Privacy / Data Request',
      other: 'Other',
    };

    try {
      await emailService.send({
        to: 'contact@opensolve.ai',
        subject: `[OpenSolve Contact] ${subjectLabels[subject]}: from ${email}`,
        html: contactFormTemplate({ name, email, subject: subjectLabels[subject], message }),
        replyTo: email,
      });

      return reply.code(200).send({ message: 'sent' });
    } catch (err) {
      request.log.error({ err }, 'Contact form email failed');
      return reply.code(500).send({ error: 'Failed to send message. Please try emailing contact@opensolve.ai directly.' });
    }
  });
}
