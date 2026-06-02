import { z } from 'zod';

export const createHouseholdInviteSchema = z.object({
	email: z.string().email('Ange en giltig e-postadress'),
	role: z.enum(['editor', 'viewer'])
});

export const createHouseholdSchema = z.object({
	name: z.string().trim().min(1, 'Ange ett namn').max(80, 'Namnet är för långt')
});

export const updateHouseholdSchema = z.object({
	name: z.string().trim().min(1, 'Ange ett namn').max(80, 'Namnet är för långt')
});

export const createShareInviteSchema = z.object({
	role: z.enum(['editor', 'viewer'])
});

export const switchHouseholdSchema = z.object({
	householdId: z.string().min(1, 'Ogiltig pantry')
});

export const leaveHouseholdSchema = z.object({
	householdId: z.string().min(1, 'Ogiltig pantry')
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

export const deleteHouseholdSchema = z.object({
	householdId: z.string().min(1, 'Ogiltig pantry'),
	confirmName: z
		.string()
		.trim()
		.min(1, 'Skriv hushållets namn eller TA BORT för att bekräfta')
});
