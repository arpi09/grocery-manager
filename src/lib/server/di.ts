import { AuthService } from '$lib/application/auth.service';
import { InventoryService } from '$lib/application/inventory.service';
import { MealPlanService } from '$lib/application/meal-plan.service';
import { PetFoodService } from '$lib/application/pet-food.service';
import { PetService } from '$lib/application/pet.service';
import { DrizzleMealPlanRepository } from '$lib/infrastructure/repositories/meal-plan.repository';
import { DrizzlePetFoodRepository } from '$lib/infrastructure/repositories/pet-food.repository';
import { DrizzlePetRepository } from '$lib/infrastructure/repositories/pet.repository';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { DrizzleUserRepository } from '$lib/infrastructure/repositories/user.repository';

const userRepository = new DrizzleUserRepository();
const inventoryRepository = new DrizzleInventoryRepository();
const mealPlanRepository = new DrizzleMealPlanRepository();
const petRepository = new DrizzlePetRepository();
const petFoodRepository = new DrizzlePetFoodRepository();

export const authService = new AuthService(userRepository);
export const inventoryService = new InventoryService(inventoryRepository);
export const mealPlanService = new MealPlanService(mealPlanRepository);
export const petService = new PetService(petRepository);
export const petFoodService = new PetFoodService(petFoodRepository);
