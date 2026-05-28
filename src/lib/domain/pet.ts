export interface Pet {
	id: string;
	userId: string;
	name: string;
	species: string | null;
	createdAt: Date;
}
