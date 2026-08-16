import os

skills_dir = os.path.join("public", "originkit", "hero-06", "skills")
os.makedirs(skills_dir, exist_ok=True)

skill_items = [
    # Programming Languages & Frameworks
    {
        "id": "typescript",
        "name": "TypeScript",
        "tag": "LANGUAGE",
        "tag_color": "#3178C6",
        "bg": "#F0F6FC",
        "border": "#3178C6",
        "inner_svg": """
            <rect x="55" y="55" width="130" height="130" rx="24" fill="#3178C6" />
            <text x="120" y="146" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="70" fill="#FFFFFF" text-anchor="middle" letter-spacing="-2">TS</text>
        """
    },
    {
        "id": "python",
        "name": "Python",
        "tag": "LANGUAGE",
        "tag_color": "#3776AB",
        "bg": "#F4F7FB",
        "border": "#3776AB",
        "inner_svg": """
            <g transform="translate(120, 115) scale(3.0)">
                <path d="M-0.2 -18 C-7.5 -18 -12 -14 -12 -8 L-12 -3 L-2 -3 L-2 -1.5 L-15 -1.5 C-20 -1.5 -22 3 -22 8 C-22 13 -18 17.5 -12 17.5 L-9 17.5 L-9 13.5 C-9 9.5 -5.5 6 -1.5 6 L8.5 6 C12 6 15 3 15 -0.5 L15 -8 C15 -14 10.5 -18 -0.2 -18 Z M-5.5 -13.5 C-4.4 -13.5 -3.5 -12.6 -3.5 -11.5 C-3.5 -10.4 -4.4 -9.5 -5.5 -9.5 C-6.6 -9.5 -7.5 -10.4 -7.5 -11.5 C-7.5 -12.6 -6.6 -13.5 -5.5 -13.5 Z" fill="#3776AB" />
                <path d="M0.2 18 C7.5 18 12 14 12 8 L12 3 L2 3 L2 1.5 L15 1.5 C20 1.5 22 -3 22 -8 C22 -13 18 -17.5 12 -17.5 L9 -17.5 L9 -13.5 C9 -9.5 5.5 -6 1.5 -6 L-8.5 -6 C-12 -6 -15 -3 -15 0.5 L-15 8 C-15 14 -10.5 18 0.2 18 Z M5.5 13.5 C4.4 13.5 3.5 12.6 3.5 11.5 C3.5 10.4 4.4 9.5 5.5 9.5 C6.6 9.5 7.5 10.4 7.5 11.5 C7.5 12.6 6.6 13.5 5.5 13.5 Z" fill="#FFD43B" />
            </g>
        """
    },
    {
        "id": "react",
        "name": "React",
        "tag": "FRAMEWORK",
        "tag_color": "#00D8FF",
        "bg": "#F0FAFD",
        "border": "#00D8FF",
        "inner_svg": """
            <g transform="translate(120, 115)">
                <ellipse rx="65" ry="24" fill="none" stroke="#00D8FF" stroke-width="6" />
                <ellipse rx="65" ry="24" fill="none" stroke="#00D8FF" stroke-width="6" transform="rotate(60)" />
                <ellipse rx="65" ry="24" fill="none" stroke="#00D8FF" stroke-width="6" transform="rotate(120)" />
                <circle r="14" fill="#00D8FF" />
            </g>
        """
    },
    {
        "id": "rust",
        "name": "Rust",
        "tag": "SYSTEMS",
        "tag_color": "#CE412B",
        "bg": "#FDF3F1",
        "border": "#CE412B",
        "inner_svg": """
            <g transform="translate(120, 115)">
                <circle r="56" fill="none" stroke="#CE412B" stroke-width="10" stroke-dasharray="14 6" />
                <circle r="42" fill="#CE412B" />
                <text x="0" y="18" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="52" fill="#FFFFFF" text-anchor="middle">R</text>
            </g>
        """
    },
    {
        "id": "golang",
        "name": "Go",
        "tag": "CLOUD",
        "tag_color": "#00ACD7",
        "bg": "#F0F9FC",
        "border": "#00ACD7",
        "inner_svg": """
            <rect x="50" y="65" width="140" height="100" rx="20" fill="#00ACD7" />
            <text x="120" y="136" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="56" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">GO</text>
        """
    },
    {
        "id": "javascript",
        "name": "JavaScript",
        "tag": "LANGUAGE",
        "tag_color": "#E5A910",
        "bg": "#FEFAF0",
        "border": "#F7DF1E",
        "inner_svg": """
            <rect x="55" y="55" width="130" height="130" rx="22" fill="#F7DF1E" />
            <text x="120" y="146" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="70" fill="#000000" text-anchor="middle" letter-spacing="-2">JS</text>
        """
    },
    {
        "id": "pytorch",
        "name": "PyTorch AI",
        "tag": "AI / ML",
        "tag_color": "#EE4C2C",
        "bg": "#FDF2EF",
        "border": "#EE4C2C",
        "inner_svg": """
            <g transform="translate(120, 112)">
                <path d="M0 -50 C20 -30 44 -8 44 22 C44 48 24 62 0 62 C-24 62 -44 48 -44 22 C-44 -8 -20 -30 0 -50 Z" fill="#EE4C2C" />
                <path d="M0 -26 C10 -12 22 2 22 22 C22 36 12 45 0 45 C-12 45 -22 36 -22 22 C-22 2 -10 -12 0 -26 Z" fill="#FFA33C" />
                <circle cx="26" cy="-32" r="6" fill="#FFA33C" />
            </g>
        """
    },
    {
        "id": "docker",
        "name": "Docker",
        "tag": "DEVOPS",
        "tag_color": "#2496ED",
        "bg": "#F0F7FC",
        "border": "#2496ED",
        "inner_svg": """
            <g transform="translate(120, 115)">
                <rect x="-35" y="-34" width="16" height="14" rx="2" fill="#2496ED" />
                <rect x="-15" y="-34" width="16" height="14" rx="2" fill="#2496ED" />
                <rect x="5" y="-34" width="16" height="14" rx="2" fill="#2496ED" />
                <rect x="-35" y="-16" width="16" height="14" rx="2" fill="#2496ED" />
                <rect x="-15" y="-16" width="16" height="14" rx="2" fill="#2496ED" />
                <rect x="5" y="-16" width="16" height="14" rx="2" fill="#2496ED" />
                <rect x="25" y="-16" width="16" height="14" rx="2" fill="#2496ED" />
                <path d="M-55 4 C-45 4 -35 24 0 24 C40 24 60 4 60 4 C60 22 40 38 0 38 C-40 38 -55 20 -55 4 Z" fill="#2496ED" />
            </g>
        """
    },
    {
        "id": "sql",
        "name": "SQL & Data",
        "tag": "DATABASE",
        "tag_color": "#336791",
        "bg": "#F1F5F9",
        "border": "#336791",
        "inner_svg": """
            <g transform="translate(120, 112)">
                <ellipse cx="0" cy="-30" rx="50" ry="16" fill="#336791" />
                <path d="M-50 -30 L-50 0 C-50 10 -25 16 0 16 C25 16 50 10 50 0 L50 -30 Z" fill="#2A5375" />
                <ellipse cx="0" cy="0" rx="50" ry="16" fill="#336791" />
                <path d="M-50 0 L-50 30 C-50 40 -25 46 0 46 C25 46 50 40 50 30 L50 0 Z" fill="#20405A" />
                <ellipse cx="0" cy="30" rx="50" ry="16" fill="#4B88B8" />
            </g>
        """
    },
    {
        "id": "cpp",
        "name": "C++",
        "tag": "PERFORMANCE",
        "tag_color": "#00599C",
        "bg": "#F0F5FA",
        "border": "#00599C",
        "inner_svg": """
            <polygon points="120,48 180,82 180,152 120,186 60,152 60,82" fill="#00599C" />
            <text x="120" y="132" font-family="-apple-system, system-ui, sans-serif" font-weight="900" font-size="40" fill="#FFFFFF" text-anchor="middle">C++</text>
        """
    },

    # Soft Skills
    {
        "id": "leadership",
        "name": "Leadership",
        "tag": "SOFT SKILL",
        "tag_color": "#D97706",
        "bg": "#FEF9EE",
        "border": "#F59E0B",
        "inner_svg": """
            <g transform="translate(120, 112)">
                <path d="M-50 22 L-38 -30 L-10 -4 L0 -40 L10 -4 L38 -30 L50 22 Z" fill="#F59E0B" />
                <rect x="-50" y="24" width="100" height="14" rx="7" fill="#FBBF24" />
                <circle cx="-38" cy="-33" r="5" fill="#FDE68A" />
                <circle cx="0" cy="-43" r="6" fill="#FDE68A" />
                <circle cx="38" cy="-33" r="5" fill="#FDE68A" />
            </g>
        """
    },
    {
        "id": "communication",
        "name": "Communication",
        "tag": "SOFT SKILL",
        "tag_color": "#E11D48",
        "bg": "#FFF1F2",
        "border": "#FF4D8B",
        "inner_svg": """
            <g transform="translate(120, 112)">
                <rect x="-50" y="-35" width="100" height="62" rx="20" fill="#FF4D8B" />
                <polygon points="12,26 30,46 0,26" fill="#FF4D8B" />
                <line x1="-28" y1="-5" x2="-28" y2="-5" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" />
                <line x1="-14" y1="-18" x2="-14" y2="8" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" />
                <line x1="0" y1="-24" x2="0" y2="14" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" />
                <line x1="14" y1="-16" x2="14" y2="6" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" />
                <line x1="28" y1="-5" x2="28" y2="-4" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" />
            </g>
        """
    },
    {
        "id": "problem-solving",
        "name": "Problem Solving",
        "tag": "SOFT SKILL",
        "tag_color": "#0D9488",
        "bg": "#F0FDF4",
        "border": "#2DD4BF",
        "inner_svg": """
            <g transform="translate(120, 112)">
                <path d="M-32 -32 H-5 C-5 -42 5 -42 5 -32 H32 V-5 C42 -5 42 5 32 5 V32 H5 C5 22 -5 22 -5 32 H-32 V5 C-22 5 -22 -5 -32 -5 Z" fill="#0D9488" />
                <circle cx="0" cy="0" r="9" fill="#F0FDF4" />
            </g>
        """
    },
    {
        "id": "collaboration",
        "name": "Team Synergy",
        "tag": "SOFT SKILL",
        "tag_color": "#7C3AED",
        "bg": "#F5F3FF",
        "border": "#B8A4ED",
        "inner_svg": """
            <g transform="translate(120, 112)">
                <circle cx="0" cy="-30" r="14" fill="#7C3AED" />
                <circle cx="-30" cy="22" r="14" fill="#7C3AED" />
                <circle cx="30" cy="22" r="14" fill="#7C3AED" />
                <line x1="0" y1="-30" x2="-30" y2="22" stroke="#7C3AED" stroke-width="5" opacity="0.4" />
                <line x1="0" y1="-30" x2="30" y2="22" stroke="#7C3AED" stroke-width="5" opacity="0.4" />
                <line x1="-30" y1="22" x2="30" y2="22" stroke="#7C3AED" stroke-width="5" opacity="0.4" />
                <circle cx="0" cy="4" r="7" fill="#B8A4ED" />
            </g>
        """
    },

    # Sports & High-Performance Mastery
    {
        "id": "chess-strategy",
        "name": "Chess Strategy",
        "tag": "STRATEGY",
        "tag_color": "#B45309",
        "bg": "#FFFBEB",
        "border": "#F59E0B",
        "inner_svg": """
            <g transform="translate(120, 112)">
                <path d="M-28 36 L28 36 L24 25 C24 25 18 16 25 0 C29 -9 24 -25 9 -38 C-5 -45 -23 -32 -21 -14 C-21 -11 -34 -4 -34 11 C-34 22 -28 31 -28 36 Z" fill="#B45309" />
                <circle cx="2" cy="-21" r="4" fill="#FFFBEB" />
                <rect x="-32" y="34" width="64" height="10" rx="3" fill="#D97706" />
            </g>
        """
    },
    {
        "id": "archery-focus",
        "name": "Target Focus",
        "tag": "PRECISION",
        "tag_color": "#DC2626",
        "bg": "#FEF2F2",
        "border": "#EF4444",
        "inner_svg": """
            <g transform="translate(120, 112)">
                <circle r="48" fill="#EF4444" opacity="0.15" />
                <circle r="36" fill="none" stroke="#EF4444" stroke-width="7" />
                <circle r="24" fill="none" stroke="#F59E0B" stroke-width="7" />
                <circle r="10" fill="#10B981" />
                <line x1="-45" y1="40" x2="40" y2="-45" stroke="#1F2937" stroke-width="5" stroke-linecap="round" />
                <polygon points="40,-45 28,-45 40,-33" fill="#1F2937" />
            </g>
        """
    },
    {
        "id": "endurance",
        "name": "Endurance",
        "tag": "ATHLETIC",
        "tag_color": "#65A30D",
        "bg": "#F7FEE7",
        "border": "#84CC16",
        "inner_svg": """
            <g transform="translate(120, 112)">
                <circle r="42" fill="none" stroke="#65A30D" stroke-width="5" stroke-dasharray="14 7" />
                <path d="M-7 -34 L16 -9 L2 -9 L14 30 L-16 5 L-2 5 Z" fill="#65A30D" />
            </g>
        """
    },
    {
        "id": "martial-arts",
        "name": "Reflexes",
        "tag": "DISCIPLINE",
        "tag_color": "#0891B2",
        "bg": "#ECFEFF",
        "border": "#06B6D4",
        "inner_svg": """
            <g transform="translate(120, 112)">
                <circle r="44" fill="#0891B2" opacity="0.15" />
                <path d="M0 -40 A40 40 0 0 1 0 40 A20 20 0 0 1 0 0 A20 20 0 0 0 0 -40" fill="#0891B2" />
                <circle cx="0" cy="-20" r="6" fill="#ECFEFF" />
                <circle cx="0" cy="20" r="6" fill="#0891B2" />
            </g>
        """
    }
]

for s in skill_items:
    file_path = os.path.join(skills_dir, f"{s['id']}.svg")
    svg_data = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
  <!-- Clean Card Base with Subtle Border -->
  <rect x="6" y="6" width="228" height="228" rx="32" fill="{s['bg']}" stroke="{s['border']}" stroke-width="2.5" stroke-opacity="0.8" />
  
  <!-- Inner White Card Inset for contrast -->
  <rect x="12" y="12" width="216" height="216" rx="26" fill="#FFFFFF" fill-opacity="0.85" />

  <!-- Top Category Tag -->
  <rect x="24" y="24" width="80" height="20" rx="10" fill="{s['tag_color']}" fill-opacity="0.15" />
  <text x="64" y="38" font-family="-apple-system, system-ui, sans-serif" font-size="10" font-weight="800" fill="{s['tag_color']}" text-anchor="middle" letter-spacing="1.2">{s['tag']}</text>

  <!-- Central Graphic Icon -->
  <g>
    {s['inner_svg']}
  </g>

  <!-- Bottom Skill Label -->
  <text x="120" y="208" font-family="-apple-system, system-ui, sans-serif" font-size="15" font-weight="800" fill="#1E293B" text-anchor="middle" letter-spacing="-0.3">{s['name']}</text>
</svg>
"""
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(svg_data.strip())

print(f"Generated {len(skill_items)} clean high-aesthetic skill cards!")
