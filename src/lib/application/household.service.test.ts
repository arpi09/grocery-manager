import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	AlreadyMemberError,
	HouseholdForbiddenError,
	HouseholdService,
	InviteEmailMismatchError,
	InviteExpiredError,
	InviteNotFoundError,
	LastOwnerError,
	PendingInviteExistsError
} from './household.service';
import type { IHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';

describe('HouseholdService', () => {
	let repository: IHouseholdRepository;
	let service: HouseholdService;

	beforeEach(() => {
		repository = {
			findPrimaryHouseholdIdForUser: vi.fn(),
			getHouseholdForUser: vi.fn(),
			createHousehold: vi.fn(),
			addMember: vi.fn(),
			hasMember: vi.fn(),
			getMemberRole: vi.fn(),
			countOwners: vi.fn(),
			findUserIdByEmail: vi.fn(),
			isMemberByEmail: vi.fn(),
			createInvite: vi.fn(),
			findInviteByToken: vi.fn(),
			findPendingInviteByEmail: vi.fn(),
			listPendingInvites: vi.fn(),
			acceptInvite: vi.fn(),
			revokePendingInvite: vi.fn(),
			updateMemberRole: vi.fn(),
			removeMember: vi.fn(),
			getInvitePreview: vi.fn()
		};
		service = new HouseholdService(repository);
	});

	it('creates invite when actor is owner', async () => {
		vi.mocked(repository.getMemberRole).mockResolvedValue('owner');
		vi.mocked(repository.isMemberByEmail).mockResolvedValue(false);
		vi.mocked(repository.findPendingInviteByEmail).mockResolvedValue(null);
		vi.mocked(repository.createInvite).mockResolvedValue({
			id: 'invite-1',
			householdId: 'household-1',
			email: 'guest@example.com',
			role: 'editor',
			token: 'token-abc',
			invitedByUserId: 'owner-1',
			status: 'pending',
			expiresAt: new Date('2026-06-01'),
			createdAt: new Date('2026-05-01')
		});
		vi.mocked(repository.listPendingInvites).mockResolvedValue([
			{
				id: 'invite-1',
				email: 'guest@example.com',
				role: 'editor',
				status: 'pending',
				expiresAt: new Date('2026-06-01'),
				createdAt: new Date('2026-05-01'),
				invitedByEmail: 'owner@example.com'
			}
		]);

		const result = await service.createInvite(
			'household-1',
			'owner-1',
			'Guest@Example.com',
			'editor'
		);

		expect(result.token).toBeTruthy();
		expect(result.invite.email).toBe('guest@example.com');
		expect(repository.createInvite).toHaveBeenCalledWith(
			expect.objectContaining({
				householdId: 'household-1',
				email: 'guest@example.com',
				role: 'editor',
				invitedByUserId: 'owner-1'
			})
		);
	});

	it('rejects invite creation from non-owner', async () => {
		vi.mocked(repository.getMemberRole).mockResolvedValue('editor');

		await expect(
			service.createInvite('household-1', 'editor-1', 'guest@example.com', 'viewer')
		).rejects.toBeInstanceOf(HouseholdForbiddenError);
	});

	it('rejects duplicate pending invite', async () => {
		vi.mocked(repository.getMemberRole).mockResolvedValue('owner');
		vi.mocked(repository.isMemberByEmail).mockResolvedValue(false);
		vi.mocked(repository.findPendingInviteByEmail).mockResolvedValue({
			id: 'invite-existing',
			householdId: 'household-1',
			email: 'guest@example.com',
			role: 'viewer',
			token: 'old-token',
			invitedByUserId: 'owner-1',
			status: 'pending',
			expiresAt: new Date('2026-06-01'),
			createdAt: new Date('2026-05-01')
		});

		await expect(
			service.createInvite('household-1', 'owner-1', 'guest@example.com', 'viewer')
		).rejects.toBeInstanceOf(PendingInviteExistsError);
	});

	it('accepts invite when email matches', async () => {
		vi.mocked(repository.findInviteByToken).mockResolvedValue({
			id: 'invite-1',
			householdId: 'household-1',
			email: 'guest@example.com',
			role: 'viewer',
			token: 'token-abc',
			invitedByUserId: 'owner-1',
			status: 'pending',
			expiresAt: new Date(Date.now() + 86_400_000),
			createdAt: new Date()
		});
		vi.mocked(repository.hasMember).mockResolvedValue(false);

		await service.acceptInvite('token-abc', 'guest-1', 'guest@example.com');

		expect(repository.acceptInvite).toHaveBeenCalledWith('invite-1', 'guest-1', 'viewer');
	});

	it('rejects accept when email mismatches', async () => {
		vi.mocked(repository.findInviteByToken).mockResolvedValue({
			id: 'invite-1',
			householdId: 'household-1',
			email: 'guest@example.com',
			role: 'viewer',
			token: 'token-abc',
			invitedByUserId: 'owner-1',
			status: 'pending',
			expiresAt: new Date(Date.now() + 86_400_000),
			createdAt: new Date()
		});

		await expect(
			service.acceptInvite('token-abc', 'other-1', 'other@example.com')
		).rejects.toBeInstanceOf(InviteEmailMismatchError);
	});

	it('rejects expired invite', async () => {
		vi.mocked(repository.findInviteByToken).mockResolvedValue({
			id: 'invite-1',
			householdId: 'household-1',
			email: 'guest@example.com',
			role: 'viewer',
			token: 'token-abc',
			invitedByUserId: 'owner-1',
			status: 'pending',
			expiresAt: new Date('2020-01-01'),
			createdAt: new Date('2019-01-01')
		});

		await expect(
			service.acceptInvite('token-abc', 'guest-1', 'guest@example.com')
		).rejects.toBeInstanceOf(InviteExpiredError);
	});

	it('prevents demoting the last owner', async () => {
		vi.mocked(repository.getMemberRole).mockResolvedValue('owner');
		vi.mocked(repository.countOwners).mockResolvedValue(1);

		await expect(
			service.updateMemberRole('household-1', 'owner-1', 'owner-1', 'editor')
		).rejects.toBeInstanceOf(LastOwnerError);
	});

	it('returns invite preview', async () => {
		vi.mocked(repository.getInvitePreview).mockResolvedValue({
			householdName: 'Hemmet',
			email: 'guest@example.com',
			role: 'editor',
			status: 'pending',
			expiresAt: new Date(Date.now() + 86_400_000)
		});

		const preview = await service.getInvitePreview('token-abc');

		expect(preview.householdName).toBe('Hemmet');
		expect(preview.expired).toBe(false);
	});

	it('throws when invite preview is missing', async () => {
		vi.mocked(repository.getInvitePreview).mockResolvedValue(null);

		await expect(service.getInvitePreview('missing')).rejects.toBeInstanceOf(InviteNotFoundError);
	});

	it('rejects invite when user is already a member', async () => {
		vi.mocked(repository.getMemberRole).mockResolvedValue('owner');
		vi.mocked(repository.isMemberByEmail).mockResolvedValue(true);

		await expect(
			service.createInvite('household-1', 'owner-1', 'member@example.com', 'editor')
		).rejects.toBeInstanceOf(AlreadyMemberError);
	});
});
