import { AdminService } from '$lib/application/admin.service';
import { AuthService } from '$lib/application/auth.service';
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
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { DrizzleAdminRepository } from '$lib/infrastructure/repositories/admin.repository';
import { DrizzleErrorLogRepository } from '$lib/infrastructure/repositories/error-log.repository';
import { DrizzleUserRepository } from '$lib/infrastructure/repositories/user.repository';
import { DrizzlePmfRepository } from '$lib/infrastructure/repositories/pmf.repository';
import { DrizzleExpiryReminderRepository } from '$lib/infrastructure/repositories/expiry-reminder.repository';
import { PmfService } from '$lib/application/pmf.service';
import { ExpiryReminderService } from '$lib/application/expiry-reminder.service';
import { DrizzleProductFeedbackRepository } from '$lib/infrastructure/repositories/product-feedback.repository';
import { ProductFeedbackService } from '$lib/application/product-feedback.service';
import { DrizzleAiUsageRepository } from '$lib/infrastructure/repositories/ai-usage.repository';
import { AiRateLimitService } from '$lib/application/ai-rate-limit.service';
import { AiUsageAdminService } from '$lib/application/ai-usage-admin.service';
import { PlanLimitsService } from '$lib/application/plan-limits.service';
import { DrizzlePlanLimitsRepository } from '$lib/infrastructure/repositories/plan-limits.repository';
import { DrizzleWaitlistRepository } from '$lib/infrastructure/repositories/waitlist.repository';
import { WaitlistService } from '$lib/application/waitlist.service';

const userRepository = new DrizzleUserRepository();
const errorLogRepository = new DrizzleErrorLogRepository();
const adminRepository = new DrizzleAdminRepository(errorLogRepository);
const householdRepository = new DrizzleHouseholdRepository();
const inventoryRepository = new DrizzleInventoryRepository();
const shoppingListRepository = new DrizzleShoppingListRepository();
const mealPlanRepository = new DrizzleMealPlanRepository();
const petRepository = new DrizzlePetRepository();
const petFoodRepository = new DrizzlePetFoodRepository();
const pmfRepository = new DrizzlePmfRepository();
const expiryReminderRepository = new DrizzleExpiryReminderRepository();
const productFeedbackRepository = new DrizzleProductFeedbackRepository();
const aiUsageRepository = new DrizzleAiUsageRepository();
const planLimitsRepository = new DrizzlePlanLimitsRepository();
const waitlistRepository = new DrizzleWaitlistRepository();

export const authService = new AuthService(userRepository);
export const profileService = new ProfileService(userRepository);
export const adminService = new AdminService(adminRepository);
export const householdService = new HouseholdService(householdRepository);
export const inventoryService = new InventoryService(inventoryRepository);
export const shoppingListService = new ShoppingListService(shoppingListRepository);
export const mealPlanService = new MealPlanService(mealPlanRepository);
export const petService = new PetService(petRepository);
export const petFoodService = new PetFoodService(petFoodRepository);
export const pmfService = new PmfService(pmfRepository);
export const expiryReminderService = new ExpiryReminderService(
	expiryReminderRepository,
	householdService,
	inventoryService
);
export const productFeedbackService = new ProductFeedbackService(productFeedbackRepository);
export const aiRateLimitService = new AiRateLimitService(aiUsageRepository);
export const aiUsageAdminService = new AiUsageAdminService(aiUsageRepository);
export const planLimitsService = new PlanLimitsService(planLimitsRepository, aiRateLimitService);
export const waitlistService = new WaitlistService(waitlistRepository);
