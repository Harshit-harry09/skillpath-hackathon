import csv
import json
import os
import re
from collections import defaultdict

# ============================================================
# SKILLPATH INDIA MODEL TRAINER v2
# Combines 3 real datasets for ~125K+ Indian job postings:
#   1. data/india/naukri_com_job_sample.csv  (22K rows)
#   2. data/india/indeed_india_jobs.csv      (93K rows)
#   3. data/india/skill2vec_10k.csv          (10K skill-tag rows, skill booster)
#
# Output: skillpath/lib/data/mvc_model_india.json
# ============================================================

NAUKRI_FILE    = "data/india/naukri_com_job_sample.csv"
INDEED_FILE    = "data/india/indeed_india_jobs.csv"
SKILL2VEC_FILE = "data/india/skill2vec_10k.csv"
OUTPUT_FILE    = "skillpath/lib/data/mvc_model_india.json"

# ---------------------------------------------------------------------------
# SKILL TAXONOMY  (display_name -> [lowercase aliases])
# ---------------------------------------------------------------------------
SKILL_TAXONOMY = {
    "Languages": {
        "Python":        ["python"],
        "JavaScript":    ["javascript", "js", "node.js", "nodejs"],
        "TypeScript":    ["typescript", "ts"],
        "Java":          ["java", "core java", "j2ee", "spring"],
        "C++":           ["c++", "cpp"],
        "C#":            ["c#", "c sharp", ".net", "asp.net", "dotnet"],
        "Rust":          ["rust"],
        "Go":            ["golang", "go lang"],
        "Ruby":          ["ruby", "rails"],
        "PHP":           ["php", "laravel"],
        "Swift":         ["swift"],
        "Kotlin":        ["kotlin"],
        "SQL":           ["sql", "pl/sql"],
        "Scala":         ["scala"],
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
        "Spring Boot":   ["spring boot", "spring framework"],
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
        "Deep Learning":    ["deep learning", "neural network"],
        "NLP":              ["nlp", "natural language processing", "llm"],
        "PyTorch":          ["pytorch"],
        "TensorFlow":       ["tensorflow", "keras"],
        "Data Science":     ["data science", "data scientist"],
        "Pandas":           ["pandas"],
        "NumPy":            ["numpy"],
        "Scikit-learn":     ["scikit-learn", "sklearn"],
        "Computer Vision":  ["computer vision", "opencv", "cv2"],
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

# Salary reference map for Indian roles (LPA) — used when no salary data available
ROLE_SALARY_FALLBACK = {
    "ml-engineer":          {"mid": 14.0, "junior": 8.0, "senior": 28.0, "executive": 45.0},
    "data-professional":    {"mid": 10.0, "junior": 6.0, "senior": 22.0, "executive": 38.0},
    "fullstack-developer":  {"mid": 12.0, "junior": 7.0, "senior": 24.0, "executive": 40.0},
    "backend-developer":    {"mid": 12.0, "junior": 7.0, "senior": 22.0, "executive": 38.0},
    "frontend-developer":   {"mid": 10.0, "junior": 6.0, "senior": 20.0, "executive": 35.0},
    "devops":               {"mid": 14.0, "junior": 8.0, "senior": 26.0, "executive": 42.0},
    "cybersecurity":        {"mid": 13.0, "junior": 7.5, "senior": 25.0, "executive": 40.0},
    "mobile-developer":     {"mid": 11.0, "junior": 7.0, "senior": 22.0, "executive": 38.0},
    "qa-engineer":          {"mid": 8.0,  "junior": 5.0, "senior": 16.0, "executive": 28.0},
    "software-engineer":    {"mid": 12.0, "junior": 7.0, "senior": 22.0, "executive": 38.0},
    "product-manager":      {"mid": 18.0, "junior": 10.0,"senior": 32.0, "executive": 55.0},
    "designer":             {"mid": 8.0,  "junior": 5.0, "senior": 18.0, "executive": 30.0},
    "cloud-engineer":       {"mid": 14.0, "junior": 8.0, "senior": 26.0, "executive": 42.0},
    "data-engineer":        {"mid": 13.0, "junior": 7.5, "senior": 24.0, "executive": 40.0},
    "sre":                  {"mid": 15.0, "junior": 9.0, "senior": 28.0, "executive": 45.0},
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
    elif any(k in t for k in ["machine learning", " ml ", "ai engineer", "mlops"]):
        role = "ml-engineer"
    elif any(k in t for k in ["data analyst", "business analyst", "data scientist", "bi analyst"]):
        role = "data-professional"
    elif any(k in t for k in ["cyber", "security", "infosec", "penetration"]):
        role = "cybersecurity"
    elif any(k in t for k in ["frontend", "front end", "front-end", "react developer", "angular developer"]):
        role = "frontend-developer"
    elif any(k in t for k in ["backend", "back end", "back-end", "node developer", "java developer",
                               "python developer", "django", "spring", ".net developer"]):
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


def parse_salary_lpa(s):
    if not s or str(s).strip() in ("", "nan", "Not Disclosed", "Not disclosed"):
        return None
    s = str(s).replace(",", "").lower().strip()
    nums = [float(m) for m in re.findall(r"(\d+(?:\.\d+)?)", s)]
    if not nums:
        return None
    if any(n > 50000 for n in nums):
        lpa_nums = [n / 100000.0 for n in nums if n > 10000]
        if lpa_nums:
            avg = sum(lpa_nums) / len(lpa_nums)
            if 1.0 <= avg <= 200.0:
                return round(avg, 2)
    elif any(0.5 <= n <= 200.0 for n in nums):
        lpa_nums = [n for n in nums if 0.5 <= n <= 200.0]
        if lpa_nums:
            avg = sum(lpa_nums) / len(lpa_nums)
            if avg <= 200.0:
                return round(avg, 2)
    return None


def extract_skills(text: str) -> set:
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


def make_role_stats():
    return {
        "salaries_lpa":     [],
        "skill_counts":     defaultdict(int),
        "locations":        defaultdict(int),
        "total":            0,
        "seniority_counts": defaultdict(int),
    }


KNOWN_CITIES = [
    ("Bengaluru", ["bengaluru", "bangalore"]),
    ("Hyderabad", ["hyderabad"]),
    ("Chennai",   ["chennai", "madras"]),
    ("Mumbai",    ["mumbai", "bombay"]),
    ("Pune",      ["pune"]),
    ("Gurugram",  ["gurugram", "gurgaon"]),
    ("Noida",     ["noida"]),
    ("Delhi",     ["delhi", "new delhi"]),
    ("Kolkata",   ["kolkata", "calcutta"]),
    ("Ahmedabad", ["ahmedabad"]),
    ("Jaipur",    ["jaipur"]),
]

def match_city(loc_str: str):
    loc = loc_str.lower()
    for canonical, variants in KNOWN_CITIES:
        if any(v in loc for v in variants):
            return canonical
    return None


def ingest_naukri(role_stats):
    if not os.path.exists(NAUKRI_FILE):
        print(f"  [skip] {NAUKRI_FILE} not found")
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
            lpa  = parse_salary_lpa(row.get("payrate", ""))
            city = match_city(row.get("joblocation_address", ""))

            rs = role_stats[role_key]
            rs["total"] += 1
            rs["seniority_counts"][seniority] += 1
            if lpa:
                rs["salaries_lpa"].append(lpa)
            if city:
                rs["locations"][city] += 1
            for skill in extract_skills(desc):
                rs["skill_counts"][skill] += 1
            count += 1
    return count


def ingest_indeed(role_stats):
    if not os.path.exists(INDEED_FILE):
        print(f"  [skip] {INDEED_FILE} not found")
        return 0
    count = 0
    with open(INDEED_FILE, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            country = (row.get("country", "") or row.get("inferred_country", "")).strip().lower()
            if country and country not in ("in", "india", ""):
                continue

            res = classify_role(row.get("job_title", ""))
            if not res:
                continue
            seniority, role, role_key = res

            desc = row.get("job_description", "").lower()

            sal_from = parse_salary_lpa(row.get("inferred_salary_from", ""))
            sal_to   = parse_salary_lpa(row.get("inferred_salary_to", ""))
            if sal_from and sal_to:
                lpa = round((sal_from + sal_to) / 2, 2)
            elif sal_from:
                lpa = sal_from
            elif sal_to:
                lpa = sal_to
            else:
                lpa = None

            city_raw = (row.get("city", "") or row.get("inferred_city", "") or "").strip()
            city = match_city(city_raw)

            rs = role_stats[role_key]
            rs["total"] += 1
            rs["seniority_counts"][seniority] += 1
            if lpa:
                rs["salaries_lpa"].append(lpa)
            if city:
                rs["locations"][city] += 1
            for skill in extract_skills(desc):
                rs["skill_counts"][skill] += 1
            count += 1
    return count


SKILL2VEC_MAP = {
    "Python":          ["python"],
    "Java":            ["java", "j2ee", "jee"],
    "JavaScript":      ["javascript", "js"],
    "C#":              [".net", "c#", "asp.net", "wcf", "wpf"],
    "PHP":             ["php", "laravel"],
    "SQL":             ["sql", "oracle", "mysql", "postgresql"],
    "MongoDB":         ["mongodb"],
    "AWS":             ["aws", "amazon"],
    "Docker":          ["docker"],
    "Kubernetes":      ["kubernetes", "k8s"],
    "Angular":         ["angular", "angularjs"],
    "React":           ["react", "reactjs"],
    "Node.js":         ["node", "nodejs", "express"],
    "Machine Learning":["machine learning", "ml"],
    "Deep Learning":   ["deep learning"],
    "TensorFlow":      ["tensorflow"],
    "Scikit-learn":    ["scikit", "sklearn"],
    "Spark":           ["spark", "pyspark"],
    "Agile/Scrum":     ["agile", "scrum"],
    "Linux":           ["linux", "unix"],
    "Shell/Bash":      ["bash", "shell"],
}

def ingest_skill2vec(role_stats):
    if not os.path.exists(SKILL2VEC_FILE):
        print(f"  [skip] {SKILL2VEC_FILE} not found")
        return 0
    tech_roles = [k for k in role_stats if role_stats[k]["total"] > 0
                  and "manager" not in k and "designer" not in k]
    if not tech_roles:
        return 0
    count = 0
    with open(SKILL2VEC_FILE, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            parts = [p.strip().lower() for p in line.strip().split(",") if p.strip()]
            if len(parts) < 2:
                continue
            skill_tokens = parts[1:] if parts[0].isdigit() else parts
            for display, aliases in SKILL2VEC_MAP.items():
                if any(a in skill_tokens for a in aliases):
                    for rk in tech_roles:
                        role_stats[rk]["skill_counts"][display] += 1
            count += 1
    return count


def build_model(role_stats):
    MIN_POSTINGS = 10
    final = {}
    for role_key, rs in role_stats.items():
        if rs["total"] < MIN_POSTINGS:
            continue

        salaries = rs["salaries_lpa"]
        seniority_hint = max(rs["seniority_counts"], key=rs["seniority_counts"].get) \
            if rs["seniority_counts"] else "mid"
        base_role = re.sub(r"^(junior|senior|mid|executive)-", "", role_key)
        fallback_avg = ROLE_SALARY_FALLBACK.get(base_role, {}).get(seniority_hint, 12.0)

        avg_lpa = round(sum(salaries) / len(salaries), 1) if salaries else fallback_avg
        min_lpa = round(min(salaries), 1) if salaries else round(avg_lpa * 0.6, 1)
        max_lpa = round(max(salaries), 1) if salaries else round(avg_lpa * 1.6, 1)
        avg_lpa = min(avg_lpa, 120.0)
        min_lpa = min(min_lpa, avg_lpa)
        max_lpa = min(max_lpa, 200.0)

        skills_list = [
            {
                "skill":         skill,
                "count":         cnt,
                "frequency_pct": round((cnt / rs["total"]) * 100),
            }
            for skill, cnt in sorted(rs["skill_counts"].items(), key=lambda x: x[1], reverse=True)[:25]
        ]

        top_cities = [c for c, _ in sorted(rs["locations"].items(), key=lambda x: x[1], reverse=True)[:5]]
        if not top_cities:
            top_cities = ["Bengaluru", "Hyderabad", "Gurugram", "Pune", "Mumbai"]

        final[role_key] = {
            "role":               role_key.replace("-", " ").title(),
            "salary_avg_lpa":     avg_lpa,
            "salary_range_lpa":   {"min": min_lpa, "max": max_lpa, "currency": "INR"},
            "sample_size":        rs["total"],
            "salary_data_points": len(salaries),
            "seniority":          seniority_hint,
            "top_locations":      top_cities,
            "skills":             skills_list,
        }
    return final


def main():
    print("=" * 60)
    print("  SKILLPATH INDIA MODEL TRAINER v2")
    print("=" * 60)

    role_stats = defaultdict(make_role_stats)

    print("\n[1/3] Ingesting Naukri dataset (22K rows)...")
    n1 = ingest_naukri(role_stats)
    print(f"      -> {n1:,} valid tech job rows processed")

    print("\n[2/3] Ingesting Indeed India dataset (93K rows)...")
    n2 = ingest_indeed(role_stats)
    print(f"      -> {n2:,} valid tech job rows processed")

    print("\n[3/3] Ingesting skill2vec 10K (skill frequency booster)...")
    n3 = ingest_skill2vec(role_stats)
    print(f"      -> {n3:,} skill records used for boosting")

    total = n1 + n2
    print(f"\n  Total real job postings processed: {total:,}")
    print(f"  Role buckets found: {len(role_stats)}")

    print("\nBuilding final model...")
    model = build_model(role_stats)

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(model, f, indent=2, ensure_ascii=False)

    print(f"\nModel saved -> {OUTPUT_FILE}")
    print(f"   Roles: {len(model)}")
    for role_key, data in sorted(model.items(), key=lambda x: x[1]["sample_size"], reverse=True):
        print(f"   {role_key:<35} | {data['sample_size']:>6} postings | Rs{data['salary_avg_lpa']:.1f} LPA | {len(data['skills'])} skills")
    print("\nDone!")


if __name__ == "__main__":
    main()
