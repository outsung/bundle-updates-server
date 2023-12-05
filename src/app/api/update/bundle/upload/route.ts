// import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  // const githubRelease = githubReleaseConnect();

  // const formData = await request.formData();

  // const { url } = await put(
  //   asset.ext ? `${fileName}.${asset.ext}` : fileName,
  //   file,
  //   { access: "public", addRandomSuffix: false }
  // );

  // await githubRelease.createRelease({
  //   id: manifest.id,
  //   platform: manifest.platform,
  //   releaseName: manifest.releaseName,
  //   runtimeVersion: manifest.runtimeVersion,
  //   stringManifest: JSON.stringify(manifest),
  // });

  const res = [];

  if (res.length) {
    revalidatePath("/");
  }

  return new Response(undefined, { status: 200 });
}
