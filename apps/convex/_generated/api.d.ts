/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as bank_private_helpers from "../bank/private/helpers.js";
import type * as bank_public_mutations from "../bank/public/mutations.js";
import type * as bank_public_queries from "../bank/public/queries.js";
import type * as examSession_private_helpers from "../examSession/private/helpers.js";
import type * as examSession_public_mutations from "../examSession/public/mutations.js";
import type * as examSession_public_queries from "../examSession/public/queries.js";
import type * as http from "../http.js";
import type * as model_auth from "../model/auth.js";
import type * as students_private_mutations from "../students/private/mutations.js";
import type * as students_public_actions from "../students/public/actions.js";
import type * as students_public_queries from "../students/public/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "bank/private/helpers": typeof bank_private_helpers;
  "bank/public/mutations": typeof bank_public_mutations;
  "bank/public/queries": typeof bank_public_queries;
  "examSession/private/helpers": typeof examSession_private_helpers;
  "examSession/public/mutations": typeof examSession_public_mutations;
  "examSession/public/queries": typeof examSession_public_queries;
  http: typeof http;
  "model/auth": typeof model_auth;
  "students/private/mutations": typeof students_private_mutations;
  "students/public/actions": typeof students_public_actions;
  "students/public/queries": typeof students_public_queries;
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

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
