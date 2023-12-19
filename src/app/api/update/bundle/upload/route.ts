import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import { createHash, hex2UUID } from "@/lib/crypto";
import { githubReleaseConnect } from "@/lib/githubReleaseConnect";
import {
  Manifest,
  ManifestBundle,
  Metadata,
  ModuleFederationConfig,
} from "@/types";

export async function POST(request: Request) {
  const githubRelease = githubReleaseConnect();

  const formData = await request.formData();

  const bundleFiles = formData.getAll("assets") as File[];
  const bundleFileMap = new Map(bundleFiles.map((b) => [b.name, b]));
  const name = formData.get("name") as string;
  const version = formData.get("version") as string;
  const releaseName = formData.get("releaseName") as string;
  const stringMetadata = formData.get("metadata") as string;
  const metadata = JSON.parse(stringMetadata) as Metadata;
  const moduleFederationConfig = JSON.parse(
    formData.get("moduleFederationConfig") as string
  ) as ModuleFederationConfig;
  const typescriptJson = (formData.getAll("typescriptJson") as File[])[0];

  const { url } = await put("__types_index.json", typescriptJson, {
    access: "public",
  });

  const commonManifest = {
    id: hex2UUID(createHash(Buffer.from(stringMetadata), "sha256", "hex")),
    createdAt: new Date().toISOString(),
    name,
    version,
    releaseName,
    bundler: metadata.bundler,
    moduleFederationConfig,
    typeServeUrl: url,
  } as Manifest;

  const platforms: ("ios" | "android" | "web")[] = [];
  if (metadata.bundleMetadata.ios) {
    platforms.push("ios");
  }
  if (metadata.bundleMetadata.android) {
    platforms.push("android");
  }
  if (metadata.bundleMetadata.web) {
    platforms.push("web");
  }

  const _manifests = await Promise.all(
    platforms.map(async (platform) => {
      const existRelease = await githubRelease.getRelease({
        id: commonManifest.id,
        name,
        platform,
        releaseName,
        version,
      });

      if (!existRelease) {
        const bundleMetadata = metadata.bundleMetadata[platform];

        const bundles = await Promise.all(
          bundleMetadata.map(async (asset) => {
            const bundle = bundleFileMap.get(asset.hash);
            if (!bundle)
              throw new Error(
                `Bundle "${asset.hash}" not found in uploaded files.`
              );

            const { url } = await put(asset.hash, bundle, {
              access: "public",
              addRandomSuffix: false,
            });

            return {
              url,
              hash: asset.hash,
              path: asset.path,
            } as ManifestBundle;
          })
        );

        return {
          ...commonManifest,
          platform,
          bundles,
        } as Manifest;
      }
    })
  );

  const manifests = _manifests.filter((manifest) => manifest) as Manifest[];
  const res = await Promise.all(
    manifests.map(async (manifest) => {
      return await githubRelease.createRelease({
        id: manifest.id,
        name: manifest.name,
        platform: manifest.platform,
        releaseName: manifest.releaseName,
        version: manifest.version,
        stringManifest: JSON.stringify(manifest),
      });
    })
  );

  if (res.length) {
    revalidatePath("/");
  }

  return new Response(undefined, { status: 200 });
}
