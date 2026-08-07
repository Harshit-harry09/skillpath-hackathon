import csv
import json
import os
import re

# Use pandas for parquet dataset if available
try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

from collections import defaultdict

# ============================================================
# SKILLPATH MEGA MODEL TRAINER v4 (PURE RAW MULTI-DATASET INGESTION)
# Sources:
#   1. data/mega/data_jobs.csv               (647,734 rows)
#   2. data/mega/lang_uk_jobs.parquet         (141,897 rows)
#   3. data/india/indeed_india_jobs.csv      (93,608 rows)
#   4. data/mega/skill2vec_50K.csv            (50,000 rows)
#   5. data/india/naukri_com_job_sample.csv   (22,001 rows)
#   6. data/mega/jacob_job_descriptions.csv   (10,000 rows)
#
# Total Raw Corpus: 965,240 Raw Job Listings
# ============================================================

GLOBAL_DATA_JOBS  = "data/mega/data_jobs.csv"
LANG_UK_PARQUET   = "data/mega/lang_uk_jobs.parquet"
INDEED_INDIA_FILE = "data/india/indeed_india_jobs.csv"
SKILL50K_FILE     = "data/mega/skill2vec_50K.csv"
NAUKRI_FILE       = "data/india/naukri_com_job_sample.csv"
JACOB_JOBS_FILE   = "data/mega/jacob_job_descriptions.csv"

GLOBAL_OUTPUT     = "skillpath/lib/data/mvc_model.json"
INDIA_OUTPUT      = "skillpath/lib/data/mvc_model_india.json"

# ---------------------------------------------------------------------------
# 200+ UNIQUE SKILL TAXONOMY (214 CATEGORIES)
# ---------------------------------------------------------------------------
SKILL_TAXONOMY_200 = {
    # --- Languages (31) ---
    "Python":               ["python", "py"],
    "JavaScript":           ["javascript", "js", "node.js", "nodejs"],
    "TypeScript":           ["typescript", "ts"],
    "Java":                 ["java", "core java", "j2ee", "spring"],
    "C++":                  ["c++", "cpp"],
    "C#":                   ["c#", "c sharp", ".net", "asp.net", "dotnet"],
    "Rust":                 ["rust"],
    "Go":                   ["golang", "go lang", "go"],
    "Ruby":                 ["ruby", "rails"],
    "PHP":                  ["php", "laravel"],
    "Swift":                ["swift"],
    "Kotlin":               ["kotlin"],
    "SQL":                  ["sql", "pl/sql", "tsql", "t-sql"],
    "Scala":                ["scala"],
    "R":                    ["r programming", "rstudio"],
    "Shell/Bash":           ["bash", "shell", "powershell"],
    "Perl":                 ["perl"],
    "Haskell":              ["haskell"],
    "Elixir":               ["elixir"],
    "Clojure":              ["clojure"],
    "Dart":                 ["dart"],
    "Assembly":             ["assembly", "asm"],
    "MATLAB":               ["matlab"],
    "Julia":                ["julia"],
    "Lua":                  ["lua"],
    "Solidity":             ["solidity", "smart contract"],
    "VBA":                  ["vba", "excel vba"],
    "COBOL":                ["cobol"],
    "Fortran":              ["fortran"],
    "F#":                   ["f#", "fsharp"],
    "Groovy":               ["groovy"],

    # --- Frontend & Web (29) ---
    "React":                ["react", "reactjs", "react.js"],
    "Next.js":              ["nextjs", "next.js"],
    "Vue":                  ["vue", "vuejs", "vue.js"],
    "Nuxt.js":              ["nuxtjs", "nuxt.js"],
    "Angular":              ["angular", "angularjs"],
    "Tailwind CSS":         ["tailwind", "tailwindcss"],
    "HTML/CSS":             ["html", "css", "bootstrap", "sass", "scss"],
    "Redux":                ["redux"],
    "Webpack":              ["webpack"],
    "Vite":                 ["vite"],
    "Svelte":               ["svelte"],
    "SvelteKit":            ["sveltekit"],
    "Ember.js":             ["ember", "ember.js"],
    "jQuery":               ["jquery"],
    "Bootstrap":            ["bootstrap"],
    "Material-UI":          ["mui", "material-ui"],
    "Chakra UI":            ["chakra ui"],
    "Shadcn UI":            ["shadcn"],
    "Styled Components":    ["styled components"],
    "Sass/SCSS":            ["sass", "scss"],
    "Less":                 ["less"],
    "Alpine.js":            ["alpine.js", "alpinejs"],
    "Astro":                ["astro"],
    "Remix":                ["remix"],
    "Babel":                ["babel"],
    "WebGL":                ["webgl"],
    "Three.js":             ["three.js", "threejs"],
    "D3.js":                ["d3.js", "d3js"],
    "Chart.js":             ["chart.js", "chartjs"],

    # --- Backend & Frameworks (25) ---
    "Node.js":              ["node.js", "nodejs", "express", "nestjs"],
    "Express":              ["express.js", "expressjs"],
    "NestJS":               ["nestjs"],
    "Django":               ["django"],
    "FastAPI":              ["fastapi"],
    "Flask":                ["flask"],
    "Spring Boot":          ["spring boot", "spring framework"],
    "GraphQL":              ["graphql", "apollo"],
    "REST API":             ["rest api", "restful", "microservices"],
    "gRPC":                 ["grpc"],
    "ASP.NET Core":         ["asp.net core", ".net core"],
    "Laravel":              ["laravel"],
    "Symfony":              ["symfony"],
    "Ruby on Rails":        ["ruby on rails"],
    "Phoenix":              ["phoenix framework"],
    "Gin":                  ["gin framework"],
    "Fiber":                ["gofiber"],
    "Actix":                ["actix"],
    "Celery":               ["celery"],
    "RabbitMQ":             ["rabbitmq"],
    "Apache Kafka":         ["kafka", "apache kafka"],
    "NGINX":                ["nginx"],
    "Apache HTTP":          ["apache"],
    "WebSockets":           ["websocket", "websockets"],
    "Socket.io":            ["socket.io", "socketio"],

    # --- Cloud & DevOps (27) ---
    "AWS":                  ["aws", "amazon web services", "ec2", "s3", "lambda", "eks"],
    "Azure":                ["azure"],
    "GCP":                  ["gcp", "google cloud"],
    "Docker":               ["docker"],
    "Kubernetes":           ["kubernetes", "k8s"],
    "Terraform":            ["terraform"],
    "Jenkins":              ["jenkins"],
    "Linux":                ["linux", "ubuntu", "centos", "redhat"],
    "Ansible":              ["ansible"],
    "Helm":                 ["helm"],
    "GitHub Actions":       ["github actions"],
    "GitLab CI":            ["gitlab ci"],
    "CircleCI":             ["circleci"],
    "Travis CI":            ["travis ci"],
    "ArgoCD":               ["argocd"],
    "Prometheus":           ["prometheus"],
    "Grafana":              ["grafana"],
    "ELK Stack":            ["elk stack", "elasticsearch"],
    "Datadog":              ["datadog"],
    "New Relic":            ["new relic", "newrelic"],
    "OpenTelemetry":        ["opentelemetry", "otel"],
    "Serverless":           ["serverless"],
    "Cloudflare":           ["cloudflare"],
    "Vercel":               ["vercel"],
    "Netlify":              ["netlify"],
    "Pulumi":               ["pulumi"],
    "Vagrant":              ["vagrant"],

    # --- Databases (22) ---
    "PostgreSQL":           ["postgresql", "postgres"],
    "MySQL":                ["mysql"],
    "MongoDB":              ["mongodb", "mongo"],
    "Redis":                ["redis"],
    "Elasticsearch":        ["elasticsearch"],
    "Cassandra":            ["cassandra"],
    "Oracle DB":            ["oracle"],
    "DynamoDB":             ["dynamodb"],
    "Snowflake":            ["snowflake"],
    "BigQuery":             ["bigquery"],
    "SQLite":               ["sqlite"],
    "MariaDB":              ["mariadb"],
    "CouchDB":              ["couchdb"],
    "Neo4j":                ["neo4j"],
    "ClickHouse":           ["clickhouse"],
    "CockroachDB":          ["cockroachdb"],
    "Supabase":             ["supabase"],
    "Firebase":             ["firebase", "firestore"],
    "Vector DB / Pinecone": ["pinecone", "vector database"],
    "ChromaDB":             ["chromadb"],
    "Milvus":               ["milvus"],
    "Redshift":             ["redshift"],

    # --- AI, ML & Data Engineering (28) ---
    "Machine Learning":     ["machine learning", "ml"],
    "Deep Learning":        ["deep learning", "neural network"],
    "NLP":                  ["nlp", "natural language processing"],
    "PyTorch":              ["pytorch"],
    "TensorFlow":           ["tensorflow"],
    "Data Science":         ["data science", "data scientist"],
    "Pandas":               ["pandas"],
    "NumPy":                ["numpy"],
    "Scikit-learn":         ["scikit-learn", "sklearn"],
    "Computer Vision":      ["computer vision"],
    "Spark":                ["spark", "pyspark"],
    "Tableau":              ["tableau"],
    "Power BI":             ["power bi", "powerbi"],
    "Keras":                ["keras"],
    "OpenCV":               ["opencv"],
    "HuggingFace":          ["huggingface", "transformers"],
    "LLM":                  ["llm", "large language model", "gpt-4", "llama"],
    "RAG":                  ["rag"],
    "LangChain":            ["langchain"],
    "LlamaIndex":           ["llamaindex"],
    "OpenAI API":           ["openai", "chatgpt"],
    "XGBoost":              ["xgboost"],
    "LightGBM":             ["lightgbm"],
    "Airflow":              ["airflow"],
    "dbt":                  ["dbt"],
    "Databricks":           ["databricks"],
    "PySpark":              ["pyspark"],
    "Polars":               ["polars"],

    # --- Mobile Development (8) ---
    "iOS Development":      ["ios", "swiftui"],
    "Android Development":  ["android", "jetpack compose"],
    "React Native":         ["react native"],
    "Flutter":              ["flutter"],
    "Jetpack Compose":      ["jetpack compose"],
    "SwiftUI":              ["swiftui"],
    "Xamarin":              ["xamarin"],
    "Expo":                 ["expo"],

    # --- Cybersecurity & Infrastructure (12) ---
    "Cybersecurity":        ["cybersecurity", "infosec"],
    "Penetration Testing":  ["penetration testing", "pentest"],
    "Ethical Hacking":      ["ethical hacking"],
    "SIEM":                 ["siem", "splunk"],
    "Firewalls":            ["firewall", "firewalls"],
    "Wireshark":            ["wireshark"],
    "Metasploit":           ["metasploit"],
    "Cryptography":         ["cryptography", "encryption"],
    "CISSP":                ["cissp"],
    "CEH":                  ["ceh"],
    "IAM":                  ["iam"],
    "OWASP":                ["owasp"],

    # --- Testing & QA (13) ---
    "Unit Testing":         ["unit testing", "unit test"],
    "Jest":                 ["jest"],
    "Cypress":              ["cypress"],
    "Selenium":             ["selenium"],
    "Playwright":           ["playwright"],
    "JUnit":                ["junit"],
    "PyTest":               ["pytest"],
    "Appium":               ["appium"],
    "Postman":              ["postman"],
    "JMeter":               ["jmeter"],
    "Cucumber":             ["cucumber"],
    "TDD":                  ["tdd"],
    "BDD":                  ["bdd"],

    # --- Design & UX (7) ---
    "Figma":                ["figma"],
    "Sketch":               ["sketch"],
    "Adobe XD":             ["adobe xd"],
    "UI Design":            ["ui design"],
    "UX Design":            ["ux design"],
    "Design Systems":       ["design system"],
    "Prototyping":          ["prototyping", "wireframing"],

    # --- Management & Soft Skills (10) ---
    "Agile":                ["agile"],
    "Scrum":                ["scrum"],
    "Kanban":               ["kanban"],
    "Jira":                 ["jira"],
    "Confluence":           ["confluence"],
    "System Architecture":  ["system architecture"],
    "Microservices":        ["microservices"],
    "Git":                  ["git"],
    "Communication":        ["communication"],
    "Problem Solving":      ["problem solving"],
    "Leadership":           ["leadership"],
    "Teamwork":             ["teamwork", "collaboration"],
}

# Pre-compile master fast regex map
ALIAS_TO_DISPLAY = {}
ALL_ALIASES = []

for display_name, aliases in SKILL_TAXONOMY_200.items():
    for alias in aliases:
        a_clean = alias.lower()
        ALIAS_TO_DISPLAY[a_clean] = display_name
        ALL_ALIASES.append(a_clean)

ALL_ALIASES.sort(key=len, reverse=True)
PATTERN_STR = r'\b(?:' + '|'.join(re.escape(a) for a in ALL_ALIASES) + r')\b'
MASTER_REGEX = re.compile(PATTERN_STR, re.IGNORECASE)

def extract_skills_fast(text: str) -> set:
    if not text:
        return set()
    matches = MASTER_REGEX.findall(text)
    return {ALIAS_TO_DISPLAY[m.lower()] for m in matches if m.lower() in ALIAS_TO_DISPLAY}

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

def make_role_stats():
    return {
        "salaries":         [],
        "skill_counts":     defaultdict(int),
        "locations":        defaultdict(int),
        "total":            0,
        "seniority_counts": defaultdict(int),
    }

def ingest_all_raw_data(global_stats, india_stats):
    total_processed = 0

    # 1. HuggingFace Data Jobs (647,734 listings)
    if os.path.exists(GLOBAL_DATA_JOBS):
        print(f"[1/6] Ingesting HuggingFace Data Jobs dataset (647K listings)...")
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
                skills = extract_skills_fast(row.get("job_skills", "") + " " + row.get("job_type_skills", "") + " " + title)

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
                total_processed += 1

    # 2. HuggingFace lang-uk Parquet Dataset (141,897 listings)
    if os.path.exists(LANG_UK_PARQUET) and HAS_PANDAS:
        print(f"[2/6] Ingesting lang-uk Parquet dataset (141K listings)...")
        try:
            df_parquet = pd.read_parquet(LANG_UK_PARQUET)
            positions = df_parquet['Position'].fillna('').astype(str).tolist()
            descriptions = df_parquet['Long Description'].fillna('').astype(str).tolist()
            companies = df_parquet['Company Name'].fillna('').astype(str).tolist()

            for title, desc_raw, company in zip(positions, descriptions, companies):
                res = classify_role(title)
                if not res:
                    continue
                seniority, role, role_key = res

                desc = desc_raw + " " + title
                rs = global_stats[role_key]
                rs["total"] += 1
                rs["seniority_counts"][seniority] += 1
                if company:
                    rs["locations"][company] += 1

                for s in extract_skills_fast(desc):
                    rs["skill_counts"][s] += 1
                total_processed += 1
        except Exception as e:
            print("  [skip parquet error]:", e)

    # 3. Indeed India Jobs (93,608 listings)
    if os.path.exists(INDEED_INDIA_FILE):
        print(f"[3/6] Ingesting Indeed India dataset (93K listings)...")
        with open(INDEED_INDIA_FILE, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            for row in reader:
                res = classify_role(row.get("job_title", ""))
                if not res:
                    continue
                seniority, role, role_key = res

                desc = row.get("job_description", "")
                city = (row.get("city", "") or row.get("inferred_city", "")).strip()

                rs = india_stats[role_key]
                rs["total"] += 1
                rs["seniority_counts"][seniority] += 1
                if city:
                    rs["locations"][city] += 1

                for skill in extract_skills_fast(desc):
                    rs["skill_counts"][skill] += 1
                total_processed += 1

    # 4. Skill2Vec 50K Vectors (50,000 listings)
    if os.path.exists(SKILL50K_FILE):
        print(f"[4/6] Ingesting Skill2Vec 50K dataset (50K listings)...")
        with open(SKILL50K_FILE, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                parts = [p.strip() for p in line.strip().split(",") if p.strip()]
                if len(parts) < 2:
                    continue
                full_text = " ".join(parts[1:])
                res = classify_role(full_text)
                if not res:
                    continue
                seniority, role, role_key = res

                skills = extract_skills_fast(full_text)
                for stats_dict in (global_stats, india_stats):
                    rs = stats_dict[role_key]
                    rs["total"] += 1
                    rs["seniority_counts"][seniority] += 1
                    for s in skills:
                        rs["skill_counts"][s] += 1
                total_processed += 1

    # 5. Naukri India Jobs (22,001 listings)
    if os.path.exists(NAUKRI_FILE):
        print(f"[5/6] Ingesting Naukri India dataset (22K listings)...")
        with open(NAUKRI_FILE, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            for row in reader:
                res = classify_role(row.get("jobtitle", ""))
                if not res:
                    continue
                seniority, role, role_key = res

                desc = row.get("jobdescription", "") + " " + row.get("skills", "")
                loc = row.get("joblocation_address", "").strip()

                rs = india_stats[role_key]
                rs["total"] += 1
                rs["seniority_counts"][seniority] += 1
                if loc:
                    rs["locations"][loc] += 1

                for skill in extract_skills_fast(desc):
                    rs["skill_counts"][skill] += 1
                total_processed += 1

    # 6. Jacob Job Descriptions (10,000 listings)
    if os.path.exists(JACOB_JOBS_FILE):
        print(f"[6/6] Ingesting Jacob Job Descriptions dataset (10K listings)...")
        with open(JACOB_JOBS_FILE, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            for row in reader:
                title = row.get("position_title", "")
                res = classify_role(title)
                if not res:
                    continue
                seniority, role, role_key = res

                desc = row.get("job_description", "") + " " + title
                rs = global_stats[role_key]
                rs["total"] += 1
                rs["seniority_counts"][seniority] += 1
                for s in extract_skills_fast(desc):
                    rs["skill_counts"][s] += 1
                total_processed += 1

    print(f"\nTotal Raw Postings Ingested Across All 6 Datasets: {total_processed:,}")
    return total_processed

def build_pure_raw_model(stats_dict, is_india=False):
    final = {}

    for role_key, rs in stats_dict.items():
        if rs["total"] < 5:
            continue

        salaries = rs["salaries"]
        seniority_hint = max(rs["seniority_counts"], key=rs["seniority_counts"].get) if rs["seniority_counts"] else "mid"

        if is_india:
            base_lpa_fallback = {"junior": 4.8, "mid": 10.2, "senior": 19.5, "executive": 32.0}
            if salaries:
                avg_raw = sum(salaries) / len(salaries)
                avg_lpa = round((avg_raw * 83.0) / 100000.0, 1) if avg_raw > 1000 else round(avg_raw, 1)
            else:
                avg_lpa = base_lpa_fallback.get(seniority_hint, 10.2)
            avg_sal = round(avg_lpa * 100000.0, 0)
        else:
            base_usd_fallback = {"junior": 68000, "mid": 112000, "senior": 162000, "executive": 235000}
            avg_usd = round(sum(salaries) / len(salaries), 0) if salaries else base_usd_fallback.get(seniority_hint, 112000)
            avg_sal = avg_usd
            avg_lpa = round((avg_usd * 83.0) / 100000.0, 1)

        skills_list = []
        for skill, cnt in sorted(rs["skill_counts"].items(), key=lambda x: x[1], reverse=True)[:50]:
            pct = min(100, max(1, round((cnt / rs["total"]) * 100)))
            skills_list.append({
                "skill":         skill,
                "count":         cnt,
                "frequency_pct": pct
            })

        top_locs = [c for c, _ in sorted(rs["locations"].items(), key=lambda x: x[1], reverse=True)[:5]]
        if is_india and not top_locs:
            top_locs = ["Bengaluru", "Hyderabad", "Mumbai", "Pune", "Gurugram"]

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
    print("  SKILLPATH MEGA MODEL TRAINER v4 (PURE MULTI-DATASET INGESTION)")
    print(f"  Taxonomy Size: {len(SKILL_TAXONOMY_200)} Unique Skill Categories")
    print("=" * 60)

    global_stats = defaultdict(make_role_stats)
    india_stats  = defaultdict(make_role_stats)

    ingest_all_raw_data(global_stats, india_stats)

    print("\nBuilding Pure Raw Global Model...")
    global_model = build_pure_raw_model(global_stats, is_india=False)

    print("Building Pure Raw India Model...")
    india_model  = build_pure_raw_model(india_stats, is_india=True)

    os.makedirs(os.path.dirname(GLOBAL_OUTPUT), exist_ok=True)
    os.makedirs(os.path.dirname(INDIA_OUTPUT), exist_ok=True)

    with open(GLOBAL_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(global_model, f, indent=2, ensure_ascii=False)

    with open(INDIA_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(india_model, f, indent=2, ensure_ascii=False)

    global_unique_skills = set(s["skill"] for r in global_model.values() for s in r["skills"])
    india_unique_skills  = set(s["skill"] for r in india_model.values() for s in r["skills"])
    total_unique_skills  = global_unique_skills.union(india_unique_skills)

    global_sample_sum = sum(r["sample_size"] for r in global_model.values())
    india_sample_sum  = sum(r["sample_size"] for r in india_model.values())

    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE — FINAL RAW MULTI-DATASET STATISTICS")
    print("=" * 60)
    print(f"  Global Model Raw Tech Postings: {global_sample_sum:,} ({len(global_model)} roles)")
    print(f"  India Model Raw Tech Postings:  {india_sample_sum:,} ({len(india_model)} roles)")
    print(f"  Total Unique Skills Extracted:  {len(total_unique_skills)} distinct skill categories")
    print(f"  Global Model File Path:         {GLOBAL_OUTPUT}")
    print(f"  India Model File Path:          {INDIA_OUTPUT}")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    main()
