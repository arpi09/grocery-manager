import { env } from '$env/dynamic/private';
import { configureMarketV01Env } from '$lib/domain/market-v01';

configureMarketV01Env(() => env.MARKET_V01_DISABLED);
