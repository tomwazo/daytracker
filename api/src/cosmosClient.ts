import { CosmosClient, Container } from "@azure/cosmos";

let container: Container | undefined;

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
