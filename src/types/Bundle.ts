type ManifestDependencyType = "external" | "local" | "server";
type ManifestDependency = {
  type: ManifestDependencyType;
  version: string;
  url: string;
};
export interface Manifest {
  name: string;
  version: string;
  dependencies: Record<string, ManifestDependency>;
  chunkMetadata?: Record<string, string>;
}
