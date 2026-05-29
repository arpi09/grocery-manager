import type { User, Session } from 'lucia';
import type { AdminService } from '$lib/application/admin.service';
import type { AuthService } from '$lib/application/auth.service';
import type { ProfileService } from '$lib/application/profile.service';
import type { HouseholdService } from '$lib/application/household.service';
import type { ConsumptionService } from '$lib/application/consumption.service';
import type { ShoppingListService } from '$lib/application/shopping-list.service';
import type { InventoryService } from '$lib/application/inventory.service';
import type { MealPlanService } from '$lib/application/meal-plan.service';
import type { PetFoodService } from '$lib/application/pet-food.service';
import type { PetService } from '$lib/application/pet.service';
import type { HouseholdRole } from '$lib/domain/household';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			session: Session | null;
			householdId: string | null;
			householdRole: HouseholdRole | null;
			authService: AuthService;
			profileService: ProfileService;
			adminService: AdminService;
			householdService: HouseholdService;
			inventoryService: InventoryService;
			consumptionService: ConsumptionService;
			shoppingListService: ShoppingListService;
			mealPlanService: MealPlanService;
			petService: PetService;
			petFoodService: PetFoodService;
		}
	}
}

export {};