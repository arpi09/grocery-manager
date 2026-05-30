/**
 * Tiered deletion safety guards (severity 1 → 4).
 */

import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/locale';
import { translate, type MessageKey } from '$lib/i18n/messages';

export type DeleteSafetyTier = 1 | 2 | 3 | 4;

export type DeleteSafetyContext =
	| 'shoppingListItem'
	| 'shoppingListClearChecked'
	| 'inventoryItem'
	| 'inventoryItemFinished'
	| 'householdMember'
	| 'householdDelete'
	| 'inviteRevoke'
	| 'pet'
	| 'petFood'
	| 'plannedMeal'
	| 'receiptDiscardReview'
	| 'generic';

export interface DeleteCopyOptions {
	itemName?: string;
	count?: number;
	confirmationTarget?: string;
	otherMemberCount?: number;
}

export interface DeleteSafetyCopy {
	title: string;
	description: string;
	consequence?: string;
	confirmLabel: string;
	cancelLabel: string;
	typedConfirmationLabel?: string;
	typedConfirmationHint?: string;
	typedConfirmationPlaceholder?: string;
	undoToastMessage?: string;
	undoActionLabel?: string;
}

function namedItemPhrase(locale: Locale, itemName?: string): string {
	return itemName?.trim() ? `"${itemName.trim()}"` : translate(locale, 'common.unknownItem');
}

export function isTypedConfirmationValid(
	input: string,
	confirmationTarget: string,
	locale: Locale = DEFAULT_LOCALE
): boolean {
	const normalized = input.trim();
	const deleteWord = translate(locale, 'common.typeDeleteConfirm');
	return normalized === confirmationTarget.trim() || normalized === deleteWord;
}

export function getDeleteCopy(
	tier: DeleteSafetyTier,
	context: DeleteSafetyContext,
	options: DeleteCopyOptions = {},
	locale: Locale = DEFAULT_LOCALE
): DeleteSafetyCopy {
	const { itemName, count, confirmationTarget, otherMemberCount = 0 } = options;
	const named = namedItemPhrase(locale, itemName);
	const cancelLabel = translate(locale, 'common.cancel');
	const deleteLabel = translate(locale, 'common.delete');
	const undoLabel = translate(locale, 'common.undo');
	const confirmLabel = translate(locale, 'common.confirmation');

	switch (context) {
		case 'shoppingListItem':
			return {
				title: translate(locale, 'delete.shoppingItem.title'),
				description: translate(locale, 'delete.shoppingItem.description', { name: named }),
				confirmLabel: deleteLabel,
				cancelLabel,
				undoToastMessage: itemName
					? translate(locale, 'delete.shoppingItem.undoNamed', { name: itemName.trim() })
					: translate(locale, 'delete.shoppingItem.undo'),
				undoActionLabel: undoLabel
			};

		case 'shoppingListClearChecked': {
			const n = count ?? 0;
			return {
				title: translate(locale, 'delete.clearChecked.title'),
				description:
					n > 0
						? translate(locale, 'delete.clearChecked.description', { count: n })
						: translate(locale, 'delete.clearChecked.descriptionAll'),
				consequence: translate(locale, 'delete.clearChecked.consequence'),
				confirmLabel: translate(locale, 'delete.clearChecked.confirm'),
				cancelLabel
			};
		}

		case 'inventoryItem':
			return {
				title: itemName
					? translate(locale, 'delete.inventoryItem.titleNamed', { name: itemName.trim() })
					: translate(locale, 'delete.inventoryItem.title'),
				description: translate(locale, 'delete.inventoryItem.description', { name: named }),
				confirmLabel: deleteLabel,
				cancelLabel
			};

		case 'inventoryItemFinished':
			return {
				title: itemName
					? translate(locale, 'delete.inventoryItemFinished.titleNamed', { name: itemName.trim() })
					: translate(locale, 'delete.inventoryItemFinished.title'),
				description: translate(locale, 'delete.inventoryItemFinished.description', { name: named }),
				confirmLabel: translate(locale, 'delete.inventoryItemFinished.confirm'),
				cancelLabel
			};

		case 'householdMember':
			return {
				title: itemName
					? translate(locale, 'delete.householdMember.titleNamed', { name: itemName.trim() })
					: translate(locale, 'delete.householdMember.title'),
				description: translate(locale, 'delete.householdMember.description', { name: named }),
				consequence: translate(locale, 'delete.householdMember.consequence'),
				confirmLabel: translate(locale, 'delete.householdMember.confirm'),
				cancelLabel
			};

		case 'householdDelete': {
			const memberWarning =
				otherMemberCount > 0
					? translate(locale, 'delete.household.otherMembers', { count: otherMemberCount })
					: undefined;
			return {
				title: translate(locale, 'delete.household.title'),
				description: translate(locale, 'delete.household.description'),
				consequence: memberWarning,
				confirmLabel: translate(locale, 'delete.household.confirm'),
				cancelLabel,
				typedConfirmationLabel: confirmLabel,
				typedConfirmationHint: confirmationTarget
					? translate(locale, 'delete.household.typedHint', { name: confirmationTarget })
					: translate(locale, 'delete.household.typedHintGeneric'),
				typedConfirmationPlaceholder: confirmationTarget
			};
		}

		case 'inviteRevoke':
			return {
				title: translate(locale, 'delete.invite.title'),
				description: itemName
					? translate(locale, 'delete.invite.description', { name: itemName.trim() })
					: translate(locale, 'delete.invite.descriptionGeneric'),
				confirmLabel: translate(locale, 'delete.invite.confirm'),
				cancelLabel
			};

		case 'pet':
			return {
				title: itemName
					? translate(locale, 'delete.pet.titleNamed', { name: itemName.trim() })
					: translate(locale, 'delete.pet.title'),
				description: translate(locale, 'delete.pet.description', { name: named }),
				consequence: translate(locale, 'delete.pet.consequence'),
				confirmLabel: translate(locale, 'delete.pet.confirm'),
				cancelLabel
			};

		case 'petFood':
			return {
				title: itemName
					? translate(locale, 'delete.petFood.titleNamed', { name: itemName.trim() })
					: translate(locale, 'delete.petFood.title'),
				description: translate(locale, 'delete.petFood.description', { name: named }),
				confirmLabel: deleteLabel,
				cancelLabel
			};

		case 'plannedMeal':
			return {
				title: itemName
					? translate(locale, 'delete.plannedMeal.titleNamed', { name: itemName.trim() })
					: translate(locale, 'delete.plannedMeal.title'),
				description: translate(locale, 'delete.plannedMeal.description', { name: named }),
				confirmLabel: deleteLabel,
				cancelLabel
			};

		case 'receiptDiscardReview': {
			const n = count ?? 0;
			return {
				title: translate(locale, 'delete.receiptReview.title'),
				description:
					n > 0
						? translate(locale, 'delete.receiptReview.description', { count: n })
						: translate(locale, 'delete.receiptReview.descriptionEmpty'),
				consequence: translate(locale, 'delete.receiptReview.consequence'),
				confirmLabel: translate(locale, 'delete.receiptReview.confirm'),
				cancelLabel
			};
		}

		default:
			if (tier >= 3) {
				return {
					title: translate(locale, 'delete.generic.title'),
					description: translate(locale, 'delete.generic.descriptionPermanent'),
					consequence: translate(locale, 'delete.generic.consequence'),
					confirmLabel: deleteLabel,
					cancelLabel
				};
			}
			return {
				title: translate(locale, 'delete.generic.title'),
				description: translate(locale, 'delete.generic.descriptionSimple'),
				confirmLabel: deleteLabel,
				cancelLabel
			};
	}
}

export function deleteModalVariant(isNarrow: boolean): 'sheet' | 'center' {
	return isNarrow ? 'sheet' : 'center';
}
