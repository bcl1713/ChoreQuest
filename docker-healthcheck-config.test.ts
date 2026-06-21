import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname);

function readText(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("production Docker healthcheck configuration", () => {
  it("probes the IPv4 loopback address while the app listens on all container interfaces", () => {
    const compose = readText("docker-compose.prod.yml");
    const dockerfile = readText("Dockerfile");

    expect(compose).toContain("HOSTNAME=${HOSTNAME_OVERRIDE:-0.0.0.0}");
    expect(compose).toContain("HOST=0.0.0.0");
    expect(compose).toContain("http://127.0.0.1:3000/api/health");
    expect(compose).not.toContain("http://localhost:3000/api/health");

    expect(dockerfile).toContain("http://127.0.0.1:3000/api/health");
    expect(dockerfile).not.toContain("http://localhost:3000/api/health");
  });
});
