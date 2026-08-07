import csv
import json
import os
import re
from collections import defaultdict

# ============================================================
# SKILLPATH INDIA MODEL TRAINER
# Extracts Indian tech roles, LPA salaries, and skill frequencies
# ============================================================

INPUT_FILE = "data/india/naukri_com_job_sample.csv"
OUTPUT_FILE = "skillpath/lib/data/mvc_model_india.json"

# Skill Taxonomy for keyword extraction
SKILL_TAXONOMY = {
    "Languages": {
        "Python": ["python", "py"],
        "JavaScript": ["javascript", "js", "node.js", "nodejs"],
        "TypeScript": ["typescript", "ts"],
        "Java": ["java", "core java", "j2ee"],
        "C++": ["c++", "cpp"],
        "C#": ["c#", "c sharp", ".net", "asp.net"],
        "Rust": ["rust"],
        "Go": ["golang", "go lang", "go"],
        "Ruby": ["ruby", "rails"],
        "PHP": ["php", "laravel"],
        "Swift": ["swift", "ios"],
        "Kotlin": ["kotlin", "android"],
        "SQL": ["sql", "postgresql", "mysql", "oracle", "pl/sql"]
    },
    "Frontend": {
        "React": ["react", "react.js", "reactjs"],
        "Next.js": ["nextjs", "next.js"],
        "Vue": ["vue", "vue.js", "vuejs"],
        "Angular": ["angular", "angularjs"],
        "Tailwind CSS": ["tailwind", "tailwindcss"],
        "HTML/CSS": ["html", "css", "bootstrap"]
    },
    "Backend": {
        "Node.js": ["node.js", "nodejs", "express", "nestjs"],
        "Django": ["django"],
        "FastAPI": ["fastapi"],
        "Spring Boot": ["spring boot", "spring framework", "spring"],
        "GraphQL": ["graphql", "apollo"],
        "REST API": ["rest api", "restful", "microservices"]
    },
    "Cloud_DevOps": {
        "AWS": ["aws", "amazon web services", "ec2", "s3"],
        "Azure": ["azure"],
        "GCP": ["gcp", "google cloud"],
        "Docker": ["docker"],
        "Kubernetes": ["k8s", "kubernetes"],
        "Terraform": ["terraform"],
        "Jenkins": ["jenkins", "ci/cd"]
    },
    "Databases": {
        "PostgreSQL": ["postgresql", "postgres"],
        "MySQL": ["mysql"],
        "MongoDB": ["mongodb", "mongo"],
        "Redis": ["redis"],
        "Elasticsearch": ["elasticsearch"]
    },
    "AI_ML": {
        "Machine Learning": ["machine learning", "ml"],
        "Deep Learning": ["deep learning", "dl", "neural networks"],
        "NLP": ["nlp", "natural language processing"],
        "PyTorch": ["pytorch"],
        "TensorFlow": ["tensorflow"],
        "Data Science": ["data science", "data scientist"]
    }
}

SENIORITY_KEYWORDS = {
    "junior": ["junior", "jr", "entry", "associate", "fresher", "trainee"],
    "senior": ["senior", "sr", "lead", "staff", "principal"],
    "executive": ["vp", "director", "head of", "chief", "manager"]
}

def classify_role_india(title):
    t = str(title).lower()
    
    seniority = "mid"
    for s_level, keywords in SENIORITY_KEYWORDS.items():
        if any(k in t for k in keywords):
            seniority = s_level
            break

    role = "other"
    if any(k in t for k in ["machine learning", "ai ", "ml "]): role = "ml-engineer"
    elif any(k in t for k in ["data analyst", "business analyst", "data scientist"]): role = "data-professional"
    elif any(k in t for k in ["cyber", "security", "infosec"]): role = "cybersecurity"
    elif any(k in t for k in ["frontend", "front end", "react", "angular"]): role = "frontend-developer"
    elif any(k in t for k in ["backend", "back end", "node", "java", "python", "php", "pl/sql", ".net"]): role = "backend-developer"
    elif any(k in t for k in ["full stack", "fullstack"]): role = "fullstack-developer"
    elif any(k in t for k in ["devops", "sre", "cloud", "infra"]): role = "devops"
    elif any(k in t for k in ["qa", "testing", "test engineer", "automation"]): role = "qa-engineer"
    elif any(k in t for k in ["mobile", "ios", "android"]): role = "mobile-developer"
    elif any(k in t for k in ["product manager"]): role = "product-manager"
    elif any(k in t for k in ["designer", "ux", "ui"]): role = "designer"
    elif any(k in t for k in ["software", "developer", "engineer", "programmer"]): role = "software-engineer"
    
    if role == "other":
        return None # Skip non-tech roles
        
    return f"{seniority}-{role}"

def parse_payrate_lpa(pay_str):
    """
    Parses Indian payrate strings like '3,00,000 - 5,00,000 P.A.' -> LPA tuple (3.0, 5.0, avg 4.0)
    """
    if not pay_str or "not disclosed" in str(pay_str).lower():
        return None
        
    s = str(pay_str).replace(",", "").lower()
    matches = re.findall(r'(\d+(?:\.\d+)?)', s)
    if not matches:
        return None
        
    nums = [float(m) for m in matches]
    
    # Check if numbers are in Rupees per annum (e.g., 300000)
    if any(n > 50000 for n in nums):
        lpa_nums = [n / 100000.0 for n in nums if n > 10000]
        if lpa_nums:
            avg_lpa = sum(lpa_nums) / len(lpa_nums)
            if 1.0 <= avg_lpa <= 150.0:
                return round(avg_lpa, 2)
    # Check if numbers are directly in LPA (e.g., 4 - 8 LPA)
    elif any(0.5 <= n <= 150.0 for n in nums):
        lpa_nums = [n for n in nums if 0.5 <= n <= 150.0]
        if lpa_nums:
            return round(sum(lpa_nums) / len(lpa_nums), 2)
            
    return None

def train_india_model():
    print(f"Reading {INPUT_FILE}...")
    
    role_stats = defaultdict(lambda: {
        "salaries_lpa": [],
        "skill_counts": defaultdict(int),
        "skill_salaries": defaultdict(list),
        "locations": defaultdict(int),
        "total_postings": 0
    })

    with open(INPUT_FILE, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get("jobtitle", "")
            role_key = classify_role_india(title)
            if not role_key:
                continue
                
            desc = (row.get("jobdescription", "") + " " + row.get("skills", "")).lower()
            pay_str = row.get("payrate", "")
            location = row.get("joblocation_address", "").strip()
            
            lpa = parse_payrate_lpa(pay_str)
            
            role_stats[role_key]["total_postings"] += 1
            if lpa:
                role_stats[role_key]["salaries_lpa"].append(lpa)
            if location:
                # Basic city extraction
                for city in ["Bengaluru", "Bangalore", "Hyderabad", "Chennai", "Mumbai", "Pune", "Gurgaon", "Gurugram", "Noida", "Delhi"]:
                    if city.lower() in location.lower():
                        role_stats[role_key]["locations"][city.replace("Bangalore", "Bengaluru").replace("Gurgaon", "Gurugram")] += 1

            # Skill Matching
            for display_name, aliases in [ (k, v) for cat in SKILL_TAXONOMY.values() for k, v in cat.items() ]:
                found = False
                for alias in aliases:
                    pattern = r'\b' + re.escape(alias) + r'\b'
                    if re.search(pattern, desc):
                        found = True
                        break
                
                if found:
                    role_stats[role_key]["skill_counts"][display_name] += 1
                    if lpa:
                        role_stats[role_key]["skill_salaries"][display_name].append(lpa)

    print("\nConsolidating Indian Market Model...")
    final_model = {}
    
    for role_key, stats in role_stats.items():
        if stats["total_postings"] < 5:
            continue
            
        salaries = stats["salaries_lpa"]
        avg_lpa = round(sum(salaries) / len(salaries), 1) if salaries else 12.5 # Default fallback
        min_lpa = round(min(salaries), 1) if salaries else round(avg_lpa * 0.6, 1)
        max_lpa = round(max(salaries), 1) if salaries else round(avg_lpa * 1.6, 1)
        
        # Skill Summary
        skills_summary = []
        for skill, count in sorted(stats["skill_counts"].items(), key=lambda x: x[1], reverse=True):
            freq_pct = round((count / stats["total_postings"]) * 100)
            premium_lpa = 0.0
            if skill in stats["skill_salaries"] and len(stats["skill_salaries"][skill]) > 3:
                avg_with_skill = sum(stats["skill_salaries"][skill]) / len(stats["skill_salaries"][skill])
                premium_lpa = max(0.0, round(avg_with_skill - avg_lpa, 1))
                
            skills_summary.append({
                "skill": skill,
                "count": count,
                "frequency_pct": freq_pct,
                "premium_lpa": premium_lpa
            })
            
        # Top locations
        top_cities = sorted(stats["locations"].items(), key=lambda x: x[1], reverse=True)[:4]
        locations_list = [c[0] for c in top_cities] if top_cities else ["Bengaluru", "Hyderabad", "Gurugram", "Pune"]
        
        final_model[role_key] = {
            "role": role_key.replace("-", " ").title(),
            "salary_avg_lpa": avg_lpa,
            "salary_range_lpa": {
                "min": min_lpa,
                "max": max_lpa,
                "currency": "INR"
            },
            "sample_size": stats["total_postings"],
            "top_locations": locations_list,
            "skills": skills_summary[:20]
        }
        
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(final_model, f, indent=2)
        
    print(f"✓ Success! Generated Indian Market Model with {len(final_model)} role categories saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    train_india_model()
