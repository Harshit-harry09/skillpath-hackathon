# updated
import pandas as pd
import json
import os
import spacy
import re
from collections import defaultdict
from tqdm import tqdm
from datetime import datetime

# ============================================================
# PROJECT MEGA-MODEL UPGRADE (Phase 1 & 2)
# ============================================================
# Features: 
# 1. Salary ROI (Financial Impact)
# 2. Time-Series Trends (Market Velocity)
# 3. Seniority Splitting (Junior/Senior Roadmap)
# 4. Canonical Skill Aliasing

SAMPLE_PER_DATASET = 50000 
OUTPUT_PATH = "skillpath/lib/data/mvc_model.json"

# 1. Skill Aliases (Canonical Mapping)
SKILL_TAXONOMY = {
    "Languages": {
        "Python": ["python", "py"],
        "JavaScript": ["javascript", "js", "node.js", "nodejs"],
        "TypeScript": ["typescript", "ts"],
        "Java": ["java"],
        "C++": ["c++", "cpp"],
        "C#": ["c#", "c sharp", ".net"],
        "Rust": ["rust"],
        "Go": ["go lang", "golang", "go"],
        "Ruby": ["ruby", "rails"],
        "PHP": ["php"],
        "Swift": ["swift"],
        "Kotlin": ["kotlin"],
        "SQL": ["sql", "postgresql", "mysql", "oracle"]
    },
    "Frontend": {
        "React": ["react", "react.js", "reactjs"],
        "Next.js": ["nextjs", "next.js"],
        "Vue": ["vue", "vue.js", "vuejs"],
        "Angular": ["angular", "angularjs"],
        "Tailwind CSS": ["tailwind", "tailwindcss"],
        "Three.js": ["threejs", "three.js", "webgl"],
    },
    "Backend": {
        "Node.js": ["node.js", "nodejs", "express", "nestjs"],
        "Django": ["django"],
        "FastAPI": ["fastapi"],
        "Spring Boot": ["spring boot", "spring"],
        "GraphQL": ["graphql", "apollo"],
    },
    "Cloud_DevOps": {
        "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda"],
        "Azure": ["azure"],
        "GCP": ["gcp", "google cloud"],
        "Docker": ["docker"],
        "Kubernetes": ["k8s", "kubernetes"],
        "Terraform": ["terraform"],
        "Jenkins": ["jenkins"],
    },
    "AI_ML": {
        "Machine Learning": ["machine learning", "ml"],
        "Deep Learning": ["deep learning", "dl", "neural networks"],
        "NLP": ["nlp", "natural language processing"],
        "Computer Vision": ["cv", "computer vision"],
        "PyTorch": ["pytorch"],
        "TensorFlow": ["tensorflow"],
        "Large Language Models": ["llm", "large language models", "gpt", "llama"],
        "Vector Databases": ["vector database", "pinecone", "milvus", "weaviate"],
    }
}

# 2. Seniority Mapping
SENIORITY_KEYWORDS = {
    "junior": ["junior", "jr", "entry", "associate"],
    "senior": ["senior", "sr", "lead", "staff", "principal"],
    "executive": ["vp", "director", "head of", "chief"]
}

def classify_role_enhanced(title):
    t = str(title).lower()
    
    # Extract Seniority
    seniority = "mid"
    for s_level, keywords in SENIORITY_KEYWORDS.items():
        if any(f" {k} " in f" {t} " or t.startswith(k) for k in keywords):
            seniority = s_level
            break

    # Core Role Classification (from your original robust logic)
    role = "other"
    if any(k in t for k in ["chief executive", " ceo", "founder"]): role = "executive"
    elif any(k in t for k in ["chief technology", " cto", "vp engineering"]): role = "engineering-leadership"
    elif any(k in t for k in ["machine learning engineer", "ml engineer", "ai engineer"]): role = "ml-engineer"
    elif any(k in t for k in ["cyber", "security engineer", "infosec"]): role = "cybersecurity"
    elif any(k in t for k in ["frontend", "front-end", "react"]): role = "frontend-developer"
    elif any(k in t for k in ["backend", "back-end", "node.js"]): role = "backend-developer"
    elif any(k in t for k in ["full stack", "fullstack"]): role = "fullstack-developer"
    elif any(k in t for k in ["data analyst"]): role = "data-professional"
    elif any(k in t for k in ["product manager"]): role = "product-manager"
    elif any(k in t for k in ["designer", "ux", "ui"]): role = "designer"
    elif any(k in t for k in ["software", "developer", "engineer"]): role = "software-engineer"
    
    if role == "other":
        return t.strip() # Dynamic fallback
        
    return f"{seniority}-{role}"

def normalize_salary(row):
    try:
        # Check Archive 5 (DS Salaries)
        if 'salary_in_usd' in row:
            return float(row['salary_in_usd'])
        
        # Check Archive 4 (Postings)
        if 'med_salary' in row and not pd.isna(row['med_salary']):
            sal = float(row['med_salary'])
            period = str(row.get('pay_period', 'YEARLY')).upper()
            if period == 'HOURLY': return sal * 2080
            if period == 'MONTHLY': return sal * 12
            return sal
            
        # Check Glassdoor
        if 'header.salaryHigh' in row and not pd.isna(row['header.salaryHigh']):
            return (float(row['header.salaryHigh']) + float(row.get('header.salaryLow', 0))) / 2
            
        return None
    except:
        return None

def train_mega_model_v3():
    print("Initializing Mega-Model Phase 1 & 2 Upgrade...")
    
    # Data containers
    role_stats = defaultdict(lambda: {
        "salaries": [],
        "years": defaultdict(int),
        "skill_counts": defaultdict(int),
        "skill_salaries": defaultdict(list),
        "skill_trends": defaultdict(lambda: defaultdict(int))
    })

    datasets = [
        ('assest/archive_4/postings.csv', 'description', 'title'),
        ('assest/archive_5/ds_salaries.csv', 'job_title', 'job_title'),
        ('assest/new1/glassdoor.csv', 'job.description', 'header.jobTitle'),
        ('assest/archive_7/Software Engineer Salaries.csv', 'Job Title', 'Job Title'), # Salary only but good for benchmarking
        ('assest/archive_8/job_postings.csv', 'skills_required', 'job_title'),
        ('assest/linkedin_jd/postings.csv', 'description', 'title'),
    ]

    for file_path, desc_col, title_col in datasets:
        if not os.path.exists(file_path): continue
        print(f"Reading {file_path}...")
        df = pd.read_csv(file_path, low_memory=False, on_bad_lines="skip")
        
        # Sampling
        sample_df = df.sample(min(len(df), SAMPLE_PER_DATASET))
        
        for _, row in tqdm(sample_df.iterrows(), total=len(sample_df)):
            title = str(row[title_col])
            desc = str(row[desc_col]).lower()
            role_key = classify_role_enhanced(title)
            
            # 1. Salary Extraction
            salary = normalize_salary(row)
            if salary:
                role_stats[role_key]["salaries"].append(salary)
            
            # 2. Date Extraction (Trend tracking)
            year = 2024 # Default
            if 'listed_time' in row:
                try: year = datetime.fromtimestamp(row['listed_time']/1000).year
                except: pass
            elif 'work_year' in row:
                year = int(row['work_year'])
            
            role_stats[role_key]["years"][year] += 1
            
            # 3. Skill Extraction with Aliases
            for display_name, aliases in [ (k, v) for cat in SKILL_TAXONOMY.values() for k, v in cat.items() ]:
                found = False
                for alias in aliases:
                    pattern = r'\b' + re.escape(alias) + r'\b'
                    if re.search(pattern, desc):
                        found = True
                        break
                
                if found:
                    role_stats[role_key]["skill_counts"][display_name] += 1
                    role_stats[role_key]["skill_trends"][year][display_name] += 1
                    if salary:
                        role_stats[role_key]["skill_salaries"][display_name].append(salary)

    # Consolidation
    print("Consolidating Market Intelligence...")
    final_model = {}
    
    # Filter for top roles
    sorted_roles = sorted(role_stats.items(), key=lambda x: len(x[1]["salaries"]), reverse=True)[:300]

    for role_key, stats in sorted_roles:
        if not stats["salaries"]: continue
        
        avg_base_salary = sum(stats["salaries"]) / len(stats["salaries"])
        
        skills_summary = []
        for skill, count in sorted(stats["skill_counts"].items(), key=lambda x: x[1], reverse=True)[:30]:
            # Calculate Premium (Phase 2)
            premium = 0
            if skill in stats["skill_salaries"]:
                avg_with_skill = sum(stats["skill_salaries"][skill]) / len(stats["skill_salaries"][skill])
                premium = max(0, avg_with_skill - avg_base_salary)
            
            # Calculate Trend (Phase 1)
            trends = {}
            for yr in sorted(stats["skill_trends"].keys()):
                total_for_yr = stats["years"][yr]
                if total_for_yr > 0:
                    trends[str(yr)] = round(stats["skill_trends"][yr][skill] / total_for_yr, 3)
            
            skills_summary.append({
                "skill": skill,
                "count": count,
                "premium": int(premium),
                "trend": trends
            })
            
        final_model[role_key] = {
            "role": role_key.replace("-", " ").title(),
            "salary_avg": int(avg_base_salary),
            "skills": skills_summary,
            "sample_size": len(stats["salaries"])
        }

    with open(OUTPUT_PATH, "w") as f:
        json.dump(final_model, f, indent=2)
    
    print(f"Success! Phase 1 & 2 Complete. Saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    train_mega_model_v3()
