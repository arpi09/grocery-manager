/**
 * Tiered deletion safety guards (severity 1 → 4).
 *
 * | Tier | Severity   | Examples                         | Guard pattern                                      |
 * |------|------------|----------------------------------|----------------------------------------------------|
 * | 1    | Light      | Shopping list line               | Inline confirm or undo toast after delete          |
 * | 2    | Standard   | Pantry item, invite, meal        | Modal: "Ta bort [namn]?" + Avbryt / Ta bort        |
 * | 3    | Strong     | Member, pet, bulk clear          | Modal + consequence text + destructive confirm     |
 * | 4    | Critical   | Delete household                 | Modal + type name or TA BORT + member warnings      |
 */

export type DeleteSafetyTier = 1 | 2 | 3 | 4;

export type DeleteSafetyContext =
	| 'shoppingListItem'
	| 'shoppingListClearChecked'
	| 'inventoryItem'
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
	/** Bulk operations — number of rows affected. */
	count?: number;
	/** Tier 4 — household name the user must type (or TA BORT). */
	confirmationTarget?: string;
	/** Tier 4 — warn when other members lose access. */
	otherMemberCount?: number;
}

export interface DeleteSafetyCopy {
	title: string;
	description: string;
	/** Shown for tier 3+ when impact needs emphasis. */
	consequence?: string;
	confirmLabel: string;
	cancelLabel: string;
	typedConfirmationLabel?: string;
	typedConfirmationHint?: string;
	typedConfirmationPlaceholder?: string;
	undoToastMessage?: string;
	undoActionLabel?: string;
}

const CANCEL = 'Avbryt';

function namedItemPhrase(itemName?: string): string {
	return itemName?.trim() ? `"${itemName.trim()}"` : 'den här posten';
}

export function isTypedConfirmationValid(
	input: string,
	confirmationTarget: string
): boolean {
	const normalized = input.trim();
	return normalized === confirmationTarget.trim() || normalized === 'TA BORT';
}

export function getDeleteCopy(
	tier: DeleteSafetyTier,
	context: DeleteSafetyContext,
	options: DeleteCopyOptions = {}
): DeleteSafetyCopy {
	const { itemName, count, confirmationTarget, otherMemberCount = 0 } = options;
	const named = namedItemPhrase(itemName);

	switch (context) {
		case 'shoppingListItem':
			return {
				title: 'Ta bort rad?',
				description: `Raden ${named} tas bort från inköpslistan.`,
				confirmLabel: 'Ta bort',
				cancelLabel: CANCEL,
				undoToastMessage: itemName
					? `${itemName.trim()} borttagen från listan`
					: 'Rad borttagen från listan',
				undoActionLabel: 'Ångra'
			};

		case 'shoppingListClearChecked': {
			const n = count ?? 0;
			return {
				title: 'Rensa avbockade?',
				description:
					n > 0
						? `${n} avbockade ${n === 1 ? 'rad tas' : 'rader tas'} bort permanent.`
						: 'Alla avbockade rader tas bort permanent.',
				consequence: 'Detta går inte att ångra.',
				confirmLabel: 'Rensa avbockade',
				cancelLabel: CANCEL
			};
		}

		case 'inventoryItem':
			return {
				title: itemName ? `Ta bort ${itemName.trim()}?` : 'Ta bort vara?',
				description: `Varan ${named} tas bort från skafferiet.`,
				confirmLabel: 'Ta bort',
				cancelLabel: CANCEL
			};

		case 'householdMember':
			return {
				title: itemName ? `Ta bort ${itemName.trim()}?` : 'Ta bort medlem?',
				description: `Medlemmen ${named} förlorar åtkomst till hushållet.`,
				consequence: 'Personen måste bjudas in igen för att komma tillbaka.',
				confirmLabel: 'Ta bort medlem',
				cancelLabel: CANCEL
			};

		case 'householdDelete': {
			const memberWarning =
				otherMemberCount > 0
					? `${otherMemberCount} ${
							otherMemberCount === 1 ? 'annan medlem' : 'andra medlemmar'
						} förlorar åtkomst omedelbart.`
					: undefined;
			return {
				title: 'Ta bort hushåll',
				description:
					'Detta går inte att ångra. All inventering, inköpslista och förbrukningshistorik för hushållet raderas.',
				consequence: memberWarning,
				confirmLabel: 'Ta bort permanent',
				cancelLabel: CANCEL,
				typedConfirmationLabel: 'Bekräftelse',
				typedConfirmationHint: confirmationTarget
					? `Skriv ${confirmationTarget} eller TA BORT för att bekräfta.`
					: 'Skriv hushållets namn eller TA BORT för att bekräfta.',
				typedConfirmationPlaceholder: confirmationTarget
			};
		}

		case 'inviteRevoke':
			return {
				title: itemName ? `Återkalla inbjudan?` : 'Återkalla inbjudan?',
				description: itemName
					? `Inbjudan till ${itemName.trim()} tas bort. Länken slutar fungera.`
					: 'Inbjudan tas bort och länken slutar fungera.',
				confirmLabel: 'Återkalla',
				cancelLabel: CANCEL
			};

		case 'pet':
			return {
				title: itemName ? `Ta bort ${itemName.trim()}?` : 'Ta bort husdjur?',
				description: `Husdjuret ${named} och tillhörande matloggar tas bort.`,
				consequence: 'Detta går inte att ångra.',
				confirmLabel: 'Ta bort husdjur',
				cancelLabel: CANCEL
			};

		case 'petFood':
			return {
				title: itemName ? `Ta bort ${itemName.trim()}?` : 'Ta bort mat?',
				description: `Matposten ${named} tas bort från husdjursförrådet.`,
				confirmLabel: 'Ta bort',
				cancelLabel: CANCEL
			};

		case 'plannedMeal':
			return {
				title: itemName ? `Ta bort ${itemName.trim()}?` : 'Ta bort måltid?',
				description: `Måltiden ${named} tas bort från veckoplanen.`,
				confirmLabel: 'Ta bort',
				cancelLabel: CANCEL
			};

		case 'receiptDiscardReview': {
			const n = count ?? 0;
			return {
				title: 'Kasta granskning?',
				description:
					n > 0
						? `${n} identifierade ${n === 1 ? 'vara försvinner' : 'varor försvinner'} om du väljer ny bild.`
						: 'Den parsade kvittolistan försvinner om du väljer ny bild.',
				consequence: 'Du måste fotografera eller välja kvittot igen.',
				confirmLabel: 'Kasta och välj ny bild',
				cancelLabel: CANCEL
			};
		}

		default:
			if (tier >= 3) {
				return {
					title: 'Ta bort?',
					description: 'Den valda posten tas bort permanent.',
					consequence: 'Detta går inte att ångra.',
					confirmLabel: 'Ta bort',
					cancelLabel: CANCEL
				};
			}
			return {
				title: 'Ta bort?',
				description: 'Är du säker på att du vill ta bort detta?',
				confirmLabel: 'Ta bort',
				cancelLabel: CANCEL
			};
	}
}

/** Modal variant: bottom sheet on narrow viewports, centered dialog otherwise. */
export function deleteModalVariant(isNarrow: boolean): 'sheet' | 'center' {
	return isNarrow ? 'sheet' : 'center';
}
