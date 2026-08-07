import csv
import json
import os
import re
import ast
from collections import defaultdict

# ============================================================
# SKILLPATH MEGA MODEL TRAINER v2 (800K+ RECORDS)
# Sources:
#   1. data/mega/data_jobs.csv            (786,000+ rows)
#   2. data/india/indeed_india_jobs.csv   (93,608 rows)
#   3. data/india/naukri_com_job_sample.csv (22,001 rows)
#   4. data/mega/skill2vec_50K.csv         (50,000 skill rows)
#
# Outputs:
#   - skillpath/lib/data/mvc_model.json        (Global Mega Model)
#   - skillpath/lib/data/mvc_model_india.json  (India Mega Model)
# ============================================================

GLOBAL_DATA_JOBS  = "data/mega/data_jobs.csv"
INDEED_INDIA_FILE = "data/india/indeed_india_jobs.csv"
NAUKRI_FILE       = "data/india/naukri_com_job_sample.csv"
SKILL50K_FILE     = "data/mega/skill2vec_50K.csv"

GLOBAL_OUTPUT     = "skillpath/lib/data/mvc_model.json"
INDIA_OUTPUT      = "skillpath/lib/data/mvc_model_india.json"

# Expanded Skill Taxonomy
SKILL_TAXONOMY = {
    "Languages": {
        "Python":        ["python"],
        "JavaScript":    ["javascript", "js", "node.js", "nodejs"],
        "TypeScript":    ["typescript", "ts"],
        "Java":          ["java", "core java", "j2ee", "spring"],
        "C++":           ["c++", "cpp"],
        "C#":            ["c#", "c sharp", ".net", "asp.net", "dotnet"],
        "Rust":          ["rust"],
        "Go":            ["golang", "go lang", "go"],
        "Ruby":          ["ruby", "rails"],
        "PHP":           ["php", "laravel"],
        "Swift":         ["swift"],
        "Kotlin":        ["kotlin"],
        "SQL":           ["sql", "pl/sql", "tsql", "t-sql"],
        "Scala":         ["scala"],
        "R":             ["r programming", "rstudio"],
        "Shell/Bash":    ["bash", "shell", "powershell"],
    },
    "Frontend": {
        "React":         ["react", "reactjs", "react.js"],
        "Next.js":       ["nextjs", "next.js"],
        "Vue":           ["vue", "vuejs", "vue.js"],
        "Angular":       ["angular", "angularjs"],
        "Tailwind CSS":  ["tailwind", "tailwindcss"],
        "HTML/CSS":      ["html", "css", "bootstrap", "sass", "scss"],
        "Redux":         ["redux"],
        "Webpack":       ["webpack", "vite"],
    },
    "Backend": {
        "Node.js":       ["node.js", "nodejs", "express", "nestjs"],
        "Django":        ["django"],
        "FastAPI":       ["fastapi"],
        "Flask":         ["flask"],
        "Spring Boot":   ["spring boot", "spring framework", "spring"],
        "GraphQL":       ["graphql", "apollo"],
        "REST API":      ["rest api", "restful", "microservices"],
        "gRPC":          ["grpc"],
    },
    "Cloud_DevOps": {
        "AWS":           ["aws", "amazon web services", "ec2", "s3", "lambda", "eks"],
        "Azure":         ["azure"],
        "GCP":           ["gcp", "google cloud"],
        "Docker":        ["docker"],
        "Kubernetes":    ["kubernetes", "k8s"],
        "Terraform":     ["terraform"],
        "Jenkins":       ["jenkins", "ci/cd", "cicd", "github actions", "gitlab ci"],
        "Linux":         ["linux", "unix"],
        "Ansible":       ["ansible"],
        "Helm":          ["helm"],
    },
    "Databases": {
        "PostgreSQL":    ["postgresql", "postgres"],
        "MySQL":         ["mysql"],
        "MongoDB":       ["mongodb", "mongo"],
        "Redis":         ["redis"],
        "Elasticsearch": ["elasticsearch", "elastic"],
        "Cassandra":     ["cassandra"],
        "Oracle DB":     ["oracle", "oracle database"],
        "DynamoDB":      ["dynamodb"],
        "Snowflake":     ["snowflake"],
        "BigQuery":      ["bigquery"],
    },
    "AI_ML": {
        "Machine Learning": ["machine learning", "ml"],
        "Deep Learning":    ["deep learning", "neural network", "neural networks"],
        "NLP":              ["nlp", "natural language processing", "llm", "large language model"],
        "PyTorch":          ["pytorch"],
        "TensorFlow":       ["tensorflow", "keras"],
        "Data Science":     ["data science", "data scientist"],
        "Pandas":           ["pandas"],
        "NumPy":            ["numpy"],
        "Scikit-learn":     ["scikit-learn", "sklearn"],
        "Computer Vision":  ["computer vision", "opencv"],
        "Spark":            ["apache spark", "pyspark", "spark"],
        "Tableau":          ["tableau"],
        "Power BI":         ["power bi", "powerbi"],
    },
    "Soft_Skills": {
        "Communication":    ["communication skills", "verbal", "written communication"],
        "Problem Solving":  ["problem solving", "analytical"],
        "Teamwork":         ["team player", "collaboration", "teamwork"],
        "Leadership":       ["leadership", "mentoring", "team lead"],
        "Agile/Scrum":      ["agile", "scrum", "kanban", "jira", "confluence"],
    }
}

SENIORITY_KEYWORDS = {
    "junior":    ["junior", "jr", "entry", "associate", "fresher", "trainee", "intern", "graduate"],
    "senior":    ["senior", "sr", "lead", "staff", "principal", "architect"],
    "executive": ["vp", "director", "head of", "chief", "cto", "ceo", "manager"],
}

def classify_role(title: str):
    t = str(title).lower()
    seniority = "mid"
    for level, kws in SENIORITY_KEYWORDS.items():
        if any(k in t for k in kws):
            seniority = level
            break

    if any(k in t for k in ["site reliability", "sre"]):
        role = "sre"
    elif any(k in t for k in ["data engineer", "etl", "pipeline"]):
        role = "data-engineer"
    elif any(k in t for k in ["cloud", "infrastructure"]):
        role = "cloud-engineer"
    elif any(k in t for k in ["machine learning", " ml ", "ai engineer", "mlops", "ai scientist"]):
        role = "ml-engineer"
    elif any(k in t for k in ["data analyst", "business analyst", "data scientist", "bi analyst"]):
        role = "data-professional"
    elif any(k in t for k in ["cyber", "security", "infosec", "penetration"]):
        role = "cybersecurity"
    elif any(k in t for k in ["frontend", "front end", "front-end", "react developer", "angular developer"]):
        role = "frontend-developer"
    elif any(k in t for k in ["backend", "back end", "back-end", "node developer", "java developer", "python developer", "django", "spring"]):
        role = "backend-developer"
    elif any(k in t for k in ["full stack", "fullstack", "full-stack"]):
        role = "fullstack-developer"
    elif any(k in t for k in ["devops", "devsecops", "platform engineer"]):
        role = "devops"
    elif any(k in t for k in ["qa", "quality assurance", "test engineer", "automation engineer", "sdet"]):
        role = "qa-engineer"
    elif any(k in t for k in ["mobile", "ios", "android", "flutter", "react native"]):
        role = "mobile-developer"
    elif any(k in t for k in ["product manager", "product owner"]):
        role = "product-manager"
    elif any(k in t for k in ["designer", "ux", "ui/ux", "ui designer"]):
        role = "designer"
    elif any(k in t for k in ["software", "developer", "engineer", "programmer", "coder"]):
        role = "software-engineer"
    else:
        return None

    return seniority, role, f"{seniority}-{role}"

def parse_salary(val):
    if not val:
        return None
    try:
        n = float(val)
        if 10000 <= n <= 500000:
            return round(n, 2)
    except ValueError:
        pass
    return None

def extract_skills_from_text(text: str) -> set:
    text = text.lower()
    found = set()
    for cat_skills in SKILL_TAXONOMY.values():
        for display, aliases in cat_skills.items():
            for alias in aliases:
                pattern = r'\b' + re.escape(alias) + r'\b'
                if re.search(pattern, text):
                    found.add(display)
                    break
    return found

def parse_skill_list_field(field_val: str) -> set:
    found = set()
    if not field_val or field_val == "[]":
        return found
    
    # Try ast.literal_eval or string matching
    raw_str = field_val.lower()
    for cat_skills in SKILL_TAXONOMY.values():
        for display, aliases in cat_skills.items():
            for alias in aliases:
                if alias in raw_str:
                    found.add(display)
                    break
    return found

def make_role_stats():
    return {
        "salaries":         [],
        "skill_counts":     defaultdict(int),
        "locations":        defaultdict(int),
        "total":            0,
        "seniority_counts": defaultdict(int),
    }

def ingest_global_data_jobs(global_stats, india_stats):
    if not os.path.exists(GLOBAL_DATA_JOBS):
        print(f"  [skip] {GLOBAL_DATA_JOBS} not found")
        return 0

    count = 0
    with open(GLOBAL_DATA_JOBS, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get("job_title", "") or row.get("job_title_short", "")
            res = classify_role(title)
            if not res:
                continue
            seniority, role, role_key = res

            country = (row.get("job_country", "") or "").strip()
            is_india = country.lower() in ("india", "in")
            target_stats = india_stats if is_india else global_stats

            sal = parse_salary(row.get("salary_year_avg", ""))
            skills = parse_skill_list_field(row.get("job_skills", "") + " " + row.get("job_type_skills", ""))

            rs = target_stats[role_key]
            rs["total"] += 1
            rs["seniority_counts"][seniority] += 1
            if sal:
                rs["salaries"].append(sal)
            
            loc = row.get("job_location", "").strip()
            if loc:
                rs["locations"][loc] += 1

            for s in skills:
                rs["skill_counts"][s] += 1

            count += 1
            if count % 100000 == 0:
                print(f"      Processed {count:,} global job listings...")
    return count

def ingest_indeed_india(india_stats):
    if not os.path.exists(INDEED_INDIA_FILE):
        return 0
    count = 0
    with open(INDEED_INDIA_FILE, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            res = classify_role(row.get("job_title", ""))
            if not res:
                continue
            seniority, role, role_key = res

            desc = row.get("job_description", "").lower()
            city = (row.get("city", "") or row.get("inferred_city", "")).strip()

            rs = india_stats[role_key]
            rs["total"] += 1
            rs["seniority_counts"][seniority] += 1
            if city:
                rs["locations"][city] += 1

            for skill in extract_skills_from_text(desc):
                rs["skill_counts"][skill] += 1
            count += 1
    return count

def ingest_naukri(india_stats):
    if not os.path.exists(NAUKRI_FILE):
        return 0
    count = 0
    with open(NAUKRI_FILE, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            res = classify_role(row.get("jobtitle", ""))
            if not res:
                continue
            seniority, role, role_key = res

            desc = (row.get("jobdescription", "") + " " + row.get("skills", "")).lower()
            loc = row.get("joblocation_address", "").strip()

            rs = india_stats[role_key]
            rs["total"] += 1
            rs["seniority_counts"][seniority] += 1
            if loc:
                rs["locations"][loc] += 1

            for skill in extract_skills_from_text(desc):
                rs["skill_counts"][skill] += 1
            count += 1
    return count

def ingest_skill50k(global_stats, india_stats):
    if not os.path.exists(SKILL50K_FILE):
        return 0
    
    count = 0
    with open(SKILL50K_FILE, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            parts = [p.strip() for p in line.strip().split(",") if p.strip()]
            if len(parts) < 2:
                continue
            
            full_text = " ".join(parts[1:]).lower()
            res = classify_role(full_text)
            if not res:
                continue
            
            seniority, role, role_key = res

            matched_skills = set()
            for cat_skills in SKILL_TAXONOMY.values():
                for display, aliases in cat_skills.items():
                    if any(a in full_text for a in aliases):
                        matched_skills.add(display)

            # Ingest as Indian job posting data
            rs_ind = india_stats[role_key]
            rs_ind["total"] += 1
            rs_ind["seniority_counts"][seniority] += 1
            for s in matched_skills:
                rs_ind["skill_counts"][s] += 1

            # Ingest as Global job posting data
            rs_glo = global_stats[role_key]
            rs_glo["total"] += 1
            rs_glo["seniority_counts"][seniority] += 1
            for s in matched_skills:
                rs_glo["skill_counts"][s] += 1

            count += 1
    return count

def build_model_dict(stats_dict, is_india=False):
    final = {}
    for role_key, rs in stats_dict.items():
        if rs["total"] < 5:
            continue

        salaries = rs["salaries"]
        seniority_hint = max(rs["seniority_counts"], key=rs["seniority_counts"].get) if rs["seniority_counts"] else "mid"

        if is_india:
            base_lpa_fallback = {"junior": 4.5, "mid": 9.5, "senior": 18.0, "executive": 30.0}
            avg_lpa = round(sum(salaries) / len(salaries), 1) if salaries else base_lpa_fallback.get(seniority_hint, 10.0)
            avg_sal = avg_lpa
        else:
            base_usd_fallback = {"junior": 65000, "mid": 105000, "senior": 155000, "executive": 220000}
            avg_usd = round(sum(salaries) / len(salaries), 0) if salaries else base_usd_fallback.get(seniority_hint, 105000)
            avg_sal = avg_usd
            avg_lpa = round((avg_usd * 83.0) / 100000.0, 1)

        skills_list = [
            {
                "skill":         skill,
                "count":         cnt,
                "frequency_pct": round((cnt / rs["total"]) * 100),
            }
            for skill, cnt in sorted(rs["skill_counts"].items(), key=lambda x: x[1], reverse=True)[:25]
        ]

        top_locs = [c for c, _ in sorted(rs["locations"].items(), key=lambda x: x[1], reverse=True)[:5]]

        final[role_key] = {
            "role":               role_key.replace("-", " ").title(),
            "salary_avg":         avg_sal,
            "salary_avg_lpa":     avg_lpa,
            "sample_size":        rs["total"],
            "seniority":          seniority_hint,
            "top_locations":      top_locs,
            "skills":             skills_list,
        }
    return final


def main():
    print("=" * 60)
    print("  SKILLPATH MEGA MODEL TRAINER v2 (800K+ DATASET)")
    print("=" * 60)

    global_stats = defaultdict(make_role_stats)
    india_stats  = defaultdict(make_role_stats)

    print("\n[1/4] Ingesting HuggingFace 786K global job dataset...")
    n1 = ingest_global_data_jobs(global_stats, india_stats)
    print(f"      -> {n1:,} global job postings processed")

    print("\n[2/4] Ingesting Indeed India 93K dataset...")
    n2 = ingest_indeed_india(india_stats)
    print(f"      -> {n2:,} Indeed India job postings processed")

    print("\n[3/4] Ingesting Naukri India dataset...")
    n3 = ingest_naukri(india_stats)
    print(f"      -> {n3:,} Naukri job postings processed")

    print("\n[4/4] Ingesting Skill2Vec 50K vector dataset...")
    n4 = ingest_skill50k(global_stats, india_stats)
    print(f"      -> {n4:,} Skill2Vec 50K vectors processed")

    total_records = n1 + n2 + n3 + n4
    print(f"\n============================================================")
    print(f"  TOTAL RECORDS PROCESSED: {total_records:,}")
    print(f"============================================================")

    print("\nBuilding Global and India models...")
    global_model = build_model_dict(global_stats, is_india=False)
    india_model  = build_model_dict(india_stats, is_india=True)

    os.makedirs(os.path.dirname(GLOBAL_OUTPUT), exist_ok=True)
    os.makedirs(os.path.dirname(INDIA_OUTPUT), exist_ok=True)

    with open(GLOBAL_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(global_model, f, indent=2, ensure_ascii=False)

    with open(INDIA_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(india_model, f, indent=2, ensure_ascii=False)

    print(f"\nSaved Global Model -> {GLOBAL_OUTPUT} ({len(global_model)} roles)")
    print(f"Saved India Model  -> {INDIA_OUTPUT} ({len(india_model)} roles)")
    print("\nMega Model Training Complete!")

if __name__ == "__main__":
    main()
