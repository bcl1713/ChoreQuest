import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../..");

function readText(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("semantic release pipeline configuration", () => {
  it("defines semantic-release for main with versioned file updates", () => {
    const releaseConfig = JSON.parse(readText(".releaserc.json"));

    expect(releaseConfig.branches).toEqual(["main"]);
    expect(releaseConfig.tagFormat).toBe("v${version}");

    expect(releaseConfig.plugins).toEqual(
      expect.arrayContaining([
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        ["@semantic-release/changelog", expect.objectContaining({ changelogFile: "CHANGELOG.md" })],
        ["@semantic-release/npm", expect.objectContaining({ npmPublish: false })],
        [
          "@semantic-release/git",
          expect.objectContaining({
            assets: expect.arrayContaining([
              "CHANGELOG.md",
              "package.json",
              "package-lock.json",
            ]),
          }),
        ],
        "@semantic-release/github",
      ]),
    );
  });

  it("runs a release workflow on main pushes and exposes manual dispatch", () => {
    const workflow = readText(".github/workflows/release.yml");

    expect(workflow).toContain("name: Release");
    expect(workflow).toContain("push:");
    expect(workflow).toContain("- main");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("node-version: 24");
    expect(workflow).toContain("semantic-release");
  });

  it("back-merges released main changes into develop only after a published release", () => {
    const workflow = readText(".github/workflows/backmerge-main-to-develop.yml");

    expect(workflow).toContain("name: Back-merge main into develop");
    expect(workflow).toContain("release:");
    expect(workflow).toContain("published");
    expect(workflow).toContain("github.event.release.target_commitish == 'main'");
    expect(workflow).toContain("git checkout develop");
    expect(workflow).toContain("git merge --no-ff origin/main");
    expect(workflow).toContain("git push origin develop");
  });
});
