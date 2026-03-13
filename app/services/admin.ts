// This file is a backward-compatibility shim.
// The admin service has been decomposed into domain modules under app/services/admin/.
// All exports are re-exported here so existing imports continue to work unchanged.

export { default } from './admin/index';
export * from './admin/index';
