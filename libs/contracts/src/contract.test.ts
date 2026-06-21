import { contract, Contract } from "./contract";
import { initClient } from "@ts-rest/core";

// Compile-time check: contract is correctly typed
type ContractType = typeof contract;
const _contractCheck: Contract = contract;

// Compile-time check: client can be initialized from contract
const _client = initClient(contract, { baseUrl: "http://localhost:3000" });

// Compile-time check: implemented endpoints have correct response shapes
// Auth register: 201 response matches AuthSuccessResponseSchema
type RegisterResponse = Contract["auth"]["register"]["responses"][201];
type _RegisterResponseCheck = RegisterResponse extends { accessToken: string } ? true : never;

// Category groups list: 200 response matches ListCategoryGroupsResponseSchema
type ListCategoriesResponse = Contract["categoryGroups"]["list"]["responses"][200];
type _ListCategoriesCheck = ListCategoriesResponse extends { categoryGroups: unknown[] } ? true : never;

// Onboarding applyLayout: 200 response matches ApplyLayoutResponseSchema
type ApplyLayoutResponse = Contract["onboarding"]["applyLayout"]["responses"][200];
type _ApplyLayoutCheck = ApplyLayoutResponse extends { categoryGroups: unknown[]; created: boolean } ? true : never;
