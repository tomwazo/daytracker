/**
 * cosmosClient.ts — Singleton Azure Cosmos DB connection manager.
 *
 * Provides a lazily-initialised reference to the "entries" container in the
 * "daytracker" Cosmos DB database. The container is created once on first
 * access and reused across all subsequent function invocations within the
 * same process, avoiding repeated client construction.
 *
 * Required environment variables:
 *   COSMOS_ENDPOINT — The Cosmos DB account URI
 *   COSMOS_KEY      — The Cosmos DB account primary key
 *   COSMOS_DATABASE — (optional) Database name, defaults to "daytracker"
 */
import { CosmosClient, Container } from "@azure/cosmos";

/** Cached container reference — reused across function invocations */
let container: Container | undefined;

/**
 * Returns a reference to the Cosmos DB "entries" container.
 * On first call, reads connection settings from environment variables,
 * constructs the CosmosClient, and caches the container reference.
 * Subsequent calls return the cached container immediately.
 *
 * @throws Error if COSMOS_ENDPOINT or COSMOS_KEY are not set
 */
export function getContainer(): Container {
  if (container) return container;

  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;
  const databaseId = process.env.COSMOS_DATABASE || "daytracker";

  if (!endpoint || !key) {
    throw new Error("COSMOS_ENDPOINT and COSMOS_KEY must be set");
  }

  const client = new CosmosClient({ endpoint, key });
  container = client.database(databaseId).container("entries");
  return container;
}
