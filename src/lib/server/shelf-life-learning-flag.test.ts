import { describe, expect, it, afterEach } from 'vitest';
import {
	isShelfLifeEstimatesInReceiptEnabled,
	isShelfLifeLearningEnabled,
	isShelfLifeLlmEnabled
} from './shelf-life-learning-flag';

describe('shelf-life-learning-flag', () => {
	const originalLearning = process.env.SHELF_LIFE_LEARNING_ENABLED;
	const originalPublic = process.env.PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT;
	const originalLlm = process.env.SHELF_LIFE_LLM_ENABLED;

	afterEach(() => {
		if (originalLearning === undefined) {
			delete process.env.SHELF_LIFE_LEARNING_ENABLED;
		} else {
			process.env.SHELF_LIFE_LEARNING_ENABLED = originalLearning;
		}
		if (originalPublic === undefined) {
			delete process.env.PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT;
		} else {
			process.env.PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT = originalPublic;
		}
		if (originalLlm === undefined) {
			delete process.env.SHELF_LIFE_LLM_ENABLED;
		} else {
			process.env.SHELF_LIFE_LLM_ENABLED = originalLlm;
		}
	});

	it('defaults learning flag to false', () => {
		delete process.env.SHELF_LIFE_LEARNING_ENABLED;
		expect(isShelfLifeLearningEnabled()).toBe(false);
	});

	it('enables learning when env is true', () => {
		process.env.SHELF_LIFE_LEARNING_ENABLED = 'true';
		expect(isShelfLifeLearningEnabled()).toBe(true);
	});

	it('defaults receipt estimates to learning flag when PUBLIC unset', () => {
		delete process.env.PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT;
		delete process.env.SHELF_LIFE_LEARNING_ENABLED;
		expect(isShelfLifeEstimatesInReceiptEnabled()).toBe(false);

		process.env.SHELF_LIFE_LEARNING_ENABLED = 'true';
		expect(isShelfLifeEstimatesInReceiptEnabled()).toBe(true);
	});

	it('respects explicit PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT', () => {
		process.env.SHELF_LIFE_LEARNING_ENABLED = 'false';
		process.env.PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT = 'true';
		expect(isShelfLifeEstimatesInReceiptEnabled()).toBe(true);

		process.env.PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT = 'false';
		expect(isShelfLifeEstimatesInReceiptEnabled()).toBe(false);
	});

	it('defaults LLM flag to false', () => {
		delete process.env.SHELF_LIFE_LLM_ENABLED;
		expect(isShelfLifeLlmEnabled()).toBe(false);
	});
});
