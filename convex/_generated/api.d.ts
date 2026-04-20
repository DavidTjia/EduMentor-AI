/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as learningPlans from "../learningPlans.js";
import type * as learningSessions from "../learningSessions.js";
import type * as progress from "../progress.js";
import type * as telegram from "../telegram.js";
import type * as telegramDb from "../telegramDb.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  crons: typeof crons;
  http: typeof http;
  learningPlans: typeof learningPlans;
  learningSessions: typeof learningSessions;
  progress: typeof progress;
  telegram: typeof telegram;
  telegramDb: typeof telegramDb;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
