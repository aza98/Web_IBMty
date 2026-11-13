# Using the Skill in Codex and Claude

This package uses the Agent Skills format: `SKILL.md` with `name` and `description`, relative references, and optional Codex metadata in `agents/openai.yaml`. It requires no scripts, dependencies, or connectors. Keep the entire folder together when moving it.

## Manual installation

Extract `laws-of-ux-design.zip` and place the `laws-of-ux-design` folder in a location matching the desired scope:

| Assistant | This project | All your projects |
| --- | --- | --- |
| Codex | `.agents/skills/` | `~/.agents/skills/` |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |

Codex installations using `~/.codex/skills/` can store the folder there and link to it from `~/.agents/skills/`. Both assistants support symlinked skill folders. Use one editable source to prevent copies from diverging. Review an existing skill before replacing it.

For Claude interfaces that support skill uploads, use the ZIP when that feature is available; installing locally for Claude Code does not automatically install the package in a web account. Local use does not require uploading files to any service.

## Invocation

In Codex: `$laws-of-ux-design Redesign this form and check its error states.`

In Claude Code: `/laws-of-ux-design Audit this registration flow without modifying files.`

For a comprehensive review: `Use laws-of-ux-design to review all 30 entries; identify which apply, which do not, and which you cannot verify.`

The skill can also be selected automatically when it matches the task. If it does not appear, start a new session. Menu names and availability depend on the client.

## Compatibility sources

- [Codex skills](https://learn.chatgpt.com/docs/build-skills)
- [Claude Code skills](https://code.claude.com/docs/en/skills)
- [Laws of UX collection](https://lawsofux.com/); individual sources appear in each reference.

Format and catalog reviewed on October 23, 2026. Structural validation does not replace an invocation test in each client.
