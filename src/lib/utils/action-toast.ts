import type { Locale } from '$lib/i18n/locale';
import { translate, type MessageKey } from '$lib/i18n/messages';

export const ACTION_TOAST_PARAM = 'actionToast';
export const ACTION_TOAST_LABEL_PARAM = 'actionLabel';

export type ActionToastKind =
	| 'itemCreated'
	| 'itemUpdated'
	| 'itemDeleted'
	| 'itemFinished'
	| 'itemPartiallyConsumed'
	| 'autoExpiredCleared'
	| 'settingsSaved'
	| 'petAdded'
	| 'petRemoved'
	| 'petFoodAdded'
	| 'petFoodRemoved'
	| 'memberUpdated'
	| 'memberRemoved'
	| 'inviteRevoked'
	| 'mealCreated'
	| 'mealUpdated'
	| 'mealDeleted'
	| 'mealScheduled'
	| 'pantrySwitched'
	| 'pantryCreated'
	| 'pantryLeft'
	| 'householdRenamed'
	| 'shoppingAdded'
	| 'shoppingCleared'
	| 'adminSaved'
	| 'adminPasswordResetSent';

const ACTION_TOAST_KEYS: Record<
	ActionToastKind,
	{ withLabel: MessageKey; generic: MessageKey }
> = {
	itemCreated: {
		withLabel: 'actionToast.itemCreated',
		generic: 'actionToast.itemCreatedGeneric'
	},
	itemUpdated: {
		withLabel: 'actionToast.itemUpdated',
		generic: 'actionToast.itemUpdatedGeneric'
	},
	itemDeleted: {
		withLabel: 'actionToast.itemDeleted',
		generic: 'actionToast.itemDeletedGeneric'
	},
	itemFinished: {
		withLabel: 'actionToast.itemFinished',
		generic: 'actionToast.itemFinishedGeneric'
	},
	itemPartiallyConsumed: {
		withLabel: 'actionToast.itemPartiallyConsumed',
		generic: 'actionToast.itemPartiallyConsumedGeneric'
	},
	autoExpiredCleared: {
		withLabel: 'actionToast.autoExpiredCleared',
		generic: 'actionToast.autoExpiredClearedGeneric'
	},
	settingsSaved: {
		withLabel: 'actionToast.settingsSaved',
		generic: 'actionToast.settingsSaved'
	},
	petAdded: {
		withLabel: 'actionToast.petAdded',
		generic: 'actionToast.petAddedGeneric'
	},
	petRemoved: {
		withLabel: 'actionToast.petRemoved',
		generic: 'actionToast.petRemovedGeneric'
	},
	petFoodAdded: {
		withLabel: 'actionToast.petFoodAdded',
		generic: 'actionToast.petFoodAdded'
	},
	petFoodRemoved: {
		withLabel: 'actionToast.petFoodRemoved',
		generic: 'actionToast.petFoodRemoved'
	},
	memberUpdated: {
		withLabel: 'actionToast.memberUpdated',
		generic: 'actionToast.memberUpdated'
	},
	memberRemoved: {
		withLabel: 'actionToast.memberRemoved',
		generic: 'actionToast.memberRemoved'
	},
	inviteRevoked: {
		withLabel: 'actionToast.inviteRevoked',
		generic: 'actionToast.inviteRevoked'
	},
	mealCreated: {
		withLabel: 'actionToast.mealCreated',
		generic: 'actionToast.mealCreatedGeneric'
	},
	mealUpdated: {
		withLabel: 'actionToast.mealUpdated',
		generic: 'actionToast.mealUpdatedGeneric'
	},
	mealDeleted: {
		withLabel: 'actionToast.mealDeleted',
		generic: 'actionToast.mealDeletedGeneric'
	},
	mealScheduled: {
		withLabel: 'actionToast.mealScheduled',
		generic: 'actionToast.mealScheduledGeneric'
	},
	pantrySwitched: {
		withLabel: 'actionToast.pantrySwitched',
		generic: 'actionToast.pantrySwitchedGeneric'
	},
	pantryCreated: {
		withLabel: 'actionToast.pantryCreated',
		generic: 'actionToast.pantryCreatedGeneric'
	},
	pantryLeft: {
		withLabel: 'actionToast.pantryLeft',
		generic: 'actionToast.pantryLeft'
	},
	householdRenamed: {
		withLabel: 'actionToast.householdRenamed',
		generic: 'actionToast.householdRenamedGeneric'
	},
	shoppingAdded: {
		withLabel: 'actionToast.shoppingAdded',
		generic: 'actionToast.shoppingAdded'
	},
	shoppingCleared: {
		withLabel: 'actionToast.shoppingCleared',
		generic: 'actionToast.shoppingCleared'
	},
	adminSaved: {
		withLabel: 'actionToast.adminSaved',
		generic: 'actionToast.adminSaved'
	},
	adminPasswordResetSent: {
		withLabel: 'actionToast.adminPasswordResetSent',
		generic: 'actionToast.adminPasswordResetSent'
	}
};

const ACTION_TOAST_KINDS = new Set<string>(Object.keys(ACTION_TOAST_KEYS));

export function parseActionToastKind(value: string | null): ActionToastKind | null {
	if (value && ACTION_TOAST_KINDS.has(value)) {
		return value as ActionToastKind;
	}
	return null;
}

export function appendActionToast(path: string, kind: ActionToastKind, label?: string): string {
	const url = new URL(path, 'http://local');
	url.searchParams.set(ACTION_TOAST_PARAM, kind);
	if (label?.trim()) {
		url.searchParams.set(ACTION_TOAST_LABEL_PARAM, label.trim());
	} else {
		url.searchParams.delete(ACTION_TOAST_LABEL_PARAM);
	}
	return `${url.pathname}${url.search}${url.hash}`;
}

export function actionToastMessage(
	locale: Locale,
	kind: ActionToastKind,
	label?: string
): string {
	const keys = ACTION_TOAST_KEYS[kind];
	const trimmed = label?.trim();
	if (trimmed) {
		return translate(locale, keys.withLabel, { label: trimmed });
	}
	return translate(locale, keys.generic);
}
