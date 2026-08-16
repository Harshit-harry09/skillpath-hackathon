import os
import sys
import json
import zipfile
import urllib.request
import shutil

def check_kaggle_auth():
    access_token_file = os.path.expanduser('~/.kaggle/access_token')
    if os.path.exists(access_token_file):
        try:
            with open(access_token_file, 'r', encoding='utf-8') as f:
                token = f.read().strip()
                if token:
                    os.environ['KAGGLE_API_TOKEN'] = token
                    return True
        except Exception:
            pass

    kaggle_json = os.path.expanduser('~/.kaggle/kaggle.json')
    has_env = os.environ.get('KAGGLE_USERNAME') and os.environ.get('KAGGLE_KEY')
    has_token_env = os.environ.get('KAGGLE_API_TOKEN')
    has_file = os.path.exists(kaggle_json)
    return bool(has_env or has_token_env or has_file)

def download_hf_dataset(repo_id, local_dir):
    print(f"\n--- Downloading HuggingFace Dataset: {repo_id} -> {local_dir} ---")
    os.makedirs(local_dir, exist_ok=True)
    try:
        from huggingface_hub import snapshot_download
        snapshot_download(repo_id=repo_id, repo_type="dataset", local_dir=local_dir)
        print(f"SUCCESS: {repo_id} downloaded to {local_dir}")
        return True
    except Exception as e:
        print(f"ERROR downloading HF dataset {repo_id}: {e}")
        return False

def download_hf_model(repo_id, local_dir):
    print(f"\n--- Downloading HuggingFace Model: {repo_id} -> {local_dir} ---")
    os.makedirs(local_dir, exist_ok=True)
    try:
        from huggingface_hub import snapshot_download
        snapshot_download(repo_id=repo_id, local_dir=local_dir)
        print(f"SUCCESS Model: {repo_id} downloaded to {local_dir}")
        return True
    except Exception as e:
        print(f"ERROR downloading HF model {repo_id}: {e}")
        return False

def download_kaggle_dataset(dataset_handle, local_dir):
    print(f"\n--- Downloading Kaggle Dataset: {dataset_handle} -> {local_dir} ---")
    os.makedirs(local_dir, exist_ok=True)

    # Check if files already exist in directory
    if os.path.exists(local_dir) and len(os.listdir(local_dir)) > 0:
        total_sz = sum(os.path.getsize(os.path.join(local_dir, f)) for f in os.listdir(local_dir) if os.path.isfile(os.path.join(local_dir, f)))
        if total_sz > 5000:
            print(f"Already downloaded Kaggle dataset: {dataset_handle} in {local_dir} ({total_sz/(1024*1024):.2f} MB)")
            return True

    try:
        import kaggle
        kaggle.api.authenticate()
        kaggle.api.dataset_download_files(dataset_handle, path=local_dir, unzip=True)
        print(f"SUCCESS Kaggle: {dataset_handle} downloaded to {local_dir}")
        return True
    except Exception as e:
        print(f"Kaggle download failed for {dataset_handle}: {e}")
        return False

def download_direct_url(url, target_path):
    print(f"\n--- Downloading Direct URL: {url} -> {target_path} ---")
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    if os.path.exists(target_path) and os.path.getsize(target_path) > 1000:
        print(f"Already exists: {target_path} ({os.path.getsize(target_path) / (1024*1024):.2f} MB)")
        return True
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp, open(target_path, 'wb') as out_file:
            shutil.copyfileobj(resp, out_file)
        print(f"SUCCESS: Direct URL downloaded to {target_path}")
        return True
    except Exception as e:
        print(f"ERROR downloading URL {url}: {e}")
        return False

DATASETS_CONFIG = [
    # 1. Hugging Face Datasets & Models
    {
        "name": "Resume Job Description Fit",
        "source": "HuggingFace",
        "type": "hf_dataset",
        "repo": "cnamuangtoun/resume-job-description-fit",
        "target": "data/matching/resume-job-description-fit",
        "priority": "P0",
        "category": "Resume-Job Matching"
    },
    {
        "name": "Job Skill Set",
        "source": "HuggingFace",
        "type": "hf_dataset",
        "repo": "batuhanmtl/job-skill-set",
        "target": "data/skill_graph/job-skill-set",
        "priority": "P0",
        "category": "Skills Ontology and Skill Graph"
    },
    {
        "name": "Vacancy Job-to-Skill",
        "source": "HuggingFace",
        "type": "hf_dataset",
        "repo": "TechWolf/vacancy-job-to-skill",
        "target": "data/skill_graph/vacancy-job-to-skill",
        "priority": "P0",
        "category": "Skills Ontology and Skill Graph"
    },
    {
        "name": "Job Titles",
        "source": "HuggingFace",
        "type": "hf_dataset",
        "repo": "gpriday/job-titles",
        "target": "data/skill_graph/job-titles",
        "priority": "P0",
        "category": "Skills Ontology and Skill Graph"
    },
    {
        "name": "IT Job Titles and Descriptions",
        "source": "HuggingFace",
        "type": "hf_dataset",
        "repo": "NxtGenIntern/job_titles_and_descriptions",
        "target": "data/skill_graph/it_job_titles_and_descriptions",
        "priority": "P1",
        "category": "Skills Ontology & Cybersecurity"
    },
    {
        "name": "Job Descriptions",
        "source": "HuggingFace",
        "type": "hf_dataset",
        "repo": "jacob-hugging-face/job-descriptions",
        "target": "data/job_descriptions/jacob-job-descriptions",
        "priority": "P1",
        "category": "Job Description Understanding"
    },
    {
        "name": "Recruitment Dataset Job Descriptions English",
        "source": "HuggingFace",
        "type": "hf_dataset",
        "repo": "lang-uk/recruitment-dataset-job-descriptions-english",
        "target": "data/job_descriptions/recruitment-dataset-job-descriptions-english",
        "priority": "P1",
        "category": "Job Description Understanding"
    },
    {
        "name": "Annotated NER PDF Resumes",
        "source": "HuggingFace",
        "type": "hf_dataset",
        "repo": "Mehyaar/Annotated_NER_PDF_Resumes",
        "target": "data/resume_ner/Annotated_NER_PDF_Resumes",
        "priority": "P1",
        "category": "Resume NER / Extraction"
    },
    {
        "name": "Resumes Dataset",
        "source": "HuggingFace",
        "type": "hf_dataset",
        "repo": "datasetmaster/resumes",
        "target": "data/resumes/datasetmaster-resumes",
        "priority": "P2",
        "category": "Resume and Career Twin"
    },
    {
        "name": "Resume NER BERT v2 Model",
        "source": "HuggingFace Model",
        "type": "hf_model",
        "repo": "yashpwr/resume-ner-bert-v2",
        "target": "data/models/resume-ner-bert-v2",
        "priority": "P1",
        "category": "Resume NER / Extraction Models"
    },
    {
        "name": "Skill2Vec 50K Dataset",
        "source": "GitHub Raw",
        "type": "direct_url",
        "url": "https://raw.githubusercontent.com/duyet/skill2vec-dataset/master/skill2vec_50K.csv.gz",
        "target": "data/skill_graph/skill2vec_50K.csv.gz",
        "priority": "P1",
        "category": "Skills Ontology and Skill Graph"
    },

    # 2. Kaggle Datasets
    {
        "name": "LinkedIn Job Postings 2023–2024",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "arshkon/linkedin-job-postings",
        "target": "data/core_jobs/linkedin-job-postings",
        "priority": "P0",
        "category": "Core Job Market Datasets"
    },
    {
        "name": "LinkedIn Job Posts Insights Dataset",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "sindhumadhurii/linkedin-job-posts-insights-dataset",
        "target": "data/core_jobs/linkedin-job-posts-insights",
        "priority": "P1",
        "category": "Core Job Market Datasets"
    },
    {
        "name": "Job Postings Dataset",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "moyukhbiswas/job-postings-dataset",
        "target": "data/core_jobs/job-postings-dataset",
        "priority": "P1",
        "category": "Core Job Market Datasets"
    },
    {
        "name": "Job Description Dataset",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "ravindrasinghrana/job-description-dataset",
        "target": "data/job_descriptions/job-description-dataset",
        "priority": "P2",
        "category": "Core Job Market Datasets"
    },
    {
        "name": "Online Job Postings",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "madhab/jobposts",
        "target": "data/core_jobs/online-job-postings",
        "priority": "P2",
        "category": "Core Job Market Datasets"
    },
    {
        "name": "Data Science Job Postings & Skills 2024",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "asaniczka/data-science-job-postings-and-skills",
        "target": "data/core_jobs/data-science-job-postings-and-skills",
        "priority": "P1",
        "category": "Core Job Market Datasets"
    },
    {
        "name": "AI-Powered Job Market Insights",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "uom190346a/ai-powered-job-market-insights",
        "target": "data/core_jobs/ai-powered-job-market-insights",
        "priority": "P0",
        "category": "Core Job Market Datasets"
    },
    {
        "name": "54K Resume Dataset Structured",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "suriyaganesh/resume-dataset-structured",
        "target": "data/resumes/54k-resume-dataset-structured",
        "priority": "P0",
        "category": "Resume and Career Twin"
    },
    {
        "name": "Resume Dataset",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "saugataroyarghya/resume-dataset",
        "target": "data/resumes/saugataroyarghya-resume-dataset",
        "priority": "P1",
        "category": "Resume and Career Twin"
    },
    {
        "name": "Candidate Job Role Dataset",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "ckshetty/candidate-job-role-dataset",
        "target": "data/resumes/candidate-job-role-dataset",
        "priority": "P0",
        "category": "Resume and Career Twin"
    },
    {
        "name": "Strategeion Resume Skills",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "vingkan/strategeion-resume-skills",
        "target": "data/skill_graph/strategeion-resume-skills",
        "priority": "P1",
        "category": "Resume and Career Twin"
    },
    {
        "name": "Updated Resume Dataset",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "jillanisofttech/updated-resume-dataset",
        "target": "data/resumes/updated-resume-dataset",
        "priority": "P2",
        "category": "Resume and Career Twin"
    },
    {
        "name": "Resume and Job Description",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "pranavvenugo/resume-and-job-description",
        "target": "data/matching/resume-and-job-description",
        "priority": "P0",
        "category": "Resume-Job Matching"
    },
    {
        "name": "AI-Powered Resume Screening Dataset 2025",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "mdtalhask/ai-powered-resume-screening-dataset-2025",
        "target": "data/matching/ai-powered-resume-screening-2025",
        "priority": "P1",
        "category": "Resume-Job Matching"
    },
    {
        "name": "Resume Entities for NER",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "dataturks/resume-entities-for-ner",
        "target": "data/resume_ner/dataturks-resume-entities-for-ner",
        "priority": "P1",
        "category": "Resume NER / Extraction"
    },
    {
        "name": "Salary Data with Gender",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "mohithsairamreddy/salary-data",
        "target": "data/salary/salary-data-gender",
        "priority": "P0",
        "category": "Salary Intelligence Datasets"
    },
    {
        "name": "Years of Experience and Salary Dataset",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "rohankayan/years-of-experience-and-salary-dataset",
        "target": "data/salary/years-experience-salary",
        "priority": "P2",
        "category": "Salary Intelligence Datasets"
    },
    {
        "name": "Predict Data Scientists Salary in India",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "ankitkalauni/predict-the-data-scientists-salary-in-india",
        "target": "data/salary/predict-ds-salary-india",
        "priority": "P2",
        "category": "Salary Intelligence Datasets"
    },
    {
        "name": "Data Professionals Salary 2022 India",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "iamsouravbanerjee/analytics-industry-salaries-2022-india",
        "target": "data/salary/data-professionals-salary-2022-india",
        "priority": "P2",
        "category": "Salary Intelligence Datasets"
    },
    {
        "name": "Salary Cyber Security Jobs",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "dannyrevaldo/salary-cyber-security-jobs",
        "target": "data/salary/salary-cyber-security-jobs",
        "priority": "P1",
        "category": "Salary Intelligence & Cybersecurity"
    },
    {
        "name": "RemoteOK Dataset",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "fattyacid11/remoteok-io-dataset",
        "target": "data/remote/remoteok-io-dataset",
        "priority": "P0",
        "category": "Remote Job Datasets"
    },
    {
        "name": "We Work Remotely Job Dataset",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "aritra04/we-work-remotely-job-dataset",
        "target": "data/remote/we-work-remotely-job-dataset",
        "priority": "P1",
        "category": "Remote Job Datasets"
    },
    {
        "name": "Remote Tech Jobs",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "keertikeerti/remote-tech-jobs",
        "target": "data/remote/remote-tech-jobs",
        "priority": "P0",
        "category": "Remote Job Datasets"
    },
    {
        "name": "Remote Job Market Analysis: 1500+ Jobs",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "mmujtabamujtaba/remote-job-market-analysis-1500-jobs-dataset",
        "target": "data/remote/remote-job-market-analysis-1500-jobs",
        "priority": "P2",
        "category": "Remote Job Datasets"
    },
    {
        "name": "Real/Fake Job Posting Prediction",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "shivamb/real-or-fake-fake-jobposting-prediction",
        "target": "data/fake_jobs/real-or-fake-fake-jobposting-prediction",
        "priority": "P0",
        "category": "Fake Job Detection"
    },
    {
        "name": "Remote Work & Mental Health",
        "source": "Kaggle",
        "type": "kaggle",
        "repo": "waqi786/remote-work-and-mental-health",
        "target": "data/inclusion/remote-work-and-mental-health",
        "priority": "P3",
        "category": "Inclusion & Accessibility"
    }
]

def get_dir_size_mb(directory):
    if not os.path.exists(directory):
        return 0.0
    total = 0
    for root, dirs, files in os.walk(directory):
        for f in files:
            fp = os.path.join(root, f)
            if os.path.exists(fp):
                total += os.path.getsize(fp)
    return round(total / (1024 * 1024), 2)

def main():
    print("=================================================================")
    print("SkillPath Atlas — Master Dataset Downloader & Cataloger")
    print("=================================================================")

    kaggle_auth = check_kaggle_auth()
    if kaggle_auth:
        print("[INFO] Kaggle API token successfully verified!")
    else:
        print("[WARN] Kaggle API token NOT detected.")

    manifest = []

    for item in DATASETS_CONFIG:
        ds_type = item["type"]
        target = item["target"]
        priority = item["priority"]
        name = item["name"]

        status = "Failed"

        if ds_type == "hf_dataset":
            ok = download_hf_dataset(item["repo"], target)
            status = "Downloaded" if ok else "Failed"
        elif ds_type == "hf_model":
            ok = download_hf_model(item["repo"], target)
            status = "Downloaded" if ok else "Failed"
        elif ds_type == "direct_url":
            ok = download_direct_url(item["url"], target)
            status = "Downloaded" if ok else "Failed"
        elif ds_type == "kaggle":
            if kaggle_auth:
                ok = download_kaggle_dataset(item["repo"], target)
                status = "Downloaded" if ok else "Failed"
            else:
                status = "Requires Kaggle Auth"

        size_mb = get_dir_size_mb(target) if os.path.isdir(target) else (round(os.path.getsize(target)/(1024*1024), 2) if os.path.exists(target) else 0.0)

        manifest.append({
            "name": name,
            "source": item["source"],
            "priority": priority,
            "category": item["category"],
            "target_path": target,
            "status": status,
            "size_mb": size_mb
        })

    manifest_path = "data/dataset_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print("\n=================================================================")
    print(f"Dataset Acquisition Complete! Manifest saved to {manifest_path}")
    print("=================================================================\n")

    print(f"{'Dataset Name':<45} | {'Source':<12} | {'Priority':<8} | {'Status':<20} | {'Size (MB)':<10}")
    print("-" * 105)
    for m in manifest:
        print(f"{m['name'][:44]:<45} | {m['source']:<12} | {m['priority']:<8} | {m['status']:<20} | {m['size_mb']:<10}")

if __name__ == "__main__":
    main()
