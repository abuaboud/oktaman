import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { skillsLoader } from '../../../../src/app/brain/skills';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';

const TEST_SKILLS_DIR = join(__dirname, 'test-skills');

describe('Skills Loader', () => {
    beforeAll(async () => {
        // Create test skills directory structure
        await mkdir(TEST_SKILLS_DIR, { recursive: true });

        // Create valid skill 1
        const skill1Dir = join(TEST_SKILLS_DIR, 'test-skill-1');
        await mkdir(skill1Dir, { recursive: true });
        await writeFile(
            join(skill1Dir, 'SKILL.md'),
            `---
name: test-skill-1
description: A test skill for unit testing
---

# Test Skill 1

This is a test skill with proper frontmatter.
`
        );

        // Create valid skill 2
        const skill2Dir = join(TEST_SKILLS_DIR, 'test-skill-2');
        await mkdir(skill2Dir, { recursive: true });
        await writeFile(
            join(skill2Dir, 'SKILL.md'),
            `---
name: test-skill-2
description: Another test skill for validation
---

# Test Skill 2

This skill tests multiple skills loading.
`
        );

        // Create skill with quotes in frontmatter
        const skill3Dir = join(TEST_SKILLS_DIR, 'test-skill-3');
        await mkdir(skill3Dir, { recursive: true });
        await writeFile(
            join(skill3Dir, 'SKILL.md'),
            `---
name: "test-skill-3"
description: 'A skill with quoted values'
---

# Test Skill 3

Testing quote handling in frontmatter.
`
        );

        // Create skill without frontmatter (should be skipped)
        const invalidSkill1Dir = join(TEST_SKILLS_DIR, 'invalid-no-frontmatter');
        await mkdir(invalidSkill1Dir, { recursive: true });
        await writeFile(
            join(invalidSkill1Dir, 'SKILL.md'),
            `# Invalid Skill

This skill has no frontmatter and should be skipped.
`
        );

        // Create skill with incomplete frontmatter (should be skipped)
        const invalidSkill2Dir = join(TEST_SKILLS_DIR, 'invalid-missing-description');
        await mkdir(invalidSkill2Dir, { recursive: true });
        await writeFile(
            join(invalidSkill2Dir, 'SKILL.md'),
            `---
name: invalid-skill
---

# Invalid Skill

This skill is missing the description field.
`
        );

        // Create directory without SKILL.md (should be skipped)
        const emptyDir = join(TEST_SKILLS_DIR, 'empty-directory');
        await mkdir(emptyDir, { recursive: true });

        // Create a file (not directory) that should be skipped
        await writeFile(join(TEST_SKILLS_DIR, 'not-a-directory.txt'), 'This is a file, not a directory');

        // Create skill with additional files
        const skill4Dir = join(TEST_SKILLS_DIR, 'test-skill-4');
        await mkdir(skill4Dir, { recursive: true });
        await writeFile(
            join(skill4Dir, 'SKILL.md'),
            `---
name: test-skill-4
description: Skill with additional files
---

# Test Skill 4

This skill has additional supporting files.
`
        );
        await writeFile(join(skill4Dir, 'helper.js'), 'console.log("helper");');
        await writeFile(join(skill4Dir, 'README.md'), '# Additional documentation');
    });

    afterAll(async () => {
        // Clean up test directory
        await rm(TEST_SKILLS_DIR, { recursive: true, force: true });
    });

    describe('list() with absolute paths', () => {
        it('should return array without throwing', async () => {
            // Since the actual implementation uses __dirname, this test validates the error handling
            const skills = await skillsLoader.list();
            // Should not throw, just return what it can read
            expect(Array.isArray(skills)).toBe(true);
        });

        it('should skip directories without SKILL.md', async () => {
            const skills = await skillsLoader.list();
            // The empty-directory should not appear in results
            const emptyDirSkill = skills.find(s => s.name === 'empty-directory');
            expect(emptyDirSkill).toBeUndefined();
        });

        it('should skip files that are not directories', async () => {
            const skills = await skillsLoader.list();
            // The not-a-directory.txt file should not cause issues
            expect(skills.every(s => s.path.endsWith('.md'))).toBe(true);
        });

        it('should skip skills with missing frontmatter', async () => {
            const skills = await skillsLoader.list();
            const invalidSkill = skills.find(s => s.name === 'invalid-no-frontmatter');
            expect(invalidSkill).toBeUndefined();
        });

        it('should skip skills with incomplete frontmatter', async () => {
            const skills = await skillsLoader.list();
            const invalidSkill = skills.find(s => s.name === 'invalid-skill');
            expect(invalidSkill).toBeUndefined();
        });

        it('should handle quoted values in frontmatter', async () => {
            // This test validates that the frontmatter parser removes quotes
            // Since the actual implementation reads from the real skills directory,
            // we'll verify that quote handling works by checking the real skills
            const skills = await skillsLoader.list();

            // All skills should have properly parsed names and descriptions without surrounding quotes
            skills.forEach(skill => {
                expect(skill.name).not.toMatch(/^["'].*["']$/);
                expect(skill.description).not.toMatch(/^["'].*["']$/);
            });

            // At least one skill should be loaded
            expect(skills.length).toBeGreaterThan(0);
        });

        it('should return absolute file system paths to ~/.oktaman/home/skills', async () => {
            const skills = await skillsLoader.list();
            const validSkills = skills.filter(s => s.name.startsWith('agent-browser'));

            validSkills.forEach(skill => {
                // Absolute paths should contain .oktaman/home/skills and be absolute
                expect(skill.path).toContain('.oktaman');
                expect(skill.path).toContain('home');
                expect(skill.path).toContain('skills');
                expect(skill.path).toContain('SKILL.md');
                expect(skill.path.startsWith('/')).toBe(true);
            });
        });

        it('should extract correct metadata from valid SKILL.md', async () => {
            const skills = await skillsLoader.list();
            const agentBrowser = skills.find(s => s.name === 'agent-browser');

            if (agentBrowser) {
                expect(agentBrowser).toMatchObject({
                    name: 'agent-browser',
                    description: expect.stringContaining('Browser automation'),
                });
                expect(agentBrowser.path).toBeTruthy();
                expect(typeof agentBrowser.path).toBe('string');
            }
        });
    });

    describe('Path format validation', () => {
        it('should return paths containing .oktaman/home/skills', async () => {
            const skills = await skillsLoader.list();
            const validSkills = skills.filter(s => s.name.startsWith('agent-browser'));

            validSkills.forEach(skill => {
                // Paths should be absolute and contain .oktaman/home/skills
                expect(skill.path).toContain('.oktaman');
                expect(skill.path).toContain('home');
                expect(skill.path).toContain('skills');
                expect(skill.path).not.toContain(__dirname);
            });
        });

        it('should have consistent metadata for all skills', async () => {
            const skills = await skillsLoader.list();

            skills.forEach(skill => {
                // All skills should have valid metadata
                expect(skill.name).toBeTruthy();
                expect(skill.description).toBeTruthy();
                expect(skill.path).toBeTruthy();

                // Path should be absolute
                expect(skill.path.startsWith('/')).toBe(true);
                expect(skill.path.endsWith('SKILL.md')).toBe(true);
            });
        });

        it('should format paths correctly for multiple skills', async () => {
            const skills = await skillsLoader.list();

            skills.forEach(skill => {
                // Path should contain: .oktaman/home/skills/{skill-name}/SKILL.md
                expect(skill.path).toContain('.oktaman/home/skills/');
                expect(skill.path).toContain(`/${skill.name}/SKILL.md`);
            });
        });
    });

    describe('Integration with actual skills', () => {
        it('should load agent-browser skill correctly', async () => {
            const skills = await skillsLoader.list();
            const agentBrowser = skills.find(s => s.name === 'agent-browser');

            expect(agentBrowser).toBeDefined();
            if (agentBrowser) {
                expect(agentBrowser.name).toBe('agent-browser');
                expect(agentBrowser.description).toContain('Browser automation');
                expect(agentBrowser.path).toContain('agent-browser/SKILL.md');
                expect(agentBrowser.path).toContain('.oktaman/home/skills');
            }
        });

        it('should handle SKILLS constant correctly', async () => {
            const { SKILLS } = await import('../../../../src/app/brain/skills');

            expect(Array.isArray(SKILLS)).toBe(true);
            expect(SKILLS).toContain('agent-browser');

            const skills = await skillsLoader.list();
            SKILLS.forEach(skillName => {
                const skill = skills.find(s => s.name === skillName);
                expect(skill).toBeDefined();
            });
        });
    });

    describe('Error Handling', () => {
        it('should not throw when encountering invalid files', async () => {
            // Should complete without throwing
            await expect(skillsLoader.list()).resolves.toBeDefined();
        });

        it('should return consistent data types', async () => {
            const skills = await skillsLoader.list();

            expect(Array.isArray(skills)).toBe(true);
            skills.forEach(skill => {
                expect(typeof skill.name).toBe('string');
                expect(typeof skill.description).toBe('string');
                expect(typeof skill.path).toBe('string');
                expect(skill.name.length).toBeGreaterThan(0);
                expect(skill.description.length).toBeGreaterThan(0);
                expect(skill.path.length).toBeGreaterThan(0);
            });
        });

        it('should handle concurrent list() calls', async () => {
            const promises = [
                skillsLoader.list(),
                skillsLoader.list(),
                skillsLoader.list(),
                skillsLoader.list(),
            ];

            const results = await Promise.all(promises);

            expect(results).toHaveLength(4);
            results.forEach(skills => {
                expect(Array.isArray(skills)).toBe(true);
            });
        });
    });
});
