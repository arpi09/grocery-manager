import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from '$lib/infrastructure/db';
import { sessionTable, userTable } from '$lib/infrastructure/db/schema';

const adapter = new DrizzlePostgreSQLAdapter(db, sessionTable, userTable);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/'
		}
	},
	getUserAttributes: (attributes) => ({
		email: attributes.email,
		displayName: attributes.displayName,
		avatarUrl: attributes.avatarUrl,
		role: attributes.role,
		petsEnabled: Boolean(attributes.petsEnabled)
	})
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			email: string;
			displayName: string | null;
			avatarUrl: string | null;
			role: string;
			petsEnabled: boolean;
		};
	}
}

declare module 'lucia' {
	interface UserAttributes {
		email: string;
		displayName: string | null;
		avatarUrl: string | null;
		role: string;
		petsEnabled: boolean;
	}
}
