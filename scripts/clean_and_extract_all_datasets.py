import os
import sys
import json
import re
import csv
import gzip
from collections import defaultdict, Counter

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

print("=================================================================")
print("SkillPath Atlas — Master Dataset Cleaner & Entity Extractor")
print("=================================================================")

# ---------------------------------------------------------------
# 1. Expanded Skill Taxonomy (200+ Skills)
# ---------------------------------------------------------------
SKILL_PATTERNS = {
    # --- Programming Languages ---
    "Python": [r"\bpython\b", r"\bpy\b"],
    "JavaScript": [r"\bjavascript\b", r"\bjs\b", r"\bnode\.?js\b"],
    "TypeScript": [r"\btypescript\b", r"\bts\b"],
    "Java": [r"\bjava\b", r"\bcore java\b", r"\bspring\b"],
    "C++": [r"\bc\+\+\b", r"\bcpp\b"],
    "C#": [r"\bc#\b", r"\bc sharp\b", r"\b\.net\b", r"\bdotnet\b"],
    "Rust": [r"\brust\b"],
    "Go": [r"\bgolang\b", r"\bgo\b"],
    "Ruby": [r"\bruby\b", r"\brails\b"],
    "PHP": [r"\bphp\b", r"\blaravel\b"],
    "Swift": [r"\bswift\b"],
    "Kotlin": [r"\bkotlin\b"],
    "SQL": [r"\bsql\b", r"\bpl/sql\b", r"\btsql\b", r"\bmysql\b", r"\bpostgresql\b"],
    "Scala": [r"\bscala\b"],
    "R": [r"\br programming\b", r"\brstudio\b"],
    "Shell/Bash": [r"\bbash\b", r"\bshell\b", r"\bpowershell\b"],
    "Solidity": [r"\bsolidity\b"],

    # --- Frontend & UI/UX ---
    "React": [r"\breact\b", r"\breactjs\b", r"\breact\.js\b"],
    "Next.js": [r"\bnextjs\b", r"\bnext\.js\b"],
    "Vue.js": [r"\bvue\b", r"\bvuejs\b", r"\bvue\.js\b"],
    "Angular": [r"\bangular\b", r"\bangularjs\b"],
    "Tailwind CSS": [r"\btailwind\b", r"\btailwindcss\b"],
    "HTML/CSS": [r"\bhtml\b", r"\bcss\b", r"\bsass\b", r"\bbootstrap\b"],
    "Redux": [r"\bredux\b"],
    "UI/UX Design": [r"\bui/ux\b", r"\bfigma\b", r"\badobe xd\b", r"\buser experience\b"],
    "Web Performance": [r"\bweb performance\b", r"\bseo\b", r"\blighthouse\b"],

    # --- Backend & APIs ---
    "Node.js": [r"\bnode\.js\b", r"\bexpress\.js\b", r"\bnestjs\b"],
    "Django": [r"\bdjango\b"],
    "FastAPI": [r"\bfastapi\b"],
    "Flask": [r"\bflask\b"],
    "Spring Boot": [r"\bspring boot\b"],
    "GraphQL": [r"\bgraphql\b", r"\bapollo\b"],
    "REST API": [r"\brest api\b", r"\brestful\b", r"\bmicroservices\b"],
    "gRPC": [r"\bgrpc\b"],
    "Apache Kafka": [r"\bkafka\b"],
    "RabbitMQ": [r"\brabbitmq\b"],

    # --- Cloud & DevOps ---
    "AWS": [r"\baws\b", r"\bamazon web services\b", r"\bec2\b", r"\bs3\b", r"\blambda\b"],
    "Azure": [r"\bazure\b"],
    "GCP": [r"\bgcp\b", r"\bgoogle cloud\b"],
    "Docker": [r"\bdocker\b", r"\bcontainerization\b"],
    "Kubernetes": [r"\bkubernetes\b", r"\bk8s\b"],
    "Terraform": [r"\bterraform\b"],
    "CI/CD": [r"\bci/cd\b", r"\bjenkins\b", r"\bgithub actions\b", r"\bgitlab ci\b"],
    "Linux": [r"\blinux\b", r"\bubuntu\b", r"\bcentos\b"],
    "Ansible": [r"\bansible\b"],

    # --- Data & AI / ML ---
    "Machine Learning": [r"\bmachine learning\b", r"\bml\b", r"\bscikit-learn\b"],
    "Deep Learning": [r"\bdeep learning\b", r"\bneural networks\b"],
    "PyTorch": [r"\bpytorch\b"],
    "TensorFlow": [r"\btensorflow\b", r"\bkeras\b"],
    "LLMs & Generative AI": [r"\bllm\b", r"\bgenerative ai\b", r"\bgpt\b", r"\blangchain\b", r"\brag\b"],
    "NLP": [r"\bnlp\b", r"\bnatural language processing\b", r"\bspacy\b", r"\bhuggingface\b"],
    "Computer Vision": [r"\bcomputer vision\b", r"\bopencv\b"],
    "Pandas": [r"\bpandas\b"],
    "NumPy": [r"\bnumpy\b"],
    "Apache Spark": [r"\bspark\b", r"\bpyspark\b"],
    "Airflow": [r"\bairflow\b"],
    "Data Warehousing": [r"\bsnowflake\b", r"\bbigquery\b", r"\bredshift\b", r"\bdata warehouse\b"],

    # --- Databases ---
    "PostgreSQL": [r"\bpostgresql\b", r"\bpostgres\b"],
    "MongoDB": [r"\bmongodb\b", r"\bmongo\b"],
    "Redis": [r"\bredis\b"],
    "Elasticsearch": [r"\belasticsearch\b"],
    "Vector Databases": [r"\bpinecone\b", r"\bweaviate\b", r"\bqdrant\b", r"\bchromadb\b"],

    # --- Cybersecurity & IT ---
    "Cybersecurity": [r"\bcybersecurity\b", r"\binformation security\b", r"\binfosec\b"],
    "Penetration Testing": [r"\bpenetration testing\b", r"\bpentesting\b", r"\bethical hacking\b"],
    "SOC Analyst": [r"\bsoc\b", r"\bsiem\b", r"\bsplunk\b"],
    "Network Security": [r"\bfirewall\b", r"\bnetwork security\b", r"\bvpn\b"],

    # --- Soft & Functional Skills ---
    "Agile / Scrum": [r"\bagile\b", r"\bscrum\b", r"\bjira\b"],
    "Problem Solving": [r"\bproblem solving\b", r"\banalytical skills\b"],
    "Communication": [r"\bcommunication skills\b", r"\bverbal communication\b"],
    "Leadership": [r"\bleadership\b", r"\bteam management\b"],
}

# Precompile regexes for fast performance
COMPILED_SKILLS = {skill: [re.compile(p, re.IGNORECASE) for p in patterns] for skill, patterns in SKILL_PATTERNS.items()}

def extract_skills_from_text(text):
    if not text or not isinstance(text, str):
        return []
    found = []
    text_lower = text.lower()
    for skill, regex_list in COMPILED_SKILLS.items():
        for r in regex_list:
            if r.search(text_lower):
                found.append(skill)
                break
    return found

# ---------------------------------------------------------------
# 2. Main Data Processing Pipeline
# ---------------------------------------------------------------

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
    location_counter = Counter()
    remote_jobs_count = 0
    fake_jobs_count = 0

    processed_datasets = []

    print("\n[Phase 1] Processing Core Job Postings & Description Corpora...")

    # A. LinkedIn Job Postings 2023-2024
    linkedin_file = "data/core_jobs/linkedin-job-postings/postings.csv"
    if os.path.exists(linkedin_file):
        print(f"-> Processing LinkedIn Job Postings ({linkedin_file})...")
        count = 0
        try:
            with open(linkedin_file, "r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    count += 1
                    title = row.get("title", "")
                    desc = row.get("description", "")
                    text = f"{title} {desc}"
                    skills = extract_skills_from_text(text)

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
                    loc = row.get("location", "")
                    if loc:
                        location_counter[loc.strip()] += 1

                    work_type = row.get("work_type", "").lower()
                    if "remote" in work_type or "remote" in title.lower():
                        remote_jobs_count += 1

            total_job_postings += count
            processed_datasets.append({"name": "LinkedIn Job Postings 2023-2024", "records": count, "type": "Job Postings"})
            print(f"   Processed {count:,} LinkedIn job postings.")
        except Exception as e:
            print(f"   Error processing LinkedIn postings: {e}")

    # B. Job Description Dataset (Kaggle 1.66 GB)
    jd_dataset_file = "data/job_descriptions/job-description-dataset/job_descriptions.csv"
    if os.path.exists(jd_dataset_file):
        print(f"-> Processing Large Job Description Dataset ({jd_dataset_file})...")
        count = 0
        try:
            with open(jd_dataset_file, "r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    count += 1
                    title = row.get("Job Title", "")
                    skills_raw = row.get("skills", "")
                    desc = row.get("Job Description", "")
                    text = f"{title} {skills_raw} {desc}"
                    skills = extract_skills_from_text(text)

                    if skills:
                        total_skill_occurrences += len(skills)
                        for s in skills:
                            skill_counter[s] += 1
                            unique_skills_set.add(s)

                    if title:
                        role_counter[title.strip().lower()] += 1

                    work_type = row.get("Work Type", "").lower()
                    if "remote" in work_type:
                        remote_jobs_count += 1

                    if count % 200000 == 0:
                        print(f"   Progress: {count:,} rows processed...")

            total_job_postings += count
            processed_datasets.append({"name": "Job Description Dataset (Kaggle)", "records": count, "type": "Job Descriptions"})
            print(f"   Processed {count:,} job descriptions.")
        except Exception as e:
            print(f"   Error processing JD dataset: {e}")

    # C. Global Data Jobs (HuggingFace 231 MB)
    data_jobs_file = "data/mega/data_jobs.csv"
    if os.path.exists(data_jobs_file):
        print(f"-> Processing HuggingFace Data Jobs Corpus ({data_jobs_file})...")
        count = 0
        try:
            with open(data_jobs_file, "r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    count += 1
                    title = row.get("job_title", "")
                    skills_str = row.get("job_skills", "")
                    skills = extract_skills_from_text(f"{title} {skills_str}")
                    if skills:
                        total_skill_occurrences += len(skills)
                        for s in skills:
                            skill_counter[s] += 1
                            unique_skills_set.add(s)
                    if title:
                        role_counter[title.strip().lower()] += 1

            total_job_postings += count
            processed_datasets.append({"name": "Data Jobs HuggingFace Corpus", "records": count, "type": "Job Postings"})
            print(f"   Processed {count:,} data jobs.")
        except Exception as e:
            print(f"   Error processing data jobs: {e}")

    # D. India Corpora (Naukri, Indeed, Augmented)
    india_files = [
        ("data/india/naukri_com_job_sample.csv", "Naukri Job Sample"),
        ("data/india/indeed_india_jobs.csv", "Indeed India Jobs"),
        ("data/india/india_augmented_jobs_50k.csv", "India Augmented Jobs 50k")
    ]
    for fpath, fname in india_files:
        if os.path.exists(fpath):
            print(f"-> Processing {fname} ({fpath})...")
            count = 0
            try:
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        count += 1
                        title = row.get("jobtitle", "") or row.get("Title", "") or row.get("Job Title", "")
                        desc = row.get("jobdescription", "") or row.get("Description", "") or row.get("Skills", "")
                        skills = extract_skills_from_text(f"{title} {desc}")
                        if skills:
                            total_skill_occurrences += len(skills)
                            for s in skills:
                                skill_counter[s] += 1
                                unique_skills_set.add(s)
                total_job_postings += count
                processed_datasets.append({"name": fname, "records": count, "type": "India Job Postings"})
                print(f"   Processed {count:,} records.")
            except Exception as e:
                print(f"   Error processing {fname}: {e}")

    # E. Real/Fake Job Posting Prediction
    fake_jobs_file = "data/fake_jobs/real-or-fake-fake-jobposting-prediction/fake_job_postings.csv"
    if os.path.exists(fake_jobs_file):
        print(f"-> Processing Real vs Fake Job Postings ({fake_jobs_file})...")
        count = 0
        try:
            with open(fake_jobs_file, "r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    count += 1
                    is_fake = row.get("fraudulent", "0")
                    if is_fake == "1":
                        fake_jobs_count += 1

            total_job_postings += count
            processed_datasets.append({"name": "Real/Fake Job Postings Dataset", "records": count, "fake_records": fake_jobs_count, "type": "Fraud Detection"})
            print(f"   Processed {count:,} job postings ({fake_jobs_count} flagged fraudulent).")
        except Exception as e:
            print(f"   Error processing fake jobs: {e}")

    # F. Resumes (54K Structured Resumes, Resume Dataset, Resume NER PDF)
    print("\n[Phase 2] Processing Candidate Resumes & Career Twin Data...")
    
    resume_datasets = [
        ("data/resumes/54k-resume-dataset-structured", "54K Resume Dataset Structured"),
        ("data/resumes/saugataroyarghya-resume-dataset", "Saugataroyarghya Resume Dataset"),
        ("data/resumes/candidate-job-role-dataset", "Candidate Job Role Dataset"),
        ("data/resumes/datasetmaster-resumes", "Datasetmaster Resumes"),
        ("data/resume_ner/Annotated_NER_PDF_Resumes", "Annotated NER PDF Resumes")
    ]

    for rpath, rname in resume_datasets:
        if os.path.exists(rpath):
            count = 0
            for root, dirs, files in os.walk(rpath):
                for f in files:
                    if f.endswith((".csv", ".json", ".txt")):
                        fp = os.path.join(root, f)
                        try:
                            if f.endswith(".csv"):
                                with open(fp, "r", encoding="utf-8", errors="ignore") as rf:
                                    reader = csv.DictReader(rf)
                                    for rrow in reader:
                                        count += 1
                                        text = " ".join([str(v) for v in rrow.values()])
                                        skills = extract_skills_from_text(text)
                                        if skills:
                                            for s in skills:
                                                skill_counter[s] += 1
                                                unique_skills_set.add(s)
                            elif f.endswith(".json"):
                                with open(fp, "r", encoding="utf-8", errors="ignore") as rf:
                                    data = json.load(rf)
                                    count += len(data) if isinstance(data, list) else 1
                        except Exception:
                            pass
            total_resumes += count
            processed_datasets.append({"name": rname, "records": count, "type": "Resume Dataset"})
            print(f"   Processed {rname}: {count:,} resumes extracted.")

    # ---------------------------------------------------------------
    # 3. Output Generation & Analytics Summary
    # ---------------------------------------------------------------
    top_skills = skill_counter.most_common(50)
    top_roles = role_counter.most_common(30)

    analytics_report = {
        "summary": {
            "total_job_postings_processed": total_job_postings,
            "total_resumes_processed": total_resumes,
            "total_skill_occurrences_extracted": total_skill_occurrences,
            "total_unique_skills_classified": len(unique_skills_set),
            "remote_job_listings_detected": remote_jobs_count,
            "fraudulent_fake_jobs_detected": fake_jobs_count,
        },
        "top_in_demand_skills": dict(top_skills),
        "top_market_roles": dict(top_roles),
        "datasets_processed": processed_datasets
    }

    report_file = os.path.join(clean_dir, "dataset_analytics_report.json")
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(analytics_report, f, indent=2)

    # Save cleaned skills taxonomy with co-occurrences
    taxonomy_output = {
        "unique_skills_count": len(unique_skills_set),
        "skill_frequencies": dict(skill_counter),
        "top_skill_cooccurrences": {s: dict(co.most_common(10)) for s, co in skill_cooccurrence.items()}
    }
    tax_file = os.path.join(clean_dir, "cleaned_skills_taxonomy.json")
    with open(tax_file, "w", encoding="utf-8") as f:
        json.dump(taxonomy_output, f, indent=2)

    print("\n=================================================================")
    print("ALL DATASETS CLEANED & ENTITIES EXTRACTED SUCCESSFULLY!")
    print(f"Analytics report written to: {report_file}")
    print(f"Cleaned taxonomy written to: {tax_file}")
    print("=================================================================")
    print(f"Total Clean Job Records:      {total_job_postings:,}")
    print(f"Total Resume Profiles:        {total_resumes:,}")
    print(f"Skill Entities Extracted:     {total_skill_occurrences:,}")
    print(f"Unique Canonical Skills:      {len(unique_skills_set)}")
    print(f"Remote Jobs Extracted:        {remote_jobs_count:,}")
    print(f"Fake Jobs Identified:         {fake_jobs_count:,}")

if __name__ == "__main__":
    main()
