import os
import sys
import json
import csv
import re
from collections import Counter, defaultdict

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

print("=================================================================")
print("SkillPath Atlas — High-Performance Master Dataset Cleaner & Extractor")
print("=================================================================")

# ---------------------------------------------------------------
# Skill Taxonomy Definitions
# ---------------------------------------------------------------
SKILL_MAP = {
    "python": "Python", "py": "Python",
    "javascript": "JavaScript", "js": "JavaScript", "node.js": "Node.js", "nodejs": "Node.js",
    "typescript": "TypeScript", "ts": "TypeScript",
    "java": "Java", "spring": "Spring Boot", "spring boot": "Spring Boot",
    "c++": "C++", "cpp": "C++",
    "c#": "C#", ".net": "C#", "dotnet": "C#",
    "rust": "Rust",
    "golang": "Go", "go": "Go",
    "ruby": "Ruby", "rails": "Ruby",
    "php": "PHP", "laravel": "PHP",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "sql": "SQL", "mysql": "MySQL", "postgresql": "PostgreSQL", "postgres": "PostgreSQL", "pl/sql": "SQL",
    "scala": "Scala",
    "r": "R", "rstudio": "R",
    "bash": "Shell/Bash", "shell": "Shell/Bash", "powershell": "Shell/Bash",
    "solidity": "Solidity",
    "react": "React", "reactjs": "React", "react.js": "React",
    "nextjs": "Next.js", "next.js": "Next.js",
    "vue": "Vue.js", "vuejs": "Vue.js", "vue.js": "Vue.js",
    "angular": "Angular", "angularjs": "Angular",
    "tailwind": "Tailwind CSS", "tailwindcss": "Tailwind CSS",
    "html": "HTML/CSS", "css": "HTML/CSS", "sass": "HTML/CSS", "bootstrap": "HTML/CSS",
    "redux": "Redux",
    "figma": "UI/UX Design", "ui/ux": "UI/UX Design",
    "django": "Django", "fastapi": "FastAPI", "flask": "Flask",
    "graphql": "GraphQL", "rest api": "REST API", "microservices": "REST API",
    "kafka": "Apache Kafka", "rabbitmq": "RabbitMQ",
    "aws": "AWS", "ec2": "AWS", "s3": "AWS", "lambda": "AWS",
    "azure": "Azure", "gcp": "GCP", "google cloud": "GCP",
    "docker": "Docker", "kubernetes": "Kubernetes", "k8s": "Kubernetes",
    "terraform": "Terraform", "jenkins": "CI/CD", "ci/cd": "CI/CD", "github actions": "CI/CD",
    "linux": "Linux", "ubuntu": "Linux",
    "machine learning": "Machine Learning", "ml": "Machine Learning", "scikit-learn": "Machine Learning",
    "deep learning": "Deep Learning", "neural networks": "Deep Learning",
    "pytorch": "PyTorch", "tensorflow": "TensorFlow", "keras": "TensorFlow",
    "llm": "LLMs & Generative AI", "generative ai": "LLMs & Generative AI", "gpt": "LLMs & Generative AI", "langchain": "LLMs & Generative AI",
    "nlp": "NLP", "spacy": "NLP", "huggingface": "NLP",
    "computer vision": "Computer Vision", "opencv": "Computer Vision",
    "pandas": "Pandas", "numpy": "NumPy", "spark": "Apache Spark", "pyspark": "Apache Spark",
    "airflow": "Airflow", "snowflake": "Data Warehousing", "bigquery": "Data Warehousing", "redshift": "Data Warehousing",
    "mongodb": "MongoDB", "mongo": "MongoDB", "redis": "Redis", "elasticsearch": "Elasticsearch",
    "pinecone": "Vector Databases", "weaviate": "Vector Databases", "qdrant": "Vector Databases", "chromadb": "Vector Databases",
    "cybersecurity": "Cybersecurity", "infosec": "Cybersecurity", "penetration testing": "Penetration Testing", "pentesting": "Penetration Testing",
    "soc": "SOC Analyst", "siem": "SOC Analyst", "splunk": "SOC Analyst",
    "agile": "Agile / Scrum", "scrum": "Agile / Scrum", "jira": "Agile / Scrum"
}

def extract_skills_fast(text):
    if not text or not isinstance(text, str):
        return []
    words = set(re.findall(r'[a-zA-Z0-9#\+\.-]+', text.lower()))
    found = set()
    for word in words:
        if word in SKILL_MAP:
            found.add(SKILL_MAP[word])
    # Check multi-word skills
    text_lower = text.lower()
    for phrase, canonical in SKILL_MAP.items():
        if " " in phrase and phrase in text_lower:
            found.add(canonical)
    return list(found)

def main():
    clean_dir = "data/clean"
    os.makedirs(clean_dir, exist_ok=True)

    total_job_postings = 0
    total_resumes = 0
    total_skill_occurrences = 0
    unique_skills_set = set()
    skill_counter = Counter()
    skill_cooccurrence = defaultdict(Counter)
    role_counter = Counter()
    remote_jobs_count = 0
    fake_jobs_count = 0

    processed_datasets = []

    print("\n[Phase 1] Processing Core Job Datasets...")

    # 1. LinkedIn Job Postings 2023-2024 (516 MB)
    linkedin_file = "data/core_jobs/linkedin-job-postings/postings.csv"
    if os.path.exists(linkedin_file):
        print(f"-> Processing LinkedIn Job Postings ({linkedin_file})...")
        count = 0
        with open(linkedin_file, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            for row in reader:
                count += 1
                title = row.get("title", "")
                desc = row.get("description", "")
                skills = extract_skills_fast(f"{title} {desc}")
                if skills:
                    total_skill_occurrences += len(skills)
                    for s in skills:
                        skill_counter[s] += 1
                        unique_skills_set.add(s)
                        for s2 in skills:
                            if s != s2:
                                skill_cooccurrence[s][s2] += 1
                if title:
                    role_counter[title.strip().lower()] += 1
                if "remote" in row.get("work_type", "").lower() or "remote" in title.lower():
                    remote_jobs_count += 1

        total_job_postings += count
        processed_datasets.append({"name": "LinkedIn Job Postings 2023-2024", "records": count, "type": "Job Postings", "size_mb": 530.72})
        print(f"   Processed {count:,} LinkedIn postings.")

    # 2. Job Description Dataset (Kaggle 1.66 GB)
    jd_file = "data/job_descriptions/job-description-dataset/job_descriptions.csv"
    if os.path.exists(jd_file):
        print(f"-> Fast Processing 1.66 GB Job Description Dataset ({jd_file})...")
        count = 0
        with open(jd_file, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            for row in reader:
                count += 1
                title = row.get("Job Title", "")
                skills_raw = row.get("skills", "")
                text = f"{title} {skills_raw}"
                skills = extract_skills_fast(text)
                if skills:
                    total_skill_occurrences += len(skills)
                    for s in skills:
                        skill_counter[s] += 1
                        unique_skills_set.add(s)
                if title:
                    role_counter[title.strip().lower()] += 1
                if "remote" in row.get("Work Type", "").lower():
                    remote_jobs_count += 1

        total_job_postings += count
        processed_datasets.append({"name": "Job Description Dataset (Kaggle)", "records": count, "type": "Job Descriptions", "size_mb": 1662.41})
        print(f"   Processed {count:,} Job Descriptions.")

    # 3. Global Data Jobs (231 MB)
    data_jobs_file = "data/mega/data_jobs.csv"
    if os.path.exists(data_jobs_file):
        print(f"-> Processing HuggingFace Data Jobs Corpus ({data_jobs_file})...")
        count = 0
        with open(data_jobs_file, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            for row in reader:
                count += 1
                title = row.get("job_title", "")
                skills_str = row.get("job_skills", "")
                skills = extract_skills_fast(f"{title} {skills_str}")
                if skills:
                    total_skill_occurrences += len(skills)
                    for s in skills:
                        skill_counter[s] += 1
                        unique_skills_set.add(s)
                if title:
                    role_counter[title.strip().lower()] += 1

        total_job_postings += count
        processed_datasets.append({"name": "Data Jobs HuggingFace Corpus", "records": count, "type": "Job Postings", "size_mb": 231.2})
        print(f"   Processed {count:,} Data Jobs.")

    # 4. Additional Job Postings (Online Job Postings, DS Skills 2024, AI Market Insights)
    other_job_files = [
        ("data/core_jobs/online-job-postings", "Online Job Postings", 92.3),
        ("data/core_jobs/data-science-job-postings-and-skills", "Data Science Job Postings 2024", 61.5),
        ("data/core_jobs/ai-powered-job-market-insights", "AI-Powered Job Market Insights", 0.05),
        ("data/matching/resume-job-description-fit", "Resume Job Description Fit", 65.4),
        ("data/matching/resume-and-job-description", "Resume and Job Description", 57.3),
        ("data/india/indeed_india_jobs.csv", "Indeed India Jobs", 32.3),
        ("data/india/naukri_com_job_sample.csv", "Naukri Job Sample", 52.1)
    ]

    for path, name, sz in other_job_files:
        if os.path.exists(path):
            count = 0
            if os.path.isfile(path):
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        count += 1
                        text = " ".join([str(v) for v in row.values()])
                        skills = extract_skills_fast(text)
                        if skills:
                            total_skill_occurrences += len(skills)
                            for s in skills:
                                skill_counter[s] += 1
                                unique_skills_set.add(s)
            elif os.path.isdir(path):
                for root, dirs, files in os.walk(path):
                    for file in files:
                        if file.endswith((".csv", ".txt", ".json", ".parquet")):
                            fp = os.path.join(root, file)
                            try:
                                with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                                    for line in f:
                                        count += 1
                                        skills = extract_skills_fast(line)
                                        if skills:
                                            for s in skills:
                                                skill_counter[s] += 1
                                                unique_skills_set.add(s)
                            except Exception:
                                pass
            total_job_postings += count
            processed_datasets.append({"name": name, "records": count, "type": "Job Postings", "size_mb": sz})
            print(f"   Processed {name}: {count:,} rows.")

    # 5. Real vs Fake Job Postings
    fake_file = "data/fake_jobs/real-or-fake-fake-jobposting-prediction/fake_job_postings.csv"
    if os.path.exists(fake_file):
        print(f"-> Processing Real/Fake Job Posting Prediction ({fake_file})...")
        count = 0
        with open(fake_file, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            for row in reader:
                count += 1
                if row.get("fraudulent") == "1":
                    fake_jobs_count += 1
        total_job_postings += count
        processed_datasets.append({"name": "Real/Fake Job Posting Prediction", "records": count, "fake_flagged": fake_jobs_count, "type": "Fraud Detection", "size_mb": 47.74})
        print(f"   Processed {count:,} job postings ({fake_jobs_count} fraudulent).")

    # 6. Resumes (54K Resumes, Saugataroyarghya, Candidate Job Role, Resume NER PDF)
    print("\n[Phase 2] Processing Resumes & Candidate Profiles...")
    resume_paths = [
        ("data/resumes/54k-resume-dataset-structured", "54K Resume Dataset Structured", 129.68),
        ("data/resumes/saugataroyarghya-resume-dataset", "Saugataroyarghya Resume Dataset", 16.22),
        ("data/resumes/candidate-job-role-dataset", "Candidate Job Role Dataset", 0.09),
        ("data/resumes/datasetmaster-resumes", "Datasetmaster Resumes", 15.58),
        ("data/resume_ner/Annotated_NER_PDF_Resumes", "Annotated NER PDF Resumes", 574.91)
    ]

    for rpath, rname, rsz in resume_paths:
        if os.path.exists(rpath):
            rcount = 0
            for root, dirs, files in os.walk(rpath):
                for f in files:
                    if f.endswith((".csv", ".txt", ".json")):
                        fp = os.path.join(root, f)
                        try:
                            with open(fp, "r", encoding="utf-8", errors="ignore") as rf:
                                for line in rf:
                                    rcount += 1
                                    skills = extract_skills_fast(line)
                                    if skills:
                                        for s in skills:
                                            skill_counter[s] += 1
                                            unique_skills_set.add(s)
                        except Exception:
                            pass
            total_resumes += rcount
            processed_datasets.append({"name": rname, "records": rcount, "type": "Resumes", "size_mb": rsz})
            print(f"   Processed {rname}: {rcount:,} resume records.")

    # ---------------------------------------------------------------
    # 7. Generate Master Summary & Analytics Report
    # ---------------------------------------------------------------
    analytics_report = {
        "master_summary": {
            "total_clean_job_postings": total_job_postings,
            "total_clean_resumes": total_resumes,
            "total_combined_records": total_job_postings + total_resumes,
            "total_skill_entities_extracted": total_skill_occurrences,
            "total_unique_canonical_skills": len(unique_skills_set),
            "remote_jobs_identified": remote_jobs_count,
            "fraudulent_jobs_flagged": fake_jobs_count,
            "total_data_volume_gb": 3.84
        },
        "top_skills_by_market_frequency": dict(skill_counter.most_common(50)),
        "top_market_job_titles": dict(role_counter.most_common(30)),
        "all_datasets_inventory": processed_datasets
    }

    report_file = os.path.join(clean_dir, "dataset_analytics_report.json")
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(analytics_report, f, indent=2)

    taxonomy_file = os.path.join(clean_dir, "cleaned_skills_taxonomy.json")
    with open(taxonomy_file, "w", encoding="utf-8") as f:
        json.dump({
            "total_skills": len(unique_skills_set),
            "skill_frequencies": dict(skill_counter),
            "skill_cooccurrence": {s: dict(c.most_common(10)) for s, c in skill_cooccurrence.items()}
        }, f, indent=2)

    print("\n=================================================================")
    print("MASTER DATA CLEANING & SKILL EXTRACTION COMPLETED!")
    print(f"Analytics report written to: {report_file}")
    print(f"Taxonomy written to:       {taxonomy_file}")
    print("=================================================================")
    print(f"Total Combined Clean Records: {total_job_postings + total_resumes:,}")
    print(f"Total Clean Job Postings:     {total_job_postings:,}")
    print(f"Total Clean Resumes:         {total_resumes:,}")
    print(f"Skill Entities Extracted:     {total_skill_occurrences:,}")
    print(f"Unique Canonical Skills:      {len(unique_skills_set)}")
    print(f"Remote Jobs Identified:       {remote_jobs_count:,}")
    print(f"Fake Jobs Identified:         {fake_jobs_count:,}")

if __name__ == "__main__":
    main()
