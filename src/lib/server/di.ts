import { AdminService } from '$lib/application/admin.service';
import { AuthService } from '$lib/application/auth.service';
import { PasswordResetService } from '$lib/application/password-reset.service';
import { EmailVerificationService } from '$lib/application/email-verification.service';
import { OAuthService } from '$lib/application/oauth.service';
import { ProfileService } from '$lib/application/profile.service';
import { ShoppingListService } from '$lib/application/shopping-list.service';
import { InventoryService } from '$lib/application/inventory.service';
import { MealPlanService } from '$lib/application/meal-plan.service';
import { PetFoodService } from '$lib/application/pet-food.service';
import { PetService } from '$lib/application/pet.service';
import { DrizzleMealPlanRepository } from '$lib/infrastructure/repositories/meal-plan.repository';
import { DrizzlePetFoodRepository } from '$lib/infrastructure/repositories/pet-food.repository';
import { DrizzlePetRepository } from '$lib/infrastructure/repositories/pet.repository';
import { HouseholdService } from '$lib/application/household.service';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { DrizzleShoppingListRepository } from '$lib/infrastructure/repositories/shopping-list.repository';
import { DrizzleConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { GamificationService } from '$lib/application/gamification.service';
import { StatistikService } from '$lib/application/statistik.service';
import { DrizzleAdminRepository } from '$lib/infrastructure/repositories/admin.repository';
import { DrizzleErrorLogRepository } from '$lib/infrastructure/repositories/error-log.repository';
import { DrizzleUserRepository } from '$lib/infrastructure/repositories/user.repository';
import { DrizzlePasswordResetRepository } from '$lib/infrastructure/repositories/password-reset.repository';
import { DrizzleEmailVerificationRepository } from '$lib/infrastructure/repositories/email-verification.repository';
import { DrizzleAdminActionRepository } from '$lib/infrastructure/repositories/admin-action.repository';
import { DrizzlePmfRepository } from '$lib/infrastructure/repositories/pmf.repository';
import { DrizzleExpiryReminderRepository } from '$lib/infrastructure/repositories/expiry-reminder.repository';
import { DrizzleShoppingPushRepository } from '$lib/infrastructure/repositories/shopping-push.repository';
import { PmfService } from '$lib/application/pmf.service';
import { ExpiryReminderService } from '$lib/application/expiry-reminder.service';
import { ShoppingPushService } from '$lib/application/shopping-push.service';
import { DrizzleProductFeedbackRepository } from '$lib/infrastructure/repositories/product-feedback.repository';
import { ProductFeedbackService } from '$lib/application/product-feedback.service';
import { PmfSurveyService } from '$lib/application/pmf-survey.service';
import { DrizzlePmfSurveyRepository } from '$lib/infrastructure/repositories/pmf-survey.repository';
import { DrizzleAiUsageRepository } from '$lib/infrastructure/repositories/ai-usage.repository';
import { AiRateLimitService } from '$lib/application/ai-rate-limit.service';
import { AiUsageAdminService } from '$lib/application/ai-usage-admin.service';
import { PlanLimitsService } from '$lib/application/plan-limits.service';
import { DrizzlePlanLimitsRepository } from '$lib/infrastructure/repositories/plan-limits.repository';
import { DrizzleWaitlistRepository } from '$lib/infrastructure/repositories/waitlist.repository';
import { WaitlistService } from '$lib/application/waitlist.service';
import { DrizzleAppSettingsRepository } from '$lib/infrastructure/repositories/app-settings.repository';
import { AppSettingsService } from '$lib/application/app-settings.service';
import { PmfDigestService } from '$lib/application/pmf-digest.service';
import { DrizzlePurchasePatternRepository } from '$lib/infrastructure/repositories/purchase-pattern.repository';
import { PurchasePatternService } from '$lib/application/purchase-pattern.service';
import { BillingService } from '$lib/application/billing.service';
import { DrizzleBillingRepository } from '$lib/infrastructure/repositories/billing.repository';
import { DrizzlePushSubscriptionRepository } from '$lib/infrastructure/repositories/push-subscription.repository';
import { appOriginAdapter } from '$lib/infrastructure/adapters/app-origin.adapter';
import { emailAdapter } from '$lib/infrastructure/adapters/email.adapter';
import { emailVerificationPolicyAdapter } from '$lib/infrastructure/adapters/email-verification-policy.adapter';
import { pushAdapter } from '$lib/infrastructure/adapters/push.adapter';
import { rateLimitAdapter } from '$lib/infrastructure/adapters/rate-limit.adapter';
import { shelfLifeInferenceAdapter } from '$lib/infrastructure/adapters/shelf-life-inference.adapter';
import { stripeAdapter } from '$lib/infrastructure/adapters/stripe.adapter';

const userRepository = new DrizzleUserRepository();
export const passwordResetRepository = new DrizzlePasswordResetRepository();
const emailVerificationRepository = new DrizzleEmailVerificationRepository();
const adminActionRepository = new DrizzleAdminActionRepository();
const errorLogRepository = new DrizzleErrorLogRepository();
const adminRepository = new DrizzleAdminRepository(errorLogRepository);
const householdRepository = new DrizzleHouseholdRepository();
const consumptionRepository = new DrizzleConsumptionRepository();
const inventoryRepository = new DrizzleInventoryRepository();
const shoppingListRepository = new DrizzleShoppingListRepository();
const mealPlanRepository = new DrizzleMealPlanRepository();
const petRepository = new DrizzlePetRepository();
const petFoodRepository = new DrizzlePetFoodRepository();
const pmfRepository = new DrizzlePmfRepository();
const expiryReminderRepository = new DrizzleExpiryReminderRepository();
const shoppingPushRepository = new DrizzleShoppingPushRepository();
const productFeedbackRepository = new DrizzleProductFeedbackRepository();
const pmfSurveyRepository = new DrizzlePmfSurveyRepository();
const aiUsageRepository = new DrizzleAiUsageRepository();
const planLimitsRepository = new DrizzlePlanLimitsRepository();
const waitlistRepository = new DrizzleWaitlistRepository();
const appSettingsRepository = new DrizzleAppSettingsRepository();

const purchasePatternRepository = new DrizzlePurchasePatternRepository();
const billingRepository = new DrizzleBillingRepository();
export const pushSubscriptionRepository = new DrizzlePushSubscriptionRepository();

export const authService = new AuthService(userRepository);
export const passwordResetService = new PasswordResetService(
	userRepository,
	passwordResetRepository,
	rateLimitAdapter,
	emailAdapter,
	appOriginAdapter
);
export const emailVerificationService = new EmailVerificationService(
	userRepository,
	emailVerificationRepository,
	rateLimitAdapter,
	emailAdapter,
	appOriginAdapter,
	emailVerificationPolicyAdapter
);
export const oauthService = new OAuthService(userRepository);
export const profileService = new ProfileService(userRepository);
export const billingService = new BillingService(billingRepository, stripeAdapter, appOriginAdapter);
export const adminService = new AdminService(
	adminRepository,
	passwordResetService,
	adminActionRepository,
	billingService
);
export const householdService = new HouseholdService(householdRepository);
export const inventoryService = new InventoryService(
	inventoryRepository,
	consumptionRepository,
	householdRepository,
	shelfLifeInferenceAdapter
);
export const purchasePatternService = new PurchasePatternService(
	purchasePatternRepository,
	inventoryService
);
export const statistikService = new StatistikService(
	inventoryService,
	inventoryRepository,
	consumptionRepository
);
export const gamificationService = new GamificationService(
	statistikService,
	consumptionRepository,
	mealPlanRepository,
	pmfRepository
);
export const shoppingListService = new ShoppingListService(shoppingListRepository);
export const mealPlanService = new MealPlanService(mealPlanRepository);
export const petService = new PetService(petRepository);
export const petFoodService = new PetFoodService(petFoodRepository);
export const pmfService = new PmfService(pmfRepository);
export const expiryReminderService = new ExpiryReminderService(
	expiryReminderRepository,
	householdService,
	inventoryService,
	pushSubscriptionRepository,
	emailAdapter,
	pushAdapter,
	appOriginAdapter
);
export const shoppingPushService = new ShoppingPushService(
	shoppingPushRepository,
	householdService,
	shoppingListService,
	pushSubscriptionRepository,
	pushAdapter,
	appOriginAdapter
);
export const productFeedbackService = new ProductFeedbackService(productFeedbackRepository);
export const pmfSurveyService = new PmfSurveyService(pmfSurveyRepository);
export const aiRateLimitService = new AiRateLimitService(aiUsageRepository);
export const aiUsageAdminService = new AiUsageAdminService(aiUsageRepository);
export const planLimitsService = new PlanLimitsService(planLimitsRepository, aiRateLimitService);
export const waitlistService = new WaitlistService(waitlistRepository);
export const appSettingsService = new AppSettingsService(appSettingsRepository);
export const pmfDigestService = new PmfDigestService(
	pmfService,
	adminService,
	waitlistService,
	emailAdapter,
	appOriginAdapter
);
