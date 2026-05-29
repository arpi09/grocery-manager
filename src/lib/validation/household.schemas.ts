import { z } from 'zod';

export const createHouseholdInviteSchema = z.object({
	email: z.string().email('Ange en giltig e-postadress'),
	role: z.enum(['editor', 'viewer'])
});

export const updateMemberRoleSchema = z.object({
	userId: z.string().min(1),
	role: z.enum(['owner', 'editor', 'viewer'])
});

export const removeMemberSchema = z.object({
	userId: z.string().min(1)
});

export const revokeInviteSchema = z.object({
	inviteId: z.string().min(1)
});
