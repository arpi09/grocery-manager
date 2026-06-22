import { describe, expect, it } from 'vitest';
import {
	canPerformLifecycleAction,
	defaultBlockForReportReason,
	handoverCompletesExchange,
	isCounterpartRatingVisible,
	isTerminalLifecycleStatus,
	isThreadMessagingAllowed,
	isValidRatingComment,
	lifecycleStepIndex,
	nextLifecycleStatus,
	normalizeRatingComment,
	shouldSetPickupAgreedAt
} from './market-lifecycle';

describe('market-lifecycle domain', () => {
	it('maps lifecycle steps for the stepper', () => {
		expect(lifecycleStepIndex('chatting')).toBe(0);
		expect(lifecycleStepIndex('pickup_agreed')).toBe(1);
		expect(lifecycleStepIndex('awaiting_handover')).toBe(2);
		expect(lifecycleStepIndex('completed')).toBe(3);
	});

	it('allows pickup proposal from chatting only', () => {
		expect(canPerformLifecycleAction('chatting', 'propose_pickup')).toBe(true);
		expect(canPerformLifecycleAction('pickup_agreed', 'propose_pickup')).toBe(false);
		expect(nextLifecycleStatus('chatting', 'propose_pickup')).toBe('pickup_agreed');
	});

	it('allows pickup agreement confirmation from chatting or pickup_agreed', () => {
		expect(canPerformLifecycleAction('chatting', 'confirm_pickup_agreement')).toBe(true);
		expect(canPerformLifecycleAction('pickup_agreed', 'confirm_pickup_agreement')).toBe(true);
		expect(nextLifecycleStatus('pickup_agreed', 'confirm_pickup_agreement')).toBe('awaiting_handover');
	});

	it('allows handover confirmation until exchange is completed', () => {
		expect(canPerformLifecycleAction('chatting', 'confirm_handover')).toBe(true);
		expect(canPerformLifecycleAction('pickup_agreed', 'confirm_handover')).toBe(true);
		expect(canPerformLifecycleAction('awaiting_handover', 'confirm_handover')).toBe(true);
		expect(canPerformLifecycleAction('completed', 'confirm_handover')).toBe(false);
	});

	it('blocks actions on terminal statuses', () => {
		for (const status of ['completed', 'cancelled', 'reported'] as const) {
			expect(isTerminalLifecycleStatus(status)).toBe(true);
			expect(isThreadMessagingAllowed(status)).toBe(false);
			expect(canPerformLifecycleAction(status, 'propose_pickup')).toBe(false);
		}
	});

	it('tracks pickup agreed timestamp triggers', () => {
		expect(shouldSetPickupAgreedAt('chatting', 'propose_pickup')).toBe(true);
		expect(shouldSetPickupAgreedAt('chatting', 'confirm_pickup_agreement')).toBe(true);
		expect(shouldSetPickupAgreedAt('pickup_agreed', 'confirm_pickup_agreement')).toBe(false);
	});

	it('detects when both parties confirmed handover', () => {
		expect(handoverCompletesExchange(null, null)).toBe(false);
		expect(handoverCompletesExchange(new Date(), null)).toBe(false);
		expect(handoverCompletesExchange(new Date(), new Date())).toBe(true);
	});

	it('defaults block checkbox for serious report reasons', () => {
		expect(defaultBlockForReportReason('unsafe')).toBe(true);
		expect(defaultBlockForReportReason('inappropriate')).toBe(true);
		expect(defaultBlockForReportReason('no_show')).toBe(false);
		expect(defaultBlockForReportReason('other')).toBe(false);
	});

	it('allows cancel and report from active lifecycle statuses', () => {
		expect(canPerformLifecycleAction('chatting', 'cancel')).toBe(true);
		expect(canPerformLifecycleAction('pickup_agreed', 'report')).toBe(true);
		expect(canPerformLifecycleAction('completed', 'cancel')).toBe(false);
	});

	it('validates rating comments and blind reveal visibility', () => {
		expect(isValidRatingComment(null)).toBe(true);
		expect(isValidRatingComment('a'.repeat(120))).toBe(true);
		expect(isValidRatingComment('a'.repeat(121))).toBe(false);
		expect(normalizeRatingComment('  hej  ')).toBe('hej');
		expect(isCounterpartRatingVisible({ id: 'mine' }, null)).toBe(false);
		expect(isCounterpartRatingVisible({ id: 'mine' }, { revealedAt: new Date() })).toBe(true);
		expect(isCounterpartRatingVisible(null, { revealedAt: new Date() })).toBe(false);
	});
});
