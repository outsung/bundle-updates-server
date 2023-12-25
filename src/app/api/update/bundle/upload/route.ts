import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import { createHash, hex2UUID } from "@/lib/crypto";
import { githubReleaseConnect } from "@/lib/githubReleaseConnect";
import { Manifest, ManifestBundle, Metadata, ManifestRemote } from "@/types";

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
  const remotes = JSON.parse(
    formData.get("remotes") as string
  ) as ManifestRemote[];

  const typeFiles = formData.getAll("types") as File[];
  const typeFileMap = new Map(typeFiles.map((t) => [t.name, t]));
  const typeIndexJsonFile = (formData.getAll("typeIndexJson") as File[])[0];
  const _typeIndexJson = JSON.parse(
    Buffer.from(await typeIndexJsonFile.arrayBuffer()).toString()
  ) as { publicPath: string; files: Record<string, string> };

  const files = await Promise.all(
    Object.entries(_typeIndexJson.files).map(async ([path, hash]) => {
      const typeFile = typeFileMap.get(hash);
      if (!typeFile)
        throw new Error(
          `Type file "${hash}" not found in uploaded type files.`
        );

      const { url } = await put(hash, typeFile, {
        access: "public",
        addRandomSuffix: false,
      });

      return { path, url, hash };
    })
  );

  const typeIndexJson = JSON.stringify({ ..._typeIndexJson, files });

  const { url: typeIndexJsonUrl } = await put(
    hex2UUID(createHash(Buffer.from(typeIndexJson), "sha256", "hex")),
    typeIndexJson,
    { access: "public", addRandomSuffix: false }
  );

  await Promise.all(
    typeFiles.map(async (typeFile) => {
      const { url } = await put(`@mf-types/${typeFile.name}`, typeFile, {
        access: "public",
        addRandomSuffix: false,
      });

      return url;
    })
  );

  const commonManifest = {
    id: hex2UUID(createHash(Buffer.from(stringMetadata), "sha256", "hex")),
    createdAt: new Date().toISOString(),
    name,
    version,
    releaseName,
    bundler: metadata.bundler,
    remotes,
    typeIndexJsonUrl,
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
