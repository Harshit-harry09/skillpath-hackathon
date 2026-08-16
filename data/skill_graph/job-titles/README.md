---
license: cc-by-4.0
language:
- en
size_categories:
- 10K<n<100K
task_categories:
- text-classification
- feature-extraction
pretty_name: Comprehensive Job Titles Dataset
tags:
- jobs
- occupations
- employment
- career
- human-resources
---

# Comprehensive Job Titles Dataset

A high-quality, deduplicated dataset of 65,248 unique job titles compiled from authoritative sources including ESCO (European Skills, Competences, Qualifications and Occupations), O*NET (Occupational Information Network), and OSCA (Occupational Skills and Competencies Australia).

## Dataset Description

This dataset provides a comprehensive collection of job titles that have been carefully processed to remove duplicates and near-duplicates using semantic similarity matching. It serves as a valuable resource for:

- **Job matching and recommendation systems**
- **Resume parsing and analysis**
- **Labor market research**
- **Career counseling applications**
- **HR technology development**
- **Natural language processing tasks related to employment**

## Dataset Structure

The dataset is provided in Parquet format with a single column:

- `job_title` (string): The standardized job title

### Example entries:
```
.NET Developer
2D Animation Artist
Accounting Clerk
Administrative Assistant
Agricultural Engineer
AI Research Scientist
Business Analyst
Chef
Data Scientist
```

## Sources

The dataset combines job titles from three major occupational classification systems:

1. **ESCO v1.2.0** (European Commission)
   - ~33,000 occupations with multilingual support
   - Includes preferred labels, alternative labels, and hidden labels
   - Structured according to ISCO-08 classification

2. **O*NET Database v29.3** (U.S. Department of Labor)
   - ~1,000 detailed occupational descriptions
   - Comprehensive taxonomy of U.S. occupations
   - Includes detailed job characteristics and requirements

3. **OSCA** (Australian Government)
   - Australian occupational classifications
   - Principal titles, alternative titles, and specializations

## Processing Pipeline

### 1. Extraction
Job titles were extracted from multiple source files:
- ESCO: Preferred labels and alternative labels from `occupations_en.csv`
- O*NET: Occupation titles from `Occupation Data.txt`
- OSCA: Principal titles and alternative titles from Excel files

### 2. Deduplication
A sophisticated deduplication process was applied:

- **Embedding Model**: `sentence-transformers/all-mpnet-base-v2`
- **Similarity Threshold**: 0.85 (cosine similarity)
- **Strategy**: Length-based blocking for efficiency
- **Preference**: Shorter titles retained (typically more general/common)

The deduplication process identified semantically similar job titles such as:
- "Software Developer" and "Software Engineer"
- "Administrative Assistant" and "Admin Assistant"
- "Customer Service Representative" and "Customer Service Rep"

### 3. Quality Control
- Removed exact duplicates (case-insensitive)
- Filtered out malformed entries
- Standardized formatting and capitalization
- Preserved diversity while eliminating redundancy

## Statistics

- **Total unique job titles**: 65,248
- **Original titles before deduplication**: ~100,000+
- **Reduction rate**: ~35% (semantic duplicates removed)
- **File size**: 756.7 KB (Parquet format with Snappy compression)

## Use Cases

### 1. Job Search and Matching
```python
import pandas as pd

# Load the dataset
df = pd.read_parquet('jobs.parquet')

# Search for data-related jobs
data_jobs = df[df['job_title'].str.contains('Data', case=False)]
```

### 2. Building Job Title Embeddings
```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-mpnet-base-v2')
job_titles = df['job_title'].tolist()
embeddings = model.encode(job_titles)
```

### 3. Job Title Standardization
Use this dataset as a reference for standardizing job titles in your organization or application.

## Limitations

- **Language**: English only (though source data includes multilingual options)
- **Geographic bias**: Stronger coverage of European, U.S., and Australian job markets
- **Temporal**: Reflects job titles as of 2025; emerging roles may not be included
- **Granularity**: Some highly specific or niche job titles may have been merged during deduplication

## License

This dataset combines data from multiple sources, each with their own licensing:
- ESCO: European Union Public License (EUPL)
- O*NET: Public domain (U.S. Government work)
- OSCA: Creative Commons Attribution 3.0 Australia

Please review the original source licenses for commercial use.

## Citation

If you use this dataset in your research or applications, please cite:

```bibtex
@dataset{jobs_dataset_2025,
  author = {Greg Priday},
  title = {Comprehensive Job Titles Dataset},
  year = {2025},
  publisher = {Hugging Face},
  url = {https://huggingface.co/datasets/gpriday/jobs}
}
```

## Acknowledgments

This dataset builds upon the excellent work of:
- European Commission (ESCO)
- U.S. Department of Labor (O*NET)
- Australian Government (OSCA)

## Contact

For questions, suggestions, or contributions, please open an issue on the dataset repository.