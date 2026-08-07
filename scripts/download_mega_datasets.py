# updated
import urllib.request
import os
import gzip
import shutil
import sys

def download_file(url, target_path):
    print(f"Downloading {url} -> {target_path} ...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp, open(target_path, 'wb') as out_file:
        total_length = resp.getheader('Content-Length')
        if total_length:
            total_bytes = int(total_length)
            print(f"File size: {total_bytes / (1024*1024):.2f} MB")
        
        downloaded = 0
        block_size = 1024 * 1024  # 1MB
        while True:
            buffer = resp.read(block_size)
            if not buffer:
                break
            downloaded += len(buffer)
            out_file.write(buffer)
            if total_length:
                percent = (downloaded / total_bytes) * 100
                print(f"Progress: {percent:.1f}% ({downloaded / (1024*1024):.1f} MB)", end='\r')
    print(f"\nSuccessfully downloaded: {target_path} ({os.path.getsize(target_path) / (1024*1024):.2f} MB)")

def main():
    os.makedirs('data/mega', exist_ok=True)
    os.makedirs('data/india', exist_ok=True)

    # 1. HuggingFace data_jobs.csv (786,000+ job listings)
    data_jobs_url = 'https://huggingface.co/datasets/lukebarousse/data_jobs/resolve/main/data_jobs.csv'
    data_jobs_path = 'data/mega/data_jobs.csv'
    if not os.path.exists(data_jobs_path) or os.path.getsize(data_jobs_path) < 1000000:
        download_file(data_jobs_url, data_jobs_path)
    else:
        print(f"Found existing {data_jobs_path} ({os.path.getsize(data_jobs_path) / (1024*1024):.2f} MB)")

    # 2. Skill2Vec 50K dataset
    skill50k_gz_url = 'https://raw.githubusercontent.com/duyet/skill2vec-dataset/master/skill2vec_50K.csv.gz'
    skill50k_gz_path = 'data/mega/skill2vec_50K.csv.gz'
    skill50k_csv_path = 'data/mega/skill2vec_50K.csv'
    
    if not os.path.exists(skill50k_csv_path):
        download_file(skill50k_gz_url, skill50k_gz_path)
        print(f"Decompressing {skill50k_gz_path}...")
        with gzip.open(skill50k_gz_path, 'rb') as f_in:
            with open(skill50k_csv_path, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        print(f"Extracted {skill50k_csv_path} ({os.path.getsize(skill50k_csv_path) / (1024*1024):.2f} MB)")
    else:
        print(f"Found existing {skill50k_csv_path}")

    print("\nAll mega datasets downloaded successfully! Ready for 800K+ model training.")

if __name__ == '__main__':
    main()
