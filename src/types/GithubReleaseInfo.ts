export interface GithubReleaseInfo {
  draft: boolean;
  prerelease: boolean;
  tag_name: string;
  body: string;
  published_at: string;
}

export interface GithubReleaseInfoEntity {
  id: string;
  name: string;
  releaseName: string;
  version: string;
  platform: string;
  stringManifest: string;
  createdAt: string;
}
