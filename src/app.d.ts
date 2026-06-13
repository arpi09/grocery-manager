import type { User, Session } from 'lucia';
import type { AdminService } from '$lib/application/admin.service';
import type { AuthService } from '$lib/application/auth.service';
import type { PasswordResetService } from '$lib/application/password-reset.service';
import type { EmailVerificationService } from '$lib/application/email-verification.service';
import type { OAuthService } from '$lib/application/oauth.service';
import type { ProfileService } from '$lib/application/profile.service';
import type { HouseholdService } from '$lib/application/household.service';
import type { ShoppingListService } from '$lib/application/shopping-list.service';
import type { ShoppingToPantryService } from '$lib/application/shopping-to-pantry.service';
import type { InventoryService } from '$lib/application/inventory.service';
import type { StatistikService } from '$lib/application/statistik.service';
import type { GamificationService } from '$lib/application/gamification.service';
import type { WrappedService } from '$lib/application/wrapped.service';
import type { MealPlanService } from '$lib/application/meal-plan.service';
import type { WeeklyRitualService } from '$lib/application/weekly-ritual.service';
import type { PetFoodService } from '$lib/application/pet-food.service';
import type { PetService } from '$lib/application/pet.service';
import type { PmfService } from '$lib/application/pmf.service';
import type { ProductFeedbackService } from '$lib/application/product-feedback.service';
import type { PmfSurveyService } from '$lib/application/pmf-survey.service';
import type { PlanLimitsService } from '$lib/application/plan-limits.service';
import type { AiRateLimitService } from '$lib/application/ai-rate-limit.service';
import type { AiUsageAdminService } from '$lib/application/ai-usage-admin.service';
import type { WaitlistService } from '$lib/application/waitlist.service';
import type { BillingService } from '$lib/application/billing.service';
import type { PurchasePatternService } from '$lib/application/purchase-pattern.service';
import type { InventoryIntelligenceService } from '$lib/application/inventory-intelligence.service';
import type { PriceMemoryService } from '$lib/application/price-memory.service';
import type { HouseholdFavoritesService } from '$lib/application/household-favorites.service';
import type { AnalyticsBehaviorService } from '$lib/application/analytics-behavior.service';
import type { AnalyticsAdminService } from '$lib/application/analytics-admin.service';
import type { AdminInsightsService } from '$lib/application/admin-insights.service';
import type { SocialPostService } from '$lib/application/social-post.service';
import type { GuideArticleService } from '$lib/application/guide-article.service';
import type { LinkedInPublishService } from '$lib/application/linkedin-publish.service';
import type { HouseholdRole } from '$lib/domain/household';
import type { PlanTier } from '$lib/domain/plan';
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
			planTier: PlanTier;
			authService: AuthService;
			passwordResetService: PasswordResetService;
			emailVerificationService: EmailVerificationService;
			oauthService: OAuthService;
			profileService: ProfileService;
			adminService: AdminService;
			householdService: HouseholdService;
			inventoryService: InventoryService;
			statistikService: StatistikService;
			gamificationService: GamificationService;
			wrappedService: WrappedService;
			shoppingListService: ShoppingListService;
			shoppingToPantryService: ShoppingToPantryService;
			mealPlanService: MealPlanService;
			weeklyRitualService: WeeklyRitualService;
			petService: PetService;
			petFoodService: PetFoodService;
			pmfService: PmfService;
			productFeedbackService: ProductFeedbackService;
			pmfSurveyService: PmfSurveyService;
			planLimitsService: PlanLimitsService;
			aiRateLimitService: AiRateLimitService;
			aiUsageAdminService: AiUsageAdminService;
			waitlistService: WaitlistService;
			billingService: BillingService;
			purchasePatternService: PurchasePatternService;
			inventoryIntelligenceService: InventoryIntelligenceService;
			priceMemoryService: PriceMemoryService;
			householdFavoritesService: HouseholdFavoritesService;
			analyticsBehaviorService: AnalyticsBehaviorService;
			analyticsAdminService: AnalyticsAdminService;
			adminInsightsService: AdminInsightsService;
			socialPostService: SocialPostService;
			guideArticleService: GuideArticleService;
			linkedInPublishService: LinkedInPublishService;
		}
	}
}

export {};
