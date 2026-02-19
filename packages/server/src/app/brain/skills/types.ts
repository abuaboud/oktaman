/**
 * Metadata extracted from SKILL.md frontmatter.
 */
export interface SkillMetadata {
  /**
   * Unique skill name (kebab-case, e.g., 'web-research')
   */
  name: string;

  /**
   * Short description of what the skill does
   */
  description: string;

  /**
   * Absolute path to the SKILL.md file in ~/.oktaman/home/skills/
   */
  path: string;


}
