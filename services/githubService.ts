
export interface GitHubPRData {
  title: string;
  description: string;
  code: string;
  owner: string;
  repo: string;
  number: string;
}

export const parseGitHubUrl = (url: string) => {
  try {
    // Expected format: https://github.com/owner/repo/pull/number
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'github.com') return null;
    
    const parts = urlObj.pathname.split('/').filter(Boolean);
    // parts[0] = owner, parts[1] = repo, parts[2] = pull, parts[3] = number
    if (parts.length < 4 || parts[2] !== 'pull') return null;
    
    return {
      owner: parts[0],
      repo: parts[1],
      number: parts[3]
    };
  } catch (e) {
    return null;
  }
};

export const fetchPRData = async (url: string): Promise<GitHubPRData> => {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error("Invalid GitHub Pull Request URL");
  }

  // Fetch PR Details
  const prResponse = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/pulls/${parsed.number}`);
  if (!prResponse.ok) {
    if (prResponse.status === 403) throw new Error("GitHub API rate limit exceeded. Please try again later.");
    if (prResponse.status === 404) throw new Error("Repository or PR not found (Check if it's public).");
    throw new Error("Failed to fetch PR details.");
  }
  const prData = await prResponse.json();

  // Fetch PR Files
  const filesResponse = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/pulls/${parsed.number}/files`);
  if (!filesResponse.ok) {
    throw new Error("Failed to fetch PR files.");
  }
  const filesData = await filesResponse.json() as any[];

  // Construct code representation
  let codeCombined = '';
  for (const file of filesData) {
    codeCombined += `// File: ${file.filename}\n`;
    codeCombined += `// Status: ${file.status}\n`;
    if (file.patch) {
      codeCombined += `${file.patch}\n\n`;
    } else {
      codeCombined += `// (Binary or large file content hidden)\n\n`;
    }
  }

  return {
    title: prData.title,
    description: prData.body || '',
    code: codeCombined,
    owner: parsed.owner,
    repo: parsed.repo,
    number: parsed.number
  };
};
