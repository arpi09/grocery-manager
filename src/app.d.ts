import type { User, Session } from 'lucia';
import type { AdminService } from '$lib/application/admin.service';
import type { AuthService } from '$lib/application/auth.service';
import type { InventoryService } from '$lib/application/inventory.service';
import type { MealPlanService } from '$lib/application/meal-plan.service';
import type { PetFoodService } from '$lib/application/pet-food.service';
import type { PetService } from '$lib/application/pet.service';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			session: Session | null;
			authService: AuthService;
			adminService: AdminService;
			inventoryService: InventoryService;
			mealPlanService: MealPlanService;
			petService: PetService;
			petFoodService: PetFoodService;
		}
	}
}

export {};
