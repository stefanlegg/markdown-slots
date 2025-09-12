#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

interface VersionConfig {
  name: string;
  version: string;
  [key: string]: any;
}

type VersionType = 'patch' | 'minor' | 'major';

async function runCommand(command: string[]): Promise<{ success: boolean; output: string }> {
  const cmd = new Deno.Command(command[0], {
    args: command.slice(1),
    stdout: 'piped',
    stderr: 'piped',
  });
  
  const { code, stdout, stderr } = await cmd.output();
  const output = new TextDecoder().decode(code === 0 ? stdout : stderr).trim();
  
  return { success: code === 0, output };
}

function parseVersion(version: string): [number, number, number] {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return [parts[0], parts[1], parts[2]];
}

function incrementVersion(version: string, type: VersionType): string {
  const [major, minor, patch] = parseVersion(version);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
  }
}

async function checkGitStatus(): Promise<void> {
  const { success, output } = await runCommand(['git', 'status', '--porcelain']);
  
  if (!success) {
    throw new Error('Failed to check git status');
  }
  
  if (output.trim() !== '') {
    console.error('Error: You have uncommitted changes. Please commit or stash them before bumping the version.');
    Deno.exit(1);
  }
}

async function getCurrentVersion(): Promise<string> {
  try {
    const content = await Deno.readTextFile('deno.json');
    const config: VersionConfig = JSON.parse(content);
    return config.version;
  } catch (error) {
    throw new Error(`Failed to read version from deno.json: ${error.message}`);
  }
}

async function updateVersion(newVersion: string): Promise<void> {
  try {
    const content = await Deno.readTextFile('deno.json');
    const config: VersionConfig = JSON.parse(content);
    config.version = newVersion;
    
    await Deno.writeTextFile('deno.json', JSON.stringify(config, null, 2) + '\n');
  } catch (error) {
    throw new Error(`Failed to update version in deno.json: ${error.message}`);
  }
}

async function main() {
  const args = Deno.args;
  const versionType = (args[0] as VersionType) || 'patch';
  
  if (!['patch', 'minor', 'major'].includes(versionType)) {
    console.error('Error: Version type must be one of: patch, minor, major');
    Deno.exit(1);
  }
  
  try {
    console.log('🔍 Checking git status...');
    await checkGitStatus();
    
    console.log('📖 Reading current version...');
    const currentVersion = await getCurrentVersion();
    const newVersion = incrementVersion(currentVersion, versionType);
    
    console.log(`📦 Bumping version: ${currentVersion} → ${newVersion}`);
    
    console.log('🔄 Checking out main and pulling latest...');
    const checkoutResult = await runCommand(['git', 'checkout', 'main']);
    if (!checkoutResult.success) {
      throw new Error(`Failed to checkout main: ${checkoutResult.output}`);
    }
    
    const pullResult = await runCommand(['git', 'pull', 'origin', 'main']);
    if (!pullResult.success) {
      throw new Error(`Failed to pull latest main: ${pullResult.output}`);
    }
    
    const branchName = `release/v${newVersion}`;
    console.log(`🌿 Creating branch: ${branchName}`);
    const branchResult = await runCommand(['git', 'checkout', '-b', branchName]);
    if (!branchResult.success) {
      throw new Error(`Failed to create branch: ${branchResult.output}`);
    }
    
    console.log('✏️  Updating deno.json...');
    await updateVersion(newVersion);
    
    console.log('➕ Staging changes...');
    const addResult = await runCommand(['git', 'add', 'deno.json']);
    if (!addResult.success) {
      throw new Error(`Failed to stage changes: ${addResult.output}`);
    }
    
    const commitMessage = `chore: bump version to ${newVersion}`;
    console.log(`💾 Creating commit: "${commitMessage}"`);
    const commitResult = await runCommand(['git', 'commit', '-m', commitMessage]);
    if (!commitResult.success) {
      throw new Error(`Failed to create commit: ${commitResult.output}`);
    }
    
    const tagName = `v${newVersion}`;
    console.log(`🏷️  Creating tag: ${tagName}`);
    const tagResult = await runCommand(['git', 'tag', tagName]);
    if (!tagResult.success) {
      throw new Error(`Failed to create tag: ${tagResult.output}`);
    }
    
    console.log('🚀 Pushing branch and tags...');
    const pushBranchResult = await runCommand(['git', 'push', '-u', 'origin', branchName]);
    if (!pushBranchResult.success) {
      throw new Error(`Failed to push branch: ${pushBranchResult.output}`);
    }
    
    const pushTagResult = await runCommand(['git', 'push', 'origin', tagName]);
    if (!pushTagResult.success) {
      throw new Error(`Failed to push tag: ${pushTagResult.output}`);
    }
    
    console.log('✅ Version bump completed successfully!');
    console.log(`   Version: ${currentVersion} → ${newVersion}`);
    console.log(`   Branch: ${branchName}`);
    console.log(`   Tag: ${tagName}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}