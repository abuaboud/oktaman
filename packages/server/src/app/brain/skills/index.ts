import { readdir, readFile, stat, mkdir, copyFile } from 'fs/promises';
import { join } from 'path';
import { tryCatch } from '@oktaman/shared';
import { SkillMetadata } from './types';
import { SKILLS_DIR } from '../../common/system';

export const SKILLS = ['agent-browser'];

export const skillsLoader = {
  /**
   * List all available skills by scanning for SKILL.md files
   * Copies skills to ~/.oktaman/home/skills if they don't exist
   * Returns absolute paths to skills in ~/.oktaman/home/skills
   */
  list: async (): Promise<SkillMetadata[]> => {
    const sourceSkillsDir = __dirname;
    const skills: SkillMetadata[] = [];

    // Ensure skills directory exists in ~/.oktaman/home/skills
    await tryCatch(mkdir(SKILLS_DIR, { recursive: true }));

    const [dirError, entries] = await tryCatch(readdir(sourceSkillsDir));
    if (dirError) {
      console.error('Error reading skills directory:', dirError);
      return skills;
    }

    for (const entry of entries) {
      const sourceEntryPath = join(sourceSkillsDir, entry);
      const targetEntryPath = join(SKILLS_DIR, entry);

      // Check if it's a directory
      const [statError, stats] = await tryCatch(stat(sourceEntryPath));
      if (statError || !stats.isDirectory()) {
        continue;
      }

      const sourceSkillFilePath = join(sourceEntryPath, 'SKILL.md');
      const targetSkillFilePath = join(targetEntryPath, 'SKILL.md');

      // Try to read SKILL.md from source
      const [readError, content] = await tryCatch(readFile(sourceSkillFilePath, 'utf-8'));
      if (readError) {
        // Skip directories without SKILL.md
        continue;
      }

      // Copy skill directory to target if it doesn't exist or is outdated
      await copySkillDirectory(sourceEntryPath, targetEntryPath);

      // Parse metadata with absolute path to target
      const metadata = parseFrontmatter(content, targetSkillFilePath);
      if (metadata) {
        skills.push(metadata);
      }
    }

    return skills;
  },
};

/**
 * Build skills section for system prompt with progressive disclosure.
 */
export const buildSkillsPrompt = (skills: SkillMetadata[]): string => {
  if (skills.length === 0) {
    return '';
  }

  const skillsList = skills
    .map(skill => `- **${skill.name}**: ${skill.description}\n  → Use \`cat ${skill.path}\` for full instructions`)
    .join('\n');

  return `## Skills

Available skills for specialized tasks:

${skillsList}

**Usage:** When a task matches a skill, use \`cat {path}\` to read full instructions, then follow the workflow.`;
};

/**
 * Recursively copy skill directory from source to target
 */
async function copySkillDirectory(sourcePath: string, targetPath: string): Promise<void> {
  // Ensure target directory exists
  await tryCatch(mkdir(targetPath, { recursive: true }));

  const [readError, entries] = await tryCatch(readdir(sourcePath));
  if (readError) {
    console.error('Error reading source directory:', readError);
    return;
  }

  for (const entry of entries) {
    const sourceEntryPath = join(sourcePath, entry);
    const targetEntryPath = join(targetPath, entry);

    const [statError, stats] = await tryCatch(stat(sourceEntryPath));
    if (statError) {
      continue;
    }

    if (stats.isDirectory()) {
      // Recursively copy subdirectories
      await copySkillDirectory(sourceEntryPath, targetEntryPath);
    } else if (stats.isFile()) {
      // Copy file
      await tryCatch(copyFile(sourceEntryPath, targetEntryPath));
    }
  }
}

/**
 * Parse YAML frontmatter from SKILL.md content
 */
function parseFrontmatter(content: string, filePath: string): SkillMetadata | null {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return null;
  }

  const frontmatter = match[1];
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descriptionMatch = frontmatter.match(/^description:\s*(.+)$/m);

  if (!nameMatch || !descriptionMatch) {
    return null;
  }

  return {
    name: nameMatch[1].trim().replace(/['"]/g, ''),
    description: descriptionMatch[1].trim().replace(/['"]/g, ''),
    path: filePath,
  };
}
