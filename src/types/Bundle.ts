export interface Metadata {
  version: 0;
  bundler: "webpack" | "repack" | "vite";
  bundleMetadata: Record<string, { path: string; hash: string }[]>;
}

export interface ManifestRemote {
  type: "local" | "server";
  url: string;
  name: string;
  configName: string;
  typeIndexJsonUrl: string;
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
  remotes: ManifestRemote[];
  typeIndexJsonUrl: string;
}
