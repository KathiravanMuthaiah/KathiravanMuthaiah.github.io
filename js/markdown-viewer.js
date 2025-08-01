document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("markdown-container");
  if (!container) return;

  const file = container.dataset.file;

  fetch(file)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(md => {
      // 1 Render Markdown to HTML using Marked.js
      container.innerHTML = marked.parse(md);

      // 2 Highlight regular code blocks
      hljs.highlightAll();

      // 3 Convert mermaid fenced code blocks to <div class="mermaid">
      container.querySelectorAll('pre code.language-mermaid').forEach(block => {
        const div = document.createElement('div');
        div.classList.add('mermaid');
        div.textContent = block.textContent; // keep inner text as raw mermaid code
        block.parentNode.replaceWith(div);
      });
      
      // 4 Force table styling if no CSS is applied
  container.querySelectorAll('table').forEach(tbl => {
    tbl.classList.add('table', 'table-striped', 'table-bordered', 'table-hover');

    // Inline fallback styling (guaranteed)
    tbl.style.borderCollapse = 'collapse';
    tbl.style.border = '1px solid #d0d7de';
    tbl.style.margin = '1rem 0';
    tbl.style.width = '100%';

    tbl.querySelectorAll('th, td').forEach(cell => {
      cell.style.border = '1px solid #d0d7de';
      cell.style.padding = '6px 13px';
    });

    tbl.querySelectorAll('tr:nth-child(even)').forEach(row => {
      row.style.backgroundColor = '#f6f8fa'; // GitHub-like striped rows
    });
  });

      // 5 Trigger Mermaid rendering if available
      if (window.mermaid) {
        mermaid.initialize({ startOnLoad: false });
        mermaid.run({ querySelector: ".mermaid" });
      }
      
      // 6 Trigger MathJax typesetting for equations
      if (window.MathJax) {
        window.MathJax.typesetPromise();
      }
      
     // 7 Minimal LoveIt-style Dynamic TOC generation
	
		
	console.log("🔹 Starting dynamic TOC generation...");

	const tocAuto = document.getElementById("toc-content-auto");
	if (!tocAuto) {
	  console.warn("⚠️ TOC container #toc-content-auto NOT found in DOM.");
	} else {
	  console.log("✅ Found #toc-content-auto container:", tocAuto);
	}

	const markdownContainer = document.getElementById("markdown-container");
	if (!markdownContainer) {
	  console.warn("⚠️ Markdown container #markdown-container NOT found in DOM.");
	} else {
	  console.log("✅ Found #markdown-container container:", markdownContainer);
	}

	if (tocAuto && markdownContainer) {
	  const tocNav = document.getElementById("TableOfContents");
	  if (!tocNav) {
	    console.warn("⚠️ <nav id='TableOfContents'> NOT found inside #toc-auto.");
	  } else {
	    console.log("✅ Found <nav id='TableOfContents'> inside #toc-auto:", tocNav);
	  }

	  const headings = markdownContainer.querySelectorAll("h1, h2, h3");
	  console.log("🔹 Headings detected inside #markdown-container:", headings.length);

	  if (tocNav && headings.length > 0) {
	    const ul = document.createElement("ul");

	    headings.forEach((h, idx) => {
	      // Generate a safe ID for the heading
	      const headingId =
		h.id ||
		h.textContent
		  .trim()
		  .replace(/\s+/g, "-")
		  .replace(/[^\w-]/g, "")
		  .toLowerCase();

	      h.id = headingId;
	      console.log(`  ➜ Heading ${idx + 1}: "${h.textContent}" -> #${headingId}`);

	      const li = document.createElement("li");
	      const a = document.createElement("a");
	      a.textContent = h.textContent;
	      a.href = "#" + headingId;

	      // Mark first heading as active for LoveIt styling
	      if (idx === 0) {
		li.classList.add("has-active");
		a.classList.add("active");
	      }

	      li.appendChild(a);
	      ul.appendChild(li);
	    });

	    // Clear any existing content and append generated TOC
	    tocNav.innerHTML = "";
	    tocNav.appendChild(ul);

	    console.log("✅ Dynamic TOC successfully generated with", headings.length, "entries.");
	  } else {
	    console.warn("⚠️ TOC generation skipped: either no headings or tocNav missing.");
	  }
	}


      
    })
    .catch(err => {
      container.innerHTML = `<p style="color:red">Failed to load markdown: ${err}</p>`;
      console.error(err);
    });
});

