import { contract, Contract } from "./contract";
import { initClient } from "@ts-rest/core";

// Compile-time checks: these will fail at compile-time if types don't match

// Check contract type
const _contractCheck: Contract = contract;
void _contractCheck;

// Check client initialization
const _client = initClient(contract, { baseUrl: "http://localhost:3000" });
void _client;

// Check endpoint response shapes
type RegisterResponse = Contract["auth"]["register"]["responses"][201];
type _RegisterResponseCheck = RegisterResponse extends { accessToken: string } ? true : never;
void ({} as _RegisterResponseCheck);

type ListCategoriesResponse = Contract["categoryGroups"]["list"]["responses"][200];
type _ListCategoriesCheck = ListCategoriesResponse extends { categoryGroups: unknown[] } ? true : never;
void ({} as _ListCategoriesCheck);

type ApplyLayoutResponse = Contract["onboarding"]["applyLayout"]["responses"][200];
type _ApplyLayoutCheck = ApplyLayoutResponse extends { categoryGroups: unknown[]; created: boolean } ? true : never;
void ({} as _ApplyLayoutCheck);
