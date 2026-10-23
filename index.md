---
layout: default
home: true
title: The CCA Study Book
---
{% include book.html %}
<p class="eyebrow">Claude Certified Architect · Self-study · 2026 edition</p>
<h1 class="title">The CCA Study Book</h1>

<div class="lede" markdown="1">
These are study notes for the Claude Certified Architect exam. They start from how a language model works, build up through tools, the Model Context Protocol and agents, cover Claude Code, then bring everything up to date with the 2026 platform and finish with six practice scenarios and three mock exams.

This is not an official guide. The exam's domain weights and scenario list come from third-party summaries, so check them against Anthropic's own exam guide before you rely on them. Each note says when it was last verified.
</div>

<p class="go"><a href="{{ '/study_materials/W1-D1_LLMs_Explained_From_Scratch.html' | relative_url }}">Start with the first session →</a></p>
<p class="go2">Or follow the <a href="{{ '/FINISH_PLAN.html' | relative_url }}">eight-week finish plan</a>.</p>
<p class="label plan-home" id="plan-home"></p>

<p class="weights" aria-label="Exam domain weights">{% for d in site.data.domains %}<span data-domain="{{ d[0] }}"><i></i>{{ d[1].label }} {{ d[1].weight }}</span>{% endfor %}</p>

<h2 class="toc-h" id="contents">Contents</h2>
<ol class="toc">
{% for part in site.data.parts %}{% assign items = book | where: "part", part.slug %}{% if part.slug == "extras" %}<li class="toc-gap" aria-hidden="true"></li>{% endif %}
<li><a href="{{ items.first.url | relative_url }}" data-part="{{ part.slug }}"><span class="toc-n">{{ part.numeral }}</span><span class="toc-title">{{ part.title }}</span><span class="toc-count">{{ items.size }} {% if items.size == 1 %}note{% else %}notes{% endif %}<span data-part-read="{{ part.slug }}"></span></span><span class="toc-line">{{ part.blurb }}</span></a></li>
{% endfor %}
</ol>
