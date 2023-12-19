export interface Metadata {
  version: 0;
  bundler: "webpack" | "repack" | "vite";
  bundleMetadata: Record<string, { path: string; hash: string }[]>;
}

export interface ModuleFederationConfig {
  url: string;
  name: string;
  port: string;
  dependencies: Record<string, string>;
  version: string;
}

export interface ManifestBundle {
  hash: string;
  url: string;
  path: string;
}

export interface Manifest {
  id: string;
  name: string;
  bundler: "webpack" | "repack" | "vite";
  platform: "ios" | "android" | "web";
  releaseName: string;
  version: string;
  createdAt: string;
  bundles: ManifestBundle[];
  moduleFederationConfig: ModuleFederationConfig;
  typeIndexJsonUrl: string;
}
