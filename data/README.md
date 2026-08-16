# SkillPath Atlas — Datasets & Data Operating System

This directory houses all datasets powering **SkillPath Atlas**, our Agentic Talent Intelligence Operating System.

## Quick Start — Fetching Datasets

Run the master automated downloader script:

```bash
python scripts/download_all_datasets.py
```

- **Hugging Face Datasets & Models** and direct open datasets are downloaded automatically without authentication.
- **Kaggle Datasets** require Kaggle API credentials. Place your `kaggle.json` in `%USERPROFILE%\.kaggle\kaggle.json` or set `KAGGLE_USERNAME` and `KAGGLE_KEY` environment variables, then run `python scripts/download_all_datasets.py` to fetch all Kaggle corpora.

---

## Dataset Manifest (`data/dataset_manifest.json`)

The download script generates `data/dataset_manifest.json` tracking status, priorities, size, and paths for all datasets.

---

## Dataset Priority Levels

| Priority | Meaning |
|---|---|
| **P0** | Must-have core datasets for MVP |
| **P1** | Strongly recommended production datasets |
| **P2** | Useful domain enrichment datasets |
| **P3** | Optional / research signals |

---

## Catalog & Directory Layout

### 1. Core Job Market Datasets (`data/core_jobs/` & `data/mega/`)
- `data/mega/data_jobs.csv` (231.2 MB — 786,000+ job listings from HuggingFace `lukebarousse/data_jobs`)
- `LinkedIn Job Postings 2023–2024` (Kaggle: `arshkon/linkedin-job-postings`) [P0]
- `LinkedIn Job Posts Insights Dataset` (Kaggle: `sindhumadhurii/linkedin-job-posts-insights-dataset`) [P1]
- `Job Postings Dataset` (Kaggle: `moyukhbiswas/job-postings-dataset`) [P1]
- `AI-Powered Job Market Insights` (Kaggle: `uom190346a/ai-powered-job-market-insights`) [P0]

### 2. Resume & Career Twin Datasets (`data/resumes/` & `data/resume_ner/`)
- `54K Resume Dataset Structured` (Kaggle: `suriyaganesh/resume-dataset-structured`) [P0]
- `Candidate Job Role Dataset` (Kaggle: `ckshetty/candidate-job-role-dataset`) [P0]
- `Annotated NER PDF Resumes` (Hugging Face: `Mehyaar/Annotated_NER_PDF_Resumes`) [P1] -> `data/resume_ner/Annotated_NER_PDF_Resumes`
- `Resume Training Dataset` (Hugging Face: `MikePfung28/resume-training-dataset`) [P2] -> `data/resumes/resume-training-dataset`
- `Resumes Dataset` (Hugging Face: `datasetmaster/resumes`) [P2] -> `data/resumes/datasetmaster-resumes`

### 3. Resume-Job Matching Datasets (`data/matching/`)
- `Resume Job Description Fit` (Hugging Face: `cnamuangtoun/resume-job-description-fit`) [P0] -> `data/matching/resume-job-description-fit`
- `Resume and Job Description` (Kaggle: `pranavvenugo/resume-and-job-description`) [P0]

### 4. Skills Ontology and Skill Graph Datasets (`data/skill_graph/`)
- `Job Skill Set` (Hugging Face: `batuhanmtl/job-skill-set`) [P0] -> `data/skill_graph/job-skill-set`
- `Vacancy Job-to-Skill` (Hugging Face: `TechWolf/vacancy-job-to-skill`) [P0] -> `data/skill_graph/vacancy-job-to-skill`
- `Job Titles` (Hugging Face: `gpriday/job-titles`) [P0] -> `data/skill_graph/job-titles`
- `IT Job Titles and Descriptions` (Hugging Face: `NxtGenIntern/job_titles_and_descriptions`) [P1] -> `data/skill_graph/it_job_titles_and_descriptions`
- `Skill2Vec 50K Dataset` (`data/skill_graph/skill2vec_50K.csv.gz`) [P1]

### 5. Job Description Understanding Datasets (`data/job_descriptions/`)
- `Job Descriptions` (Hugging Face: `jacob-hugging-face/job-descriptions`) [P1] -> `data/job_descriptions/jacob-job-descriptions`
- `Recruitment Dataset Job Descriptions English` (Hugging Face: `lang-uk/recruitment-dataset-job-descriptions-english`) [P1] -> `data/job_descriptions/recruitment-dataset-job-descriptions-english`

### 6. Local Models (`data/models/`)
- `Resume NER BERT v2 Model` (Hugging Face: `yashpwr/resume-ner-bert-v2`) [P1] -> `data/models/resume-ner-bert-v2`

### 7. Regional & Preprocessed Data (`data/india/` & `skillpath/lib/data/`)
- `data/india/naukri_software_engineer.jsonl` (164 MB)
- `data/india/naukri_data_scientist.jsonl` (27.8 MB)
- `data/india/indeed_india_jobs.csv` (32.3 MB)
- `data/india/naukri_com_job_sample.csv` (52.1 MB)
- `skillpath/lib/data/mvc_model.json` (309 KB — Compiled Global Market Value & Skill Frequency Model)
- `skillpath/lib/data/mvc_model_india.json` (298 KB — Compiled India Market Value Model)

---

## Minimum Hackathon Dataset Pack

For rapid hackathon MVP iteration:
1. `LinkedIn Job Postings 2023–2024`
2. `54K Resume Dataset Structured`
3. `Resume Job Description Fit` (`data/matching/resume-job-description-fit`)
4. `Vacancy Job-to-Skill` (`data/skill_graph/vacancy-job-to-skill`)
5. `India Jobs Market & Salary` (`data/india/indeed_india_jobs.csv`)
6. `Real/Fake Job Posting Prediction`
