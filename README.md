# 🍞 Waya's Bakery

Personal blog & notes at **[waya.ink](https://waya.ink)**.

## Structure

- `content/notes/` — Short thoughts & daily notes (`/notes/`).
- `content/posts/` — Long-form articles (`/posts/`).
- `content/about.md` — About page (`/about/`).
- `layouts/` & `static/` — Theme templates, typography (`TsangerJinKai02`), styles & scripts.

## Writing

### Add a Note

Create `content/notes/YYYY-MM-DD-slug.md`:

```markdown
---
date: 2026-11-11T15:00:00+08:00
slug: "my-note"
category: "think"   # ai | make | code | tools | think | life
likes: 0
fold: false         # set true and add <!--more--> to fold long notes
tags: ["note"]
---

Write your thought here...
```

### Add a Blog Post

Create `content/posts/YYYY-MM-DD-slug.md`:

```markdown
---
title: "Post Title"
date: 2026-11-11T15:00:00+08:00
slug: "post-slug"
category: "engineering"  # engineering | ai | product | thought | life
description: "One-line summary"
---

Markdown content...
```

## Local Preview

```bash
hugo server -D
```
