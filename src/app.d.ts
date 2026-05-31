import type { User, Session } from 'lucia';
import type { AdminService } from '$lib/application/admin.service';
import type { AuthService } from '$lib/application/auth.service';
import type { ProfileService } from '$lib/application/profile.service';
import type { HouseholdService } from '$lib/application/household.service';
import type { ShoppingListService } from '$lib/application/shopping-list.service';
import type { InventoryService } from '$lib/application/inventory.service';
import type { MealPlanService } from '$lib/application/meal-plan.service';
import type { PetFoodService } from '$lib/application/pet-food.service';
import type { PetService } from '$lib/application/pet.service';
import type { PmfService } from '$lib/application/pmf.service';
import type { ProductFeedbackService } from '$lib/application/product-feedback.service';
import type { PlanLimitsService } from '$lib/application/plan-limits.service';
import type { AiRateLimitService } from '$lib/application/ai-rate-limit.service';
import type { AiUsageAdminService } from '$lib/application/ai-usage-admin.service';
import type { WaitlistService } from '$lib/application/waitlist.service';
import type { HouseholdRole } from '$lib/domain/household';
import type { Locale } from '$lib/i18n/locale';

/// <reference types="@vite-pwa/sveltekit" />
/// <reference types="vite-plugin-pwa/info" />
/// <reference types="vite-plugin-pwa/vanillajs" />

declare global {
	namespace App {
		interface Locals {
			locale: Locale;
			user: User | null;
			session: Session | null;
			householdId: string | null;
			householdRole: HouseholdRole | null;
			authService: AuthService;
			profileService: ProfileService;
			adminService: AdminService;
			householdService: HouseholdService;
			inventoryService: InventoryService;
			shoppingListService: ShoppingListService;
			mealPlanService: MealPlanService;
			petService: PetService;
			petFoodService: PetFoodService;
			pmfService: PmfService;
			productFeedbackService: ProductFeedbackService;
			planLimitsService: PlanLimitsService;
			aiRateLimitService: AiRateLimitService;
			aiUsageAdminService: AiUsageAdminService;
			waitlistService: WaitlistService;
		}
	}
}

export {};
