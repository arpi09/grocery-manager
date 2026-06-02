import { z } from 'zod';

export const loginSchema = z.object({
	email: z.string().email('Enter a valid email'),
	password: z.string().min(1, 'Password is required')
});

const passwordField = z.string().min(8, 'Password must be at least 8 characters');

export const registerSchema = z
	.object({
		email: z.string().email('Enter a valid email'),
		password: passwordField,
		confirmPassword: z.string()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});

export const forgotPasswordSchema = z.object({
	email: z.string().email('Enter a valid email')
});

export const resetPasswordSchema = z
	.object({
		password: passwordField,
		confirmPassword: z.string()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});
