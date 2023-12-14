import { githubReleaseConnect } from "@/lib/githubReleaseConnect";

export async function GET(
  request: Request,
  { params }: { params: { name: string; releaseName: string } }
) {
  const { searchParams } = new URL(request.url);

  const name = params.name;
  const releaseName = params.releaseName;
  const version = searchParams.get("version");
  const platform = searchParams.get("platform");

  if (!name || !releaseName || !version || !platform) {
    throw new Error(
      "Missing required parameters. Please provide values for 'name', 'releaseName', 'version', and 'platform'."
    );
  }

  const release = await githubReleaseConnect().getRelease({
    name,
    version,
    platform,
    releaseName,
  });

  if (!release) {
    return Response.json({ message: "Cannot Find Manifest" }, { status: 404 });
  }

  return new Response(release.stringManifest);
}
